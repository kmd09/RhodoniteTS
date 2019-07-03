import RnObject from "../core/RnObject";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo, ShaderSemanticsClass, ShaderSemantics } from "../definitions/ShaderSemantics";
import { CompositionType } from "../definitions/CompositionType";
import MathClassUtil from "../math/MathClassUtil";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { ComponentType } from "../definitions/ComponentType";
import Vector2 from "../math/Vector2";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { runInThisContext } from "vm";
import GLSLShader, { AttributeNames } from "../../webgl/shaders/GLSLShader";
import { pathExists } from "fs-extra";
import { VertexAttributeEnum } from "../main";
import { VertexAttribute } from "../definitions/VertexAttribute";
import AbstractTexture from "../textures/AbstractTexture";
import MemoryManager from "../core/MemoryManager";
import { BufferUse } from "../definitions/BufferUse";
import Config from "../core/Config";
import BufferView from "../memory/BufferView";
import Accessor from "../memory/Accessor";

type MaterialTypeName = string;
type PropertyName = string;

export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<PropertyName, any> = new Map();
  private __fieldsInfo: Map<PropertyName, ShaderSemanticsInfo> = new Map();
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public alphaMode = AlphaMode.Opaque;
  private static __shaderMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __materials: Material[] = [];
  private __materialTid: Index;
  private static __materialTidCount = -1;

  private static __materialTids: Map<MaterialTypeName, Index> = new Map();
  private static __materialTypes: Map<MaterialTypeName, AbstractMaterialNode[]> = new Map();
  private static __maxInstances: Map<MaterialTypeName, number> = new Map();
  private __materialTypeName: MaterialTypeName;
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<MaterialTypeName, Map<PropertyName, Accessor>> = new Map();

  private constructor(materialTid: Index, materialTypeName: string, materialNodes: AbstractMaterialNode[]) {
    super();
    this.__materialNodes = materialNodes;
    this.__materialTid = materialTid;
    this.__materialTypeName = materialTypeName;

    Material.__materials.push(this);
    this.initialize();
  }

  get materialTID() {
    return this.__materialTid;
  }

  get fieldsInfoArray() {
    return Array.from(this.__fieldsInfo.values())
  }

  static createMaterial(materialTypeName: string) {
    if (Material.__materialTypes.has(materialTypeName)) {
      const materialNodes = Material.__materialTypes.get(materialTypeName)!;
      return new Material(Material.__materialTids.get(materialTypeName)!, materialTypeName, materialNodes);
    }

    return void 0;
  }

  private static __allocateBufferView(materialTypeName: string, materialNodes: AbstractMaterialNode[]) {
    let sumSizeInByte = 0;
    for (let materialNode of materialNodes) {
      for (let semanticInfo of materialNode._semanticsInfoArray) {
        const compsitionNumber = semanticInfo.compositionType.getNumberOfComponents();
        const componentSizeInByte = semanticInfo.componentType.getSizeInBytes();
        sumSizeInByte += compsitionNumber * componentSizeInByte;
        if (!this.__accessors.has(materialTypeName)) {
          this.__accessors.set(materialTypeName, new Map());
        }
      }
    }

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.UBOGeneric);
    const bufferView = buffer.takeBufferView({
      byteLengthToNeed: sumSizeInByte * Material.__maxInstances.get(materialTypeName)!,
      byteStride: 0,
      isAoS: false
    });
    this.__bufferViews.set(materialTypeName, bufferView);

    for (let materialNode of materialNodes) {
      for (let semanticInfo of materialNode._semanticsInfoArray) {
        const properties = this.__accessors.get(materialTypeName)!;
        const accessor = bufferView.takeAccessor({
          compositionType: semanticInfo.compositionType,
          componentType: ComponentType.Float,
          count: Material.__maxInstances.get(materialTypeName)!
        });
        properties.set(ShaderSemantics.infoToString(semanticInfo)!, accessor);
      }
    }

    return bufferView;
  }

  static registerMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstancesNumber: number = Config.maxMaterialInstanceForEachType) {
    if (!Material.__materialTypes.has(materialTypeName)) {
      Material.__materialTypes.set(materialTypeName, materialNodes);

      const materialTid = ++Material.__materialTidCount;
      Material.__materialTids.set(materialTypeName, materialTid);
      Material.__maxInstances.set(materialTypeName, maxInstancesNumber);

      Material.__allocateBufferView(materialTypeName, materialNodes);

      return true;
    } else {
      console.info(`${materialTypeName} is already registered.`);
      return false;
    }
  }

  static getAllMaterials() {
    return Material.__materials;
  }

  setMaterialNodes(materialNodes: AbstractMaterialNode[]) {
    this.__materialNodes = materialNodes;
  }

  initialize() {
    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      semanticsInfoArray.forEach((semanticsInfo)=>{
        const propertyName = ShaderSemantics.infoToString(semanticsInfo)!;
        const accessorMap = Material.__accessors.get(this.__materialTypeName);
        const accessor = accessorMap!.get(propertyName) as Accessor;
        const typedArray = accessor.takeOne() as Float32Array;
        this.__fields.set(
          propertyName,
          MathClassUtil.initWithFloat32Array(
            semanticsInfo.initialValue,
            semanticsInfo.initialValue,
            typedArray
          ));
        this.__fieldsInfo.set(propertyName, semanticsInfo);
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any): void;
  setParameter(shaderSemantic: string, value: any): void;
  setParameter(shaderSemantic: any, value: any): void {
    let shaderSemanticStr: string;
    if (typeof shaderSemantic === 'string') {
      shaderSemanticStr = shaderSemantic;
    } else {
      shaderSemanticStr = shaderSemantic.str;
    }
    if (this.__fieldsInfo.has(shaderSemanticStr)) {
      const valueObj = this.__fields.get(shaderSemanticStr);
      if (isNaN(valueObj)) { // if not number
        MathClassUtil._setForce(valueObj, value);
        this.__fields.set(shaderSemanticStr, valueObj);
      } else {
        this.__fields.set(shaderSemanticStr, value);
      }

    }
  }

  setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
  setTextureParameter(shaderSemantic: string, value: AbstractTexture): void;
  setTextureParameter(shaderSemantic: any, value: AbstractTexture): void {
    let shaderSemanticStr: string;
    if (typeof shaderSemantic === 'string') {
      shaderSemanticStr = shaderSemantic;
    } else {
      shaderSemanticStr = shaderSemantic.str;
    }

    if (this.__fieldsInfo.has(shaderSemanticStr)) {
      const array = this.__fields.get(shaderSemanticStr)!;
      this.__fields.set(shaderSemanticStr, [array[0], value]);
    }
  }

  getParameter(shaderSemantic: ShaderSemanticsEnum): any;
  getParameter(shaderSemantic: string): any;
  getParameter(shaderSemantic: any): any {
    if (typeof shaderSemantic === 'string') {
      return this.__fields.get(shaderSemantic);
    } else {
      return this.__fields.get(shaderSemantic.str);
    }
  }

  setUniformLocations(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const map: Map<string, ShaderSemanticsInfo> = new Map();
    let array: ShaderSemanticsInfo[] = [];
    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, array);
  }

  setUniformValues(firstTime: boolean) {
    const shaderProgramUid = this._shaderProgramUid;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const shaderProgram = webglResourceRepository.getWebGLResource(shaderProgramUid) as any;

    this.__fields.forEach((value, key) => {
      webglResourceRepository.setUniformValue(shaderProgram, key, firstTime, value);
    });
  }

  createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialNode = this.__materialNodes[0];
    const glslShader = materialNode.shader;

    // Shader Construction
    let vertexShader = glslShader.glslBegin +
      `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
` +
      vertexShaderMethodDefinitions_uniform +
      glslShader.vertexShaderDefinitions +
      glslShader.glslMainBegin +
      glslShader.vertexShaderBody +
      glslShader.glslMainEnd;
    let fragmentShader = glslShader.pixelShaderBody;

    const shaderCharCount = (vertexShader + fragmentShader).length;

    // Cache
    if (Material.__shaderMap.has(shaderCharCount)) {
      this._shaderProgramUid = Material.__shaderMap.get(shaderCharCount)!;
      return this._shaderProgramUid;
    } else {
      this._shaderProgramUid = webglResourceRepository.createShaderProgram(
        {
          vertexShaderStr: vertexShader,
          fragmentShaderStr: fragmentShader,
          attributeNames: glslShader.attributeNames,
          attributeSemantics: glslShader.attributeSemantics
        }
      );
      Material.__shaderMap.set(shaderCharCount, this._shaderProgramUid);
      return this._shaderProgramUid;
    }
  }

  createProgramString(vertexShaderMethodDefinitions_uniform = '') {

    // Find Start Node
    let firstMaterialNodeVertex: AbstractMaterialNode;
    let firstMaterialNodePixel: AbstractMaterialNode;
    for (let i = 0; i < this.__materialNodes.length; i++) {
      const materialNode = this.__materialNodes[i];
      if (materialNode.vertexInputConnections.length === 0) {
        firstMaterialNodeVertex = materialNode;
      }
      if (materialNode.pixelInputConnections.length === 0) {
        firstMaterialNodePixel = materialNode;
      }
    }

    // Topological Sorting
    const ignoredInputUidsVertex: Index[] = [firstMaterialNodeVertex!.materialNodeUid];
    const sortedNodeArrayVertex: AbstractMaterialNode[] = [firstMaterialNodeVertex!];
    const ignoredInputUidsPixel: Index[] = [firstMaterialNodePixel!.materialNodeUid];
    const sortedNodeArrayPixel: AbstractMaterialNode[] = [firstMaterialNodePixel!];
    /// delete first nodes from existing array
    const materialNodesVertex = this.__materialNodes.concat();
    const materialNodesPixel = this.__materialNodes.concat();
    materialNodesVertex.splice(materialNodesVertex.indexOf(firstMaterialNodeVertex!), 1);
    materialNodesPixel.splice(materialNodesPixel.indexOf(firstMaterialNodePixel!), 1);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesVertex.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.vertexInputConnections) {
          if (ignoredInputUidsVertex.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayVertex.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsVertex.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesVertex.splice(materialNodesVertex.indexOf(materialNodeWhichHasNoInputs!), 1);

    } while (materialNodesVertex.length !== 0);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesPixel.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.pixelInputConnections) {
          if (ignoredInputUidsPixel.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayPixel.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsPixel.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesPixel.splice(materialNodesPixel.indexOf(materialNodeWhichHasNoInputs!), 1);
    } while (materialNodesPixel.length !== 0);

    // Get GLSL Beginning code
    let vertexShader = firstMaterialNodeVertex!.shader.glslBegin;
    let pixelShader = firstMaterialNodeVertex!.shader.glslBegin;

    // attribute variables definitions in Vertex Shader
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const attributeNames = materialNode.shader.attributeNames;
      const attributeSemantics = materialNode.shader.attributeSemantics;
      const attributeCompositions = materialNode.shader.attributeCompositions;
      for (let j = 0; j < attributeSemantics.length; j++) {
        const attributeName = attributeNames[j];
        const attributeComposition = attributeCompositions[j];
        vertexShader += `${attributeComposition.getGlslStr(ComponentType.Float)} ${attributeName};\n`;
      }
    }
    vertexShader += '\n';

    // uniform variables definitions
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        vertexShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.singularStr};\n`;
      }
    }
    vertexShader += '\n';
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        pixelShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.singularStr};\n`;
      }
    }
    pixelShader += '\n';


    // remove node which don't have inputConnections (except first node)
    const vertexMaterialNodes = [];
    const pixelMaterialNodes = [];
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      if (i === 0 || materialNode.vertexInputConnections.length > 0) {
        vertexMaterialNodes.push(materialNode);
      }
    }
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      if (i === 0 || materialNode.pixelInputConnections.length > 0) {
        pixelMaterialNodes.push(materialNode);
      }
    }

    // Add additional functions by system

    vertexShader += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`
    vertexShader += vertexShaderMethodDefinitions_uniform;

    // function definitions
    const existFunctions: string[] = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      if (existFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      vertexShader += materialNode.shader.vertexShaderDefinitions;
      pixelShader += materialNode.shader.pixelShaderDefinitions;
      existFunctions.push(materialNode.shaderFunctionName);
    }

    // vertex main process
    {
      vertexShader += firstMaterialNodeVertex!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i = 1; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.vertexInputConnections.length; j++) {
          const inputConnection = materialNode.vertexInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getVertexInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          vertexShader += rowStr;
        }
        for (let j = i; j < vertexMaterialNodes.length; j++) {
          const materialNodeInner = vertexMaterialNodes[j];
          const prevMaterialNodeInner = vertexMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.vertexInputConnections.length; k++) {
            const inputConnection = materialNodeInner.vertexInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getVertexInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        vertexShader += rowStr;
      }

      vertexShader += firstMaterialNodeVertex!.shader.glslMainEnd;
    }

    // pixel main process
    {
      pixelShader += firstMaterialNodePixel!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i = 1; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.pixelInputConnections.length; j++) {
          const inputConnection = materialNode.pixelInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getPixelInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          pixelShader += rowStr;
        }
        for (let j = i; j < pixelMaterialNodes.length; j++) {
          const materialNodeInner = pixelMaterialNodes[j];
          const prevMaterialNodeInner = pixelMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.pixelInputConnections.length; k++) {
            const inputConnection = materialNodeInner.pixelInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getPixelInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        pixelShader += rowStr;
      }

      pixelShader += firstMaterialNodePixel!.shader.glslMainEnd;
    }


    let attributeNames: AttributeNames = [];
    let attributeSemantics: Array<VertexAttributeEnum> = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      Array.prototype.push.apply(attributeNames, materialNode.shader.attributeNames);
      Array.prototype.push.apply(attributeSemantics, materialNode.shader.attributeSemantics);
    }
    // remove duplicate values
    attributeNames = Array.from(new Set(attributeNames))
    attributeSemantics = Array.from(new Set(attributeSemantics))

    return { vertexShader, pixelShader, attributeNames, attributeSemantics };
  }

  createProgram(vertexShaderMethodDefinitions_uniform: string) {

    if (this.__materialNodes[0].isSingleOperation) {
      return this.createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform);
    } else {
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      let returnValue = this.createProgramString(vertexShaderMethodDefinitions_uniform);

      const shaderCharCount = (returnValue.vertexShader + returnValue.pixelShader).length;

      // Cache
      if (Material.__shaderMap.has(shaderCharCount)) {
        this._shaderProgramUid = Material.__shaderMap.get(shaderCharCount)!;
        return this._shaderProgramUid;
      } else {
        this._shaderProgramUid = webglResourceRepository.createShaderProgram(
          {
            vertexShaderStr: returnValue.vertexShader,
            fragmentShaderStr: returnValue.pixelShader,
            attributeNames: returnValue.attributeNames,
            attributeSemantics: returnValue.attributeSemantics
          }
        );
        Material.__shaderMap.set(shaderCharCount, this._shaderProgramUid);
        return this._shaderProgramUid;
      }
    }
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}

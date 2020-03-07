import AbstractShaderNode, { ShaderNodeUID } from "./AbstractShaderNode";
import { Index } from "../../../commontypes/CommonTypes";
import CGAPIResourceRepository from "../../renderer/CGAPIResourceRepository";
import { VertexAttribute } from "../../definitions/VertexAttribute";
import { ShaderType, ShaderTypeEnum } from "../../definitions/ShaderType";
import { ShaderSocket } from "./AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import GLSLShader from "../../../webgl/shaders/GLSLShader";
import mainPrerequisitesShaderityObject from "../../../webgl/shaderity_shaders/common/mainPrerequisites.glsl"
import prerequisitesShaderityObject from "../../../webgl/shaderity_shaders/common/prerequisites.glsl"
import IfStatementShaderNode from "../nodes/IfStatementShaderNode";
import BlockBeginShaderNode from "../nodes/BlockBeginShaderNode";
import BlockEndShaderNode from "../nodes/BlockEndShaderNode";

class IfState {
  ifIdx = -1;
  ifStrArray: string[] = [];
  ifConditionArray: string[]|undefined[] = [];
  ifContextNum = 0;
  ifContextCount = 0;
}

enum ProcessType {
  NORMAL,
  IF,
  FOR
}

export default class ShaderGraphResolver {

  static createVertexShaderCode(vertexNodes: AbstractShaderNode[]) {
    const shaderNodes = vertexNodes.concat();

    // Find Start Node
    let firstShaderNode: AbstractShaderNode = this.__findBeginNode(shaderNodes);

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(firstShaderNode, shaderNodes);

    // Add additional functions by system
    let vertexShaderPrerequisites = '';
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let in_ = 'attribute'
    if (webglResourceRepository.currentWebGLContextWrapper?.isWebGL2) {
      in_ = 'in'
    }
    vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}

    ${in_} float a_instanceID;\n`;
    vertexShaderPrerequisites += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`
    vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */'
    vertexShaderPrerequisites += '/* shaderity: @{getters} */'

    let shaderBody = ''

    // function definitions
    shaderBody += ShaderGraphResolver.getFunctionDefinition(sortedShaderNodes, ShaderType.VertexShader)

    // main process
    shaderBody += ShaderGraphResolver.__constructShaderWithNodes(sortedShaderNodes)

    const shader = vertexShaderPrerequisites + shaderBody;

    return { shader, shaderBody };
  }

  static createPixelShaderCode(pixelNodes: AbstractShaderNode[]) {
    const shaderNodes = pixelNodes.concat();

    // Find Start Node
    let firstShaderNode: AbstractShaderNode = this.__findBeginNode(shaderNodes);

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(firstShaderNode, shaderNodes);

    // Add additional functions by system
    let pixelShaderPrerequisites = '';
    pixelShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}
`
    pixelShaderPrerequisites += '/* shaderity: @{getters} */'

    let shaderBody = ''

    // function definitions
    shaderBody += ShaderGraphResolver.getFunctionDefinition(sortedShaderNodes, ShaderType.PixelShader)

    // main process
    shaderBody += ShaderGraphResolver.__constructShaderWithNodes(sortedShaderNodes)

    const shader = pixelShaderPrerequisites + shaderBody;

    return { shader, shaderBody };
  }

  private static __findBeginNode(shaderNodes: AbstractShaderNode[]) {
    let firstShaderNode: AbstractShaderNode | undefined;
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      if (shaderNode.inputConnections.length === 0) {
        firstShaderNode = shaderNode;
      }
    }
    return firstShaderNode!;
  }

  private static __sortTopologically(firstShaderNode: AbstractShaderNode, shaderNodes: AbstractShaderNode[]) {
    const ignoredInputUids: Index[] = [firstShaderNode!.shaderNodeUid];
    const sortedNodeArray: AbstractShaderNode[] = [firstShaderNode!];

    // remove node which don't have inputConnections (except first node)
    shaderNodes.splice(shaderNodes.indexOf(firstShaderNode!), 1);
    do {
      let shaderNodeWhichHasNoInputs: AbstractShaderNode;
      shaderNodes.forEach((shaderNode) => {
        let inputCount = 0;
        for (let inputConnection of shaderNode.inputConnections) {
          if (ignoredInputUids.indexOf(inputConnection.shaderNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          shaderNodeWhichHasNoInputs = shaderNode;
        }
      });
      sortedNodeArray.push(shaderNodeWhichHasNoInputs!);
      ignoredInputUids.push(shaderNodeWhichHasNoInputs!.shaderNodeUid);
      shaderNodes.splice(shaderNodes.indexOf(shaderNodeWhichHasNoInputs!), 1);

    } while (shaderNodes.length !== 0);

    return sortedNodeArray;
  }

  static getFunctionDefinition(shaderNodes: AbstractShaderNode[], shaderType: ShaderTypeEnum) {
    let shaderText = ''
    const existVertexFunctions: string[] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const materialNode = shaderNodes[i];
      if (existVertexFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      if (materialNode.shaderCode) {
        shaderText += materialNode.shaderCode;
      } else {
        if (shaderType === ShaderType.VertexShader) {
          shaderText += (materialNode.shader as any).vertexShaderDefinitions;
        } else {
          shaderText += (materialNode.shader as any).pixelShaderDefinitions;
        }
      }
      existVertexFunctions.push(materialNode.shaderFunctionName);
    }

    return shaderText;
  }

  private static __constructShaderWithNodes(materialNodes: AbstractShaderNode[]) {
      let shaderBody = ''
      const isAnyTypeInput = function(input: ShaderSocket) {
        return input.compositionType === CompositionType.Unknown ||
              input.componentType === ComponentType.Unknown;
      }
      shaderBody += GLSLShader.glslMainBegin;
      shaderBody += mainPrerequisitesShaderityObject.code;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      const existingInputs: ShaderNodeUID[] = [];
      const existingInputsVarName: string[] = [];
      const existingOutputsVarName: Map<ShaderNodeUID, string> = new Map()
      const existingOutputs: ShaderNodeUID[] = [];
      for (let i = 1; i < materialNodes.length; i++) {
        const materialNode = materialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        const inputConnections = materialNode.inputConnections
        for (let j = 0; j < inputConnections.length; j++) {
          const inputConnection = inputConnections[j];
          const inputNode = AbstractShaderNode.shaderNodes[inputConnection.shaderNodeUid];
          if (isAnyTypeInput(materialNode.getInputs()[j])) {
            continue
          }
          const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getInput(inputConnection.inputNameOfThis);
          let varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${materialNode.shaderNodeUid}`;
          if (existingInputsVarName.indexOf(varName) === -1) {
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const glslInitialValue = inputSocketOfThis!.compositionType.getGlslInitialValue(inputSocketOfThis!.componentType);
            const rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
            shaderBody += rowStr;
          }
          const existVarName = existingOutputsVarName.get(inputNode.shaderNodeUid);
          if (existVarName === varName) {
            // varName = existVarName;
          }
          varInputNames[i].push(varName);
          existingInputs.push(inputConnection.shaderNodeUid)
          existingInputsVarName.push(varName)
        }
        for (let j = i; j < materialNodes.length; j++) {
          const targetMaterialNode = materialNodes[j];
          const prevMaterialNodeInner = materialNodes[i - 1];
          const targetNodeInputConnections = targetMaterialNode.inputConnections
          for (let k = 0; k < targetNodeInputConnections.length; k++) {
            const inputConnection = targetNodeInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.shaderNodeUid !== prevMaterialNodeInner.shaderNodeUid) {
              continue;
            }
            const inputNode = AbstractShaderNode.shaderNodes[inputConnection.shaderNodeUid];
            if (!isAnyTypeInput(targetMaterialNode.getInputs()[k])) {
              if (existingOutputs.indexOf(inputNode.shaderNodeUid) === -1) {
                const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
                const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${targetMaterialNode.shaderNodeUid}`;

                if (i - 1 >= 0) {
                  varOutputNames[i - 1].push(varName);
                }
                existingOutputsVarName.set(inputConnection.shaderNodeUid, varName)
              }
              existingOutputs.push(inputConnection.shaderNodeUid)
            }
          }
        }

      }

      const ifState = new IfState();
      for (let i = 0; i < materialNodes.length; i++) {
        const materialNode = materialNodes[i];
        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (varOutputNames[i] == null) {
          varOutputNames[i] = [];
        }

        shaderBody += this.__makeCallFunctions(functionName, varInputNames[i], varOutputNames[i], materialNode, ifState);
      }

      shaderBody += GLSLShader.glslMainEnd;

      return shaderBody;
  }

  private static __makeCallFunctions(functionName: string, varInputNames: string[], varOutputNames: string[], shaderNode: AbstractShaderNode, ifState: IfState) {

    let shaderStr = '';

    const varNames = varInputNames.concat(varOutputNames);
    let [rowStr, process] = ShaderGraphResolver.processIf(functionName, varInputNames, ifState, shaderNode, varNames, shaderStr);

    if (process === ProcessType.NORMAL) {
      if (shaderNode.getInputs().length != varInputNames.length ||
        shaderNode.getOutputs().length != varOutputNames.length) {
        return rowStr;
      }
      rowStr += this.__makeCallFunctionStr(varNames, functionName);
    }


    return rowStr;
  }

  private static processIf(functionName: string, varInputNames: string[], ifState: IfState, shaderNode: AbstractShaderNode, varNames: string[], rowStr: string) {
    let processType = ProcessType.NORMAL;
    if (functionName === IfStatementShaderNode.functionName) {
      for (let j = 0; j < varInputNames.length; j++) {
        ifState.ifConditionArray[j] = varInputNames[j];
      }
      ifState.ifContextNum = shaderNode.getOutputs().length;
      processType = ProcessType.IF;
    }
    if (functionName.match(new RegExp(`^${BlockBeginShaderNode.functionName}_`))) {
      const elseIfMatch = shaderNode.inputConnections[0].outputNameOfPrev.match(new RegExp(`${IfStatementShaderNode.ElseIfStart}_(\\d)`));
      if (shaderNode.inputConnections[0].outputNameOfPrev === IfStatementShaderNode.IfStart) {
        ifState.ifIdx = 0;
        ifState.ifStrArray[ifState.ifIdx] = `if (${ifState.ifConditionArray[0]}) {\n`;
      }
      else if (elseIfMatch) {
        ifState.ifIdx = parseInt(elseIfMatch[1]) + 1;
        ifState.ifStrArray[ifState.ifIdx] = `else if (${ifState.ifConditionArray[ifState.ifIdx]}) {\n`;
      }
      else if (shaderNode.inputConnections[0].outputNameOfPrev === IfStatementShaderNode.ElseStart) {
        ifState.ifIdx = ifState.ifContextNum - 1;
        ifState.ifStrArray[ifState.ifIdx] = `else {\n`;
      }
      ifState.ifConditionArray[ifState.ifIdx] = undefined;
      processType = ProcessType.IF;
    }
    if (ifState.ifIdx !== -1) {
      ifState.ifStrArray[ifState.ifIdx] += this.__makeCallFunctionStr(varNames, functionName);
      processType = ProcessType.IF;
    }
    if (functionName.match(new RegExp(`^${BlockEndShaderNode.functionName}_`))) {
      ifState.ifStrArray[ifState.ifIdx] += `}\n`;
      ifState.ifContextCount++;
      ifState.ifIdx = -1;
      if (ifState.ifContextCount >= ifState.ifContextNum) {
        rowStr += ifState.ifStrArray.join('');
        ifState.ifContextNum = 0;
        ifState.ifContextCount = 0;
        ifState.ifStrArray.length = 0;
      }
      processType = ProcessType.IF;
    }
    return [rowStr, processType];
  }

  private static __makeCallFunctionStr(varNames: string[], functionName: string) {
    let rowStr = '';
    if (varNames.length > 0) {
      // Call node functions
      rowStr += `${functionName}(`;
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
    }

    return rowStr;
  }
}

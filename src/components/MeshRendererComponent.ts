import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import MeshComponent from './MeshComponent';
import WebGLResourceRepository, { VertexHandles } from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import RenderingPipeline from '../renderer/RenderingPipeline';
import Primitive from '../geometry/Primitive';
import WebGLStrategy from '../renderer/webgl/WebGLStrategy';
import getRenderingStrategy from '../renderer/webgl/getRenderingStrategy';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map()
  private __isVAOSet = false;
  private __webglRenderingStrategy?: WebGLStrategy;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    super(entityUid, componentSid);
  }

  static get componentTID(): ComponentTID {
    return 4;
  }

  private __isLoaded(index: Index) {
    if (this.__vertexHandles[index] != null) {
      return true;
    } else {
      return false
    }
  }

  $create() {
    if (this.__meshComponent != null) {
      return;
    }
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID) as MeshComponent;
  }

  $load() {
    if (this.__isLoaded(0)) {
      return;
    }

    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      this.__vertexHandles[i] = vertexHandles;
      MeshRendererComponent.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);

    }
  }

  $prerender(processApproech: ProcessApproachEnum, instanceIDBufferUid: WebGLResourceHandle) {
    if (this.__isVAOSet) {
      return;
    }
    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
     // if (this.__isLoaded(i) && this.__isVAOSet) {
      this.__vertexHandles[i] = MeshRendererComponent.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
        //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
      //  continue;
     // }
      this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
    }
    this.__isVAOSet = true;
  }

  // $render() {
  //   // const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
  //   //   for(let i=0; i<primitiveNum; i++) {
  //   //   const primitive = this.__meshComponent!.getPrimitiveAt(i);
  //   //   this.__renderingPipeline.render(this.__vertexHandles[i].vaoHandle, this.__vertexShaderProgramHandles[i], primitive);
  //   // }
  // }

}
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);

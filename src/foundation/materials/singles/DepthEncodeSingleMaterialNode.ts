import AbstractMaterialNode from "../core/AbstractMaterialNode";
import CameraComponent from "../../components/CameraComponent";
import ComponentRepository from "../../core/ComponentRepository";
import { ComponentType } from "../../definitions/ComponentType";
import { CompositionType } from "../../definitions/CompositionType";
import DepthEncodeShader from "../../../webgl/shaders/DepthEncodeShader";
import Material from "../core/Material";
import Scalar from "../../math/Scalar";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import { ShaderType } from "../../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import SkeletalComponent from "../../components/SkeletalComponent";
import Vector3 from "../../math/Vector3";

export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });

  private static __lastZNear = 0.0;
  private static __lastZFar = 0.0;

  constructor({ isSkinning }: { isSkinning: boolean }) {
    super(DepthEncodeShader.getInstance(), 'depthEncodeShading' + (isSkinning ? '+skinning' : ''), { isMorphing: false, isSkinning, isLighting: false });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: DepthEncodeSingleMaterialNode.zNearInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(0.1), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: DepthEncodeSingleMaterialNode.zFarInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(10000.0), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(30.0), min: 0, max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1,
      }
    ];

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    let cameraComponent = args.renderPass.cameraComponent as CameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      if (DepthEncodeSingleMaterialNode.__lastZNear !== cameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zNearInner, cameraComponent.zNearInner);
        DepthEncodeSingleMaterialNode.__lastZNear = cameraComponent.zNearInner;
      }

      if (DepthEncodeSingleMaterialNode.__lastZFar !== cameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zFarInner, cameraComponent.zFarInner);
        DepthEncodeSingleMaterialNode.__lastZFar = cameraComponent.zFarInner;
      }

    } else {
      material.setParameter(DepthEncodeSingleMaterialNode.zNearInner, cameraComponent.zNearInner);
      material.setParameter(DepthEncodeSingleMaterialNode.zFarInner, cameraComponent.zFarInner);
    }


    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);
  }
}

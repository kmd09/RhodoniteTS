import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ComponentRepository from '../../foundation/core/ComponentRepository';
import CameraComponent from '../../foundation/components/CameraComponent';
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class ShadowMapping32bitClassicShader extends GLSLShader implements ISingleShader {
  static __instance: ShadowMapping32bitClassicShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): ShadowMapping32bitClassicShader {
    if (!this.__instance) {
      this.__instance = new ShadowMapping32bitClassicShader();
    }
    return this.__instance;
  }


  get vertexShaderDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec2 a_texcoord_0;
${_in} vec2 a_texcoord_1;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord_0;
${_out} vec4 v_texcoord_1;
${_out} vec4 v_projPosition_from_light;

uniform vec3 u_viewPosition;
uniform mat4 u_lightViewProjectionMatrix;
uniform mat4 u_lightProjectionMatrix;
uniform sampler2D  u_depthTexture;
${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

${this.pointSize}

${this.pointDistanceAttenuation}
`;

  };

  vertexShaderBody: string = `
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(a_instanceID);
  mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;

  // Skeletal
  bool isSkinning;
  skinning(isSkinning, normalMatrix, normalMatrix);

  // point sprite
  vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
  float distanceFromCamera = length(position_inWorld.xyz - u_viewPosition);
  vec3 pointDistanceAttenuation = getPointDistanceAttenuation(a_instanceID);
  float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
  float maxPointSize = getPointSize(a_instanceID);
  gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);

  // Shadow mapping
  // Following tMatrix is based on https://wgld.org/d/webgl/w051.html
  mat4 tMatrix = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.5, 0.5, 0.0, 1.0
  );

  v_projPosition_from_light = u_lightViewProjectionMatrix * v_position_inWorld;
  v_texcoord_1 = tMatrix * v_projPosition_from_light;
  `;

  getFragmentShader() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureProj = this.glsl_textureProj;

    const mainCameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    let zNear: number | string = mainCameraComponent.zNearInner;
    let zFar: number | string = mainCameraComponent.zFarInner;
    let ZNearToFar: number | string = zFar - zNear;

    if (Number.isInteger(ZNearToFar)) {
      ZNearToFar = ZNearToFar + '.0';
    }
    return `${_version}
precision highp float;

struct Material {
  vec4 diffuseColorFactor;
};
uniform sampler2D u_diffuseColorTexture;
uniform Material u_material;

uniform int u_shadingModel;
uniform float u_shininess;

struct Light {
  vec4 lightPosition;
  vec4 lightDirection;
  vec4 lightIntensity;
};
uniform Light u_lights[${Config.maxLightNumberInShader}];
uniform int u_lightNumber;
uniform vec3 u_viewPosition;

uniform sampler2D u_depthTexture;

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec2 v_texcoord_0;
${_in} vec4 v_texcoord_1;
${_in} vec4 v_projPosition_from_light;
${_def_rt0}

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

void main ()
{

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  // diffuseColor
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  if (v_color != diffuseColor && u_material.diffuseColorFactor.rgb != diffuseColor) {
    diffuseColor = v_color * u_material.diffuseColorFactor.rgb;
    alpha = u_material.diffuseColorFactor.a;
  } else if (v_color == diffuseColor) {
    diffuseColor = u_material.diffuseColorFactor.rgb;
    alpha = u_material.diffuseColorFactor.a;
  } else if (u_material.diffuseColorFactor.rgb == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec3(1.0, 1.0, 1.0);
  }

  // diffuseColorTexture
  vec4 textureColor = ${_texture}(u_diffuseColorTexture, v_texcoord_0);
  if (textureColor.r > 0.05) {
    diffuseColor *= textureColor.rgb;
  }

  // shadow mapping
  float shadow = decodeRGBAToDepth(${_textureProj}(u_depthTexture, v_texcoord_1));
  if(v_projPosition_from_light.w > 0.0){
    float normalizationCoefficient = 1.0 / ${ZNearToFar};
    float linerDepth = normalizationCoefficient * length(v_projPosition_from_light);

    if(linerDepth > shadow + 0.0001){
      diffuseColor *= vec3(0.5, 0.5, 0.5);
    }
  }

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
  if (u_shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= u_lightNumber) {
        break;
      }

      vec3 lightDirection = u_lights[i].lightDirection.xyz;
      float lightType = u_lights[i].lightPosition.w;
      float spotCosCutoff = u_lights[i].lightDirection.w;
      float spotExponent = u_lights[i].lightIntensity.w;

      if (0.75 < lightType) { // is pointlight or spotlight
        lightDirection = normalize(u_lights[i].lightPosition.xyz - v_position_inWorld.xyz);
      }
      float spotEffect = 1.0;
      if (lightType > 1.75) { // is spotlight
        spotEffect = dot(u_lights[i].lightDirection.xyz, lightDirection);
        if (spotEffect > spotCosCutoff) {
          spotEffect = pow(spotEffect, spotExponent);
        } else {
          spotEffect = 0.0;
        }
      }

      vec3 incidentLight = spotEffect * u_lights[i].lightIntensity.xyz;
//      incidentLight *= M_PI;



      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, lightDirection)) * incidentLight;

      if (u_shadingModel == 2) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(u_viewPosition - v_position_inWorld.xyz);
        vec3 halfVector = normalize(lightDirection + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), u_shininess);
      } else if (u_shadingModel == 3) { // PHONG
        vec3 viewDirection = normalize(u_viewPosition - v_position_inWorld.xyz);
        vec3 R = reflect(lightDirection, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), u_shininess);
      }

    }

    shadingColor = diffuse + specular;
  } else {
    shadingColor = diffuseColor;
  }

  rt0 = vec4(shadingColor, alpha);
  //rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);


  ${_def_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody() {
    return this.getFragmentShader();
  }

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord_0', 'a_joint', 'a_weight', 'a_instanceID', 'a_texcoord_1'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Joints0, VertexAttribute.Weights0,
  VertexAttribute.Instance, VertexAttribute.Texcoord1];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3,
    CompositionType.Vec3, CompositionType.Vec2, CompositionType.Vec4, CompositionType.Vec4,
    CompositionType.Scalar, CompositionType.Vec2];
  }
}

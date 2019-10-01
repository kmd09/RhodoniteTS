import { CompositionType } from "../../foundation/definitions/CompositionType";
import { CompositionTypeEnum } from "../../foundation/main";
import Config from "../../foundation/core/Config";
import GLSLShader from "./GLSLShader";
import ISingleShader from "./ISingleShader";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class ToonShader extends GLSLShader implements ISingleShader {
  static __instance: ToonShader;
  public static readonly materialElement = ShaderNode.ClassicShading;
  private constructor() {
    super();
  }

  static getInstance(): ToonShader {
    if (!this.__instance) {
      this.__instance = new ToonShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {
    return ``
  };

  vertexShaderBody: string = ``;

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
${this.glslPrecision}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} vec3 a_faceNormal;
${_in} vec3 a_tangent;
${_in} vec4 a_baryCentricCoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;

${_out} vec2 v_texcoord;
${_out} vec3 v_baryCentricCoord;
${_out} vec3 v_binormal_inWorld;
${_out} vec3 v_color;
${_out} vec3 v_faceNormal_inWorld;
${_out} vec3 v_normal_inWorld;
${_out} vec3 v_tangent_inWorld;
${_out} vec4 v_position_inWorld;

${this.prerequisites}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

void main(){
${this.mainPrerequisites}

  float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  bool isSkinning = false;
  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  if (abs(length(a_normal)) > 0.01) {
    // if normal exist
    vec3 tangent_inWorld;
    if (!isSkinning) {
      tangent_inWorld = normalMatrix * a_tangent;
      v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
    }

    v_binormal_inWorld = cross(v_normal_inWorld, tangent_inWorld);
    v_tangent_inWorld = cross(v_binormal_inWorld, v_normal_inWorld);
  }

${this.pointSprite}

  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_color = a_color;
  v_faceNormal_inWorld = normalMatrix * a_faceNormal;
  v_texcoord = a_texcoord;

//  v_color = vec3(u_boneMatrices[int(a_joint.x)][1].xyz);
}
`;

  }
  getFragmentShader(args: any)
// frag
{
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    let accessSpecularIBLTexture: string;
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.webgl1ExtSTL) {
        accessSpecularIBLTexture = `vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z), lod);`;
    } else {
        accessSpecularIBLTexture = `vec4 specularTexel = ${_textureCube}(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z));`;
    }

    return `${_version}
    ${this.glsl1ShaderTextureLodExt}
    ${this.glsl1ShaderDerivativeExt}
    ${this.glslPrecision}

    ${_in} vec2 v_texcoord;
    ${_in} vec3 v_baryCentricCoord;
    ${_in} vec3 v_binormal_inWorld;
    ${_in} vec3 v_color;
    ${_in} vec3 v_faceNormal_inWorld;
    ${_in} vec3 v_normal_inWorld;
    ${_in} vec3 v_tangent_inWorld;
    ${_in} vec4 v_position_inWorld;

    ${_def_rt0}

    ${this.prerequisites}

    ${this.pbrUniformDefinition}

    ${this.pbrMethodDefinition}

    ${(typeof args.getters !== 'undefined') ? args.getters : ''}



    vec3 IBLContribution(float materialSID, vec3 n, float NV, vec3 reflection, vec3 albedo, vec3 F0, float userRoughness, vec3 F){
        vec4 iblParameter = get_iblParameter(materialSID, 0);
        float mipCount = iblParameter.x;
        float lod = (userRoughness * mipCount);

        vec4 diffuseTexel = ${_textureCube}(u_diffuseEnvTexture, vec3(-n.x, n.y, n.z));
        vec3 diffuseLight;
        ivec2 hdriFormat = get_hdriFormat(materialSID, 0);

        if (hdriFormat.x == 0) { // LDR_SRGB
            diffuseLight = srgbToLinear(diffuseTexel.rgb);
        } else if (hdriFormat.x == 3) { // RGBE
            diffuseLight = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
        } else {
            diffuseLight = diffuseTexel.rgb;
        }

        ${accessSpecularIBLTexture}

        vec3 specularLight;
        if (hdriFormat.y == 0) { // LDR_SRGB
            specularLight = srgbToLinear(specularTexel.rgb);
        } else if (hdriFormat.y == 3) { // RGBE
            specularLight = specularTexel.rgb * pow(2.0, specularTexel.a*255.0-128.0);
        } else {
            specularLight = specularTexel.rgb;
        }

        vec3 kS = fresnelSchlickRoughness(F0, NV, userRoughness);
        vec3 kD = 1.0 - kS;
        vec3 diffuse = diffuseLight * albedo * kD;
        // vec3 brdf = ${_texture}(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb;
        // vec3 specular = specularLight * (F0 * brdf.x + brdf.y);
        vec3 specular = specularLight * envBRDFApprox(F0, userRoughness, NV);

        float IBLDiffuseContribution = iblParameter.y;
        float IBLSpecularContribution = iblParameter.z;
        diffuse *= IBLDiffuseContribution;
        specular *= IBLSpecularContribution;
        return diffuse + specular;
    }

    float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale){
        vec3 d = fwidth(bary3);
        vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
        vec3 a3 = smoothstep(vec3(0.0), d, x);
        float factor = min(min(a3.x, a3.y), a3.z);

        return clamp((1.0 - factor), 0.0, 1.0);
    }

    float shade_mask(float shadeGrade, float shadeStep, float shadeFeather){
         return clamp(
                    (
                        1.0
                            +
                        (shadeGrade - (shadeStep - shadeFeather)) * (-1.0)
                            / 
                        (shadeStep - (shadeStep - shadeFeather))
                    ),
                    0.0,
                    1.0

                );
    }

    // -----------------------------------------------------------------------
    void main(){
        ${this.mainPrerequisites}

        // -------------------------------------------------------------------
        // General properties
        // -------------------------------------------------------------------
        vec3 viewPosition = get_viewPosition(materialSID, 0);
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);

        vec3 baseColor = vec3(1.0, 1.0, 1.0);
        vec4 baseTexColor = ${_texture}(u_MainTex, v_texcoord);
        // baseTexColor *= srgbToLinear(baseTexColor.rgb);
        // float baseAlpha *= baseTexColor.a;

        float alpha = 1.0;
        vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
        rt0 = vec4(0.0, 0.0, 0.0, alpha);

        //TODO: to be exposed
        bool isLightColorContributeBase     = get_Is_LightColor_Base(materialSID, 0) > 0.0;
        bool isLightColorContribute1stShade = get_Is_LightColor_1st_Shade(materialSID, 0) > 0.0;
        bool isLightColorContribute2ndShade = get_Is_LightColor_2nd_Shade(materialSID, 0) > 0.0;

        bool useBaseAs1stShade = get_Use_BaseAs1st(materialSID, 0) > 0.0;
        bool use1stAs2ndShade  = get_Use_1stAs2nd(materialSID, 0) > 0.0;

        vec4 shade1stColor = vec4(1.0, 1.0, 1.0, 1.0);
        vec4 shade1stTexColor = vec4(0.7, 0.7, 0.7, 1.0);
        // shade1stTexColor *= srgbToLinear(shade1stTexColor.rgb);
        if (useBaseAs1stShade) {
            shade1stTexColor = baseTexColor;
        } else {
            shade1stTexColor = ${_texture}(u_1st_ShadeMap, v_texcoord);
        }

        vec4 shade2ndColor = vec4(0.3, 0.3, 0.3, 1.0);
        vec4 shade2ndTexColor = vec4(0.3, 0.3, 0.3, 1.0);
        // shade2ndTexColor *= srgbToLinear(shade2ndTexColor.rgb);
        if (use1stAs2ndShade) {
            shade2ndTexColor = shade1stTexColor;
        } else {
            shade2ndTexColor = ${_texture}(u_2nd_ShadeMap, v_texcoord);
        }

        vec4 shadingGradeTexture = ${_texture}(u_ShadingGradeMap, v_texcoord);

        // -------------------------------------------------------------------
        // Normal
        // -------------------------------------------------------------------
        vec3 normal_inWorld = normalize(v_normal_inWorld);
        vec4 iblParameter = get_iblParameter(materialSID, 0);
        float rot = iblParameter.w + 3.1415;
        mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
        vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;

        if (abs(length(v_tangent_inWorld)) > 0.01) {
            vec3 normal = ${_texture}(u_NormalMap, v_texcoord).xyz*2.0 - 1.0;
            vec3 tangent_inWorld = normalize(v_tangent_inWorld);
            vec3 binormal_inWorld = normalize(v_binormal_inWorld);
            normal_inWorld = normalize(normal_inWorld);

            mat3 tbnMat_tangent_to_world = mat3(
                    tangent_inWorld.x, tangent_inWorld.y, tangent_inWorld.z,
                    binormal_inWorld.x, binormal_inWorld.y, binormal_inWorld.z,
                    normal_inWorld.x, normal_inWorld.y, normal_inWorld.z
                    );

            normal = normalize(tbnMat_tangent_to_world * normal);
            normal_inWorld = normal;
        }

        // Metallic & Roughness
        vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
        float userRoughness = metallicRoughnessFactor.y;
        float metallic = metallicRoughnessFactor.x;

        vec4 ormTexel = ${_texture}(u_metallicRoughnessTexture, v_texcoord);
        userRoughness = ormTexel.g * userRoughness;
        metallic = ormTexel.b * metallic;

        userRoughness = clamp(userRoughness, c_MinRoughness, 1.0);
        metallic = clamp(metallic, 0.0, 1.0);
        float alphaRoughness = userRoughness * userRoughness;

        // F0
        vec3 diffuseMatAverageF0 = vec3(0.04);
        vec3 F0 = mix(diffuseMatAverageF0, baseColor.rgb, metallic);

        // Albedo
        vec3 albedo = baseColor.rgb * (vec3(1.0) - diffuseMatAverageF0);
        albedo.rgb *= (1.0 - metallic);

        // NV
        float NV = clamp(abs(dot(normal_inWorld, viewDirection)), 0.0, 1.0);

        // Emissive
        vec3 emissive = srgbToLinear(${_texture}(u_Emissive_Tex, v_texcoord).xyz);

        // rt0.xyz += emissive;

        /*
        bool isOutputHDR = get_isOutputHDR(materialSID, 0);
        if(isOutputHDR){
            ${_def_fragColor}
            return;
        }
        */

        // -------------------------------------------------------------------
        // Clipping
        // -------------------------------------------------------------------
        // TODO
        // vec4 clippingMask = ${_texture}(u_ClippingMask, v_texcoord);


        // TODO: apply fog
        // -------------------------------------------------------------------
        // Lighting
        // -------------------------------------------------------------------
        vec3 diffuse = vec3(0.0, 0.0, 0.0);
        int _lightNumber = get_lightNumber(0.0, 0);
        float _specular = 0.0;
        float _halfLambert = 0.0;

        for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {

            if (i >= _lightNumber) {
                break;
            }

            // Light
            vec4 gotLightDirection = get_lightDirection(0.0, i);
            vec4 gotLightPosition = get_lightPosition(0.0, i);
            vec4 gotLightIntensity = get_lightIntensity(0.0, i);

            vec3 lightDirection = gotLightDirection.xyz;
            vec3 lightIntensity = gotLightIntensity.xyz;
            vec3 lightPosition = gotLightPosition.xyz;

            float lightType = gotLightPosition.w;
            float spotCosCutoff = gotLightDirection.w;
            float spotExponent = gotLightIntensity.w;


            if (0.75 < lightType) { // is pointlight or spotlight
                lightDirection = normalize(lightPosition.xyz - v_position_inWorld.xyz);
            }
            float spotEffect = 1.0;
            if (lightType > 1.75) { // is spotlight
                spotEffect = dot(lightDirection.xyz, lightDirection);
                if (spotEffect > spotCosCutoff) {
                    spotEffect = pow(spotEffect, spotExponent);
                } else {
                    spotEffect = 0.0;
                }
            }
            //diffuse += 1.0 * max(0.0, dot(normal_inWorld, lightDirection)) * spotEffect * lightIntensity.xyz;

            // IncidentLight
            vec3 incidentLight = spotEffect * lightIntensity.xyz;
            incidentLight *= M_PI;

            // Fresnel
            vec3 halfVector = normalize(lightDirection + viewDirection);
            float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);
            vec3 F = fresnel(F0, VH);

            // Diffuse
            vec3 diffuseContrib = (vec3(1.0) - F) * diffuse_brdf(albedo);

            // Specular
            float NL = clamp(dot(normal_inWorld, lightDirection), 0.0, 1.0);
            float NH = clamp(dot(normal_inWorld, halfVector), 0.0, 1.0);
            vec3 specularContrib = cook_torrance_specular_brdf(NH, NL, NV, F, alphaRoughness);
            vec3 diffuseAndSpecular = (diffuseContrib + specularContrib) * vec3(NL) * incidentLight.rgb;

            rt0.xyz += diffuseAndSpecular;
            _specular += NL;
            _halfLambert += NH;
            //      rt0.xyz += specularContrib * vec3(NL) * incidentLight.rgb;
            //    rt0.xyz += diffuseContrib * vec3(NL) * incidentLight.rgb;
            //    rt0.xyz += (vec3(1.0) - F) * diffuse_brdf(albedo);//diffuseContrib;//vec3(NL) * incidentLight.rgb;
        }

        vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);

        // vec3 F = fresnel(F0, NV);
        // vec3 ibl = IBLContribution(materialSID, normal_forEnv, NV, reflection, albedo, F0, userRoughness, F);
        // float occlusion = ${_texture}(u_occlusionTexture, v_texcoord).r;

        // Occlution to Indirect Lights
        // rt0.xyz += ibl * occlusion;

        // -------------------------------------------------------------------
        // BaseColorFactor & apply shading grade
        // -------------------------------------------------------------------
        // 1: define colours for each element(base, 1st, 2nd)
        // 2: calculate shading grade
        // 3: apply
        // -------------------------------------------------------------------
        vec3 base = baseColor.rgb * baseTexColor.rgb;

        vec3 shade1st = shade1stTexColor.rgb * shade1stColor.rgb;

        vec3 shade2nd = shade2ndTexColor.rgb * shade2ndColor.rgb;

        // TODO: apply shade map on 1st and 2nd respectively
        // TODO: apply system shadow
        float shade1stStep = get_1st_ShadeColor_Step(materialSID, 0);
        float shade2ndStep = get_2nd_ShadeColor_Step(materialSID, 0);
        float shade1stFeather = get_1st_ShadeColor_Feather(materialSID, 0);
        float shade2ndFeather = get_2nd_ShadeColor_Feather(materialSID, 0);

        float shadingGrade = shadingGradeTexture.r * _halfLambert;
        float shadeMask1st = shade_mask(shadingGrade, shade1stStep, shade1stFeather);
        float shadeMask2nd = shade_mask(shadingGrade, shade2ndStep, shade2ndFeather);

        baseColor = mix(baseColor, shade1st, shadeMask1st);
        baseColor = mix(baseColor, mix(shade1st, shade2nd, shadeMask2nd), shadeMask1st);

        // BaseColor (take account for BaseColorTexture)
        vec4 textureColor = ${_texture}(u_MainTex, v_texcoord);
        // baseColor *= srgbToLinear(textureColor.rgb);
        alpha *= textureColor.a;

        if (alpha < 0.01) {
            discard;
        }

        // Wireframe
        float threshold = 0.001;
        vec3 wireframe = get_wireframe(materialSID, 0);
        float wireframeWidthInner = wireframe.z;
        float wireframeWidthRelativeScale = 1.0;
        if (wireframe.x > 0.5 && wireframe.y < 0.5) {
            rt0.a = 0.0;
        }
        vec4 wireframeResult = rt0;
        vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
        float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
        float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
        // if r0.a is 0.0, it is wireframe not on shaded
        wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
        wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

        if (wireframe.x > 0.5) {
            rt0 = wireframeResult;
            if (wireframe.y < 0.5 && rt0.a == 0.0) {
                discard;
            }
        }

        // rt0.rgb = vec3(0.5);
        // rt0.rgb = shade2nd;
        rt0.rgb = baseTexColor.rgb;

        ${_def_fragColor}
    }
    `;
}

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody(args: Object) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = [
    'a_instanceID',
    'a_texcoord',
    'a_position', 'a_color', 'a_normal', 'a_faceNormal', 'a_tangent',
    'a_baryCentricCoord', 'a_joint', 'a_weight',
  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Instance,
    VertexAttribute.Texcoord0,
    VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Normal, VertexAttribute.FaceNormal, VertexAttribute.Tangent,
    VertexAttribute.BaryCentricCoord, VertexAttribute.Joints0, VertexAttribute.Weights0,
  ];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Scalar,
      CompositionType.Vec2,
      CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec4, CompositionType.Vec4, CompositionType.Vec4,
    ];
  }
}

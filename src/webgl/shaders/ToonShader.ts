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

        rt0 = vec4(0.0, 0.0, 0.0, 1.0);

        // -------------------------------------------------------------------
        // General properties
        // -------------------------------------------------------------------
        vec3 viewPosition = get_viewPosition(materialSID, 0);
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);

        vec4 baseColor = get_BaseColor(materialSID, 0);
        vec4 baseTexColor = ${_texture}(u_MainTex, v_texcoord);
        // baseTexColor *= srgbToLinear(baseTexColor.rgb);
        // float baseAlpha *= baseTexColor.a;

        float alpha = 1.0;
        vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);

        bool isLightColorContributeBase     = get_Is_LightColor_Base(materialSID, 0) > 0.0;
        bool isLightColorContribute1stShade = get_Is_LightColor_1st_Shade(materialSID, 0) > 0.0;
        bool isLightColorContribute2ndShade = get_Is_LightColor_2nd_Shade(materialSID, 0) > 0.0;

        bool useBaseAs1stShade = (0.0 < get_Use_BaseAs1st(materialSID, 0));
        bool use1stAs2ndShade  = (0.0 < get_Use_1stAs2nd(materialSID, 0));

        vec4 shade1stColor = get_1st_ShadeColor(materialSID, 0);
        vec4 shade1stTexColor = vec4(0.7, 0.7, 0.7, 1.0);
        if (useBaseAs1stShade) {
            shade1stTexColor = baseTexColor;
        } else {
            shade1stTexColor = ${_texture}(u_1st_ShadeMap, v_texcoord);
        }

        vec4 shade2ndColor = get_2nd_ShadeColor(materialSID, 0);
        vec4 shade2ndTexColor = vec4(0.3, 0.3, 0.3, 1.0);
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
        vec3 _halfDirection = vec3(0.0, 0.0, 0.0);

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
            _halfDirection += halfVector;
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

        _halfDirection = _halfDirection / float(_lightNumber);
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
        vec3 col = baseColor.rgb * baseTexColor.rgb;
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

        col.rgb = mix(col.rgb, shade1st, shadeMask1st);
        col.rgb = mix(col.rgb, mix(shade1st, shade2nd, shadeMask2nd), shadeMask1st);

        // ----------------------------------------------------------------------------------------------------
        // Highlight
        // FIXME: mismatched power of highlight with reference on unity.
        vec4 highColor = get_HighColor(materialSID, 0);
        vec4 highTexColor = ${_texture}(u_HighColor_Tex, v_texcoord);
        vec4 highColorMask = ${_texture}(u_Set_HighColorMask, v_texcoord);
        vec3 normalForHigh = normalize(mix(v_normal_inWorld, normal_inWorld, get_Is_NormalMapToHighColor(materialSID, 0)));
        float specularFactor = 0.5 * dot(_halfDirection, normalForHigh) + 0.5; //  Specular

        // Highlight Mask
        bool isSpecularContributeToHigh = (0.0 < get_Is_SpecularToHighColor(materialSID, 0));
        bool isAdditiveOrMultiplyToHigh = (0.0 < get_Is_BlendAddToHiColor(materialSID, 0));
        bool useTweakHighColorOnShadow = (0.0 < get_Is_UseTweakHighColorOnShadow(materialSID, 0));
        bool isLightColorContributeHighlight = (0.0 < get_Is_LightColor_HighColor(materialSID, 0));

        float highColMask = clamp((highColorMask.g + get_Tweak_HighColorMaskLevel(materialSID, 0)), 0.0, 1.0);
        if ( isSpecularContributeToHigh ) {
            highColMask *= pow(specularFactor, float(exp2(mix(11.0, 1.0, get_HighColor_Power(materialSID, 0)))));
        } else {
            highColMask *= (1.0 - step(specularFactor, (1.0 - pow( get_HighColor_Power(materialSID, 0), 5.0))));
        }

        vec3 lightColor = vec3(1.0); // TODO: implement later
        highColor.rgb = highTexColor.rgb * highColor.rgb * highColMask;
        if ( isLightColorContributeHighlight ) {
            highColor.rgb *= lightColor;
        }

        // blend highlight to base
        if( !isAdditiveOrMultiplyToHigh && !isSpecularContributeToHigh) {
            // FIXME: could be better...
            col.r = clamp((col.r - highColMask), 0.0, 1.0);
            col.g = clamp((col.g - highColMask), 0.0, 1.0);
            col.b = clamp((col.b - highColMask), 0.0, 1.0);
        }

        if( useTweakHighColorOnShadow ) {
            col.rgb += (highColor.rgb * ((1.0 - shadingGrade) + (shadingGrade * get_TweakHighColorOnShadow(materialSID, 0))));
        } else {
            col.rgb += highColor.rgb;
        }

        // ----------------------------------------------------------------------------------------------------
        // Rim Light
        vec4 rimLightMask = ${_texture}(u_Set_RimLightMask, v_texcoord);
        vec4 rimLightColor = get_RimLightColor(materialSID, 0);
        float rimLightInsideRatio = get_RimLight_InsideMask(materialSID, 0);
        if (0.0 < get_Is_LightColor_RimLight(materialSID, 0)) {
            rimLightColor.rgb *= lightColor;
        }

        float rimArea = 0.0;
        if (0.0 < get_Is_NormalMapToRimLight(materialSID, 0)) {
            rimArea = (1.0 - dot(normal_inWorld, viewDirection));
        } else {
            rimArea = (1.0 - dot(v_normal_inWorld, viewDirection));
        }

        float rimPower = pow(rimArea, float(exp2(mix(3.0, 0.0, get_RimLight_Power(materialSID, 0)))));

        float rimInsideMask = 0.0;
        if (0.0 < get_RimLight_FeatherOff(materialSID, 0)) {
            rimInsideMask = step(rimLightInsideRatio, rimPower);
        } else {
            rimInsideMask = 0.0 + ( (rimPower - rimLightInsideRatio) * (1.0 - 0.0) ) / (1.0 - rimLightInsideRatio);
        }

        float _VertHalfLambert_var = 0.5 * _halfLambert + 0.5;

        vec3 lightDirMaskOnRim = rimLightColor.rgb * rimInsideMask;
        if (0.0 < get_LightDirection_MaskOn(materialSID, 0)) {
            lightDirMaskOnRim -= rimLightColor.rgb * ((1.0 - _VertHalfLambert_var) + get_Tweak_LightDirection_MaskLevel(materialSID, 0));
        }

        float antipodeanRimPower = pow(rimArea, float(exp2(mix(3.0, 0.0, get_Ap_RimLight_Power(materialSID, 0)))));
        vec4 antipodeanRimColor = get_Ap_RimLightColor(materialSID, 0);
        float rimFactor = rimLightMask.g + get_Tweak_RimLightMaskLevel(materialSID, 0);

        bool isLightColorContibuteOnRimLight = (0.0 < get_Is_LightColor_Ap_RimLight(materialSID, 0));
        bool enableAntipodeanRimLight = (0.0 < get_Add_Antipodean_RimLight(materialSID, 0));
        bool disableFeatherOnAntipodean = (0.0 < get_Ap_RimLight_FeatherOff(materialSID, 0));

        vec3 rimCol = lightDirMaskOnRim;
        if (enableAntipodeanRimLight) {
            
            if (isLightColorContibuteOnRimLight) {
                antipodeanRimColor.rgb *= lightColor;
            }

            float antipodeanPower = _VertHalfLambert_var + get_Tweak_LightDirection_MaskLevel(materialSID, 0);
            if (disableFeatherOnAntipodean) {
                antipodeanPower += step(rimLightInsideRatio, antipodeanRimPower);
            } else {
                antipodeanPower += (0.0 + ( (antipodeanRimPower - rimLightInsideRatio) * (1.0 - 0.0) ) / (1.0 - rimLightInsideRatio));
            }

            rimCol += (antipodeanRimColor.rgb * antipodeanPower);
        }

        col.rgb += rimCol;


        /*
                // float4 rimLightMask = tex2D(_Set_RimLightMask,TRANSFORM_TEX(Set_UV0, _Set_RimLightMask));
                // float3 rimLightColor = mix( _RimLightColor.rgb, (_RimLightColor.rgb*Set_LightColor), _Is_LightColor_RimLight );
                // float rimArea = (1.0 - dot(mix( i.normalDir, normalDirection, _Is_NormalMapToRimLight ),viewDirection));
                // float rimPower = pow(rimArea,exp2(mix(3,0,_RimLight_Power)));
                // float rimInsideMask = saturate(mix( (0.0 + ( (rimPower - _RimLight_InsideMask) * (1.0 - 0.0) ) / (1.0 - _RimLight_InsideMask)), step(_RimLight_InsideMask,rimPower), _RimLight_FeatherOff ));
                // float _VertHalfLambert_var = 0.5*dot(i.normalDir,lightDirection)+0.5;
                // float3 lightDirMaskOnRim = mix( (rimLightColor*rimInsideMask), (rimLightColor*saturate((rimInsideMask-((1.0 - _VertHalfLambert_var)+_Tweak_LightDirection_MaskLevel)))), _LightDirection_MaskOn );
                // float _ApRimLightPower_var = pow(rimArea,exp2(mix(3,0,_Ap_RimLight_Power)));
                // float3 Set_RimLight = (saturate((rimLightMask.g+_Tweak_RimLightMaskLevel))*mix( lightDirMaskOnRim, (lightDirMaskOnRim+(mix( _Ap_RimLightColor.rgb, (_Ap_RimLightColor.rgb*Set_LightColor), _Is_LightColor_Ap_RimLight )*saturate((mix( (0.0 + ( (_ApRimLightPower_var - _RimLight_InsideMask) * (1.0 - 0.0) ) / (1.0 - _RimLight_InsideMask)), step(_RimLight_InsideMask,_ApRimLightPower_var), _Ap_RimLight_FeatherOff )-(saturate(_VertHalfLambert_var)+_Tweak_LightDirection_MaskLevel))))), _Add_Antipodean_RimLight ));
                //Composition: HighColor and RimLight as _RimLight_var
                float3 _RimLight_var = mix( Set_HighColor, (Set_HighColor+Set_RimLight), _RimLight );
        */

        // baseColor *= srgbToLinear(textureColor.rgb);
        alpha *= baseTexColor.a;

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
        rt0.rgb = col.rgb;

        ${_def_fragColor}


        /*
                float3 Set_LightColor = lightColor.rgb;
                float3 Set_BaseColor = mix( (_BaseColor.rgb*_MainTex_var.rgb), ((_BaseColor.rgb*_MainTex_var.rgb)*Set_LightColor), _Is_LightColor_Base );
                //v.2.0.5
                float4 _1st_ShadeMap_var = mix(tex2D(_1st_ShadeMap,TRANSFORM_TEX(Set_UV0, _1st_ShadeMap)),_MainTex_var,_Use_BaseAs1st);
                float3 Set_1st_ShadeColor = mix( (_1st_ShadeColor.rgb*_1st_ShadeMap_var.rgb), ((_1st_ShadeColor.rgb*_1st_ShadeMap_var.rgb)*Set_LightColor), _Is_LightColor_1st_Shade );
                //v.2.0.5
                float4 _2nd_ShadeMap_var = mix(tex2D(_2nd_ShadeMap,TRANSFORM_TEX(Set_UV0, _2nd_ShadeMap)),_1st_ShadeMap_var,_Use_1stAs2nd);
                float3 Set_2nd_ShadeColor = mix( (_2nd_ShadeColor.rgb*_2nd_ShadeMap_var.rgb), ((_2nd_ShadeColor.rgb*_2nd_ShadeMap_var.rgb)*Set_LightColor), _Is_LightColor_2nd_Shade );
                float _HalfLambert_var = 0.5*dot(mix( i.normalDir, normalDirection, _Is_NormalMapToBase ),lightDirection)+0.5;
                float4 _Set_2nd_ShadePosition_var = tex2D(_Set_2nd_ShadePosition,TRANSFORM_TEX(Set_UV0, _Set_2nd_ShadePosition));
                float4 _Set_1st_ShadePosition_var = tex2D(_Set_1st_ShadePosition,TRANSFORM_TEX(Set_UV0, _Set_1st_ShadePosition));
                //v.2.0.6
                //Minmimum value is same as the Minimum Feather's value with the Minimum Step's value as threshold.
                float _SystemShadowsLevel_var = (attenuation*0.5)+0.5+_Tweak_SystemShadowsLevel > 0.001 ? (attenuation*0.5)+0.5+_Tweak_SystemShadowsLevel : 0.0001;
                float Set_FinalShadowMask = saturate((1.0 + ( (mix( _HalfLambert_var, _HalfLambert_var*saturate(_SystemShadowsLevel_var), _Set_SystemShadowsToBase ) - (_BaseColor_Step-_BaseShade_Feather)) * ((1.0 - _Set_1st_ShadePosition_var.rgb).r - 1.0) ) / (_BaseColor_Step - (_BaseColor_Step-_BaseShade_Feather))));
                //
                //Composition: 3 Basic Colors as Set_FinalBaseColor
                float3 Set_FinalBaseColor = mix(Set_BaseColor,mix(Set_1st_ShadeColor,Set_2nd_ShadeColor,saturate((1.0 + ( (_HalfLambert_var - (_ShadeColor_Step-_1st2nd_Shades_Feather)) * ((1.0 - _Set_2nd_ShadePosition_var.rgb).r - 1.0) ) / (_ShadeColor_Step - (_ShadeColor_Step-_1st2nd_Shades_Feather))))),Set_FinalShadowMask); // Final Color
                float4 _Set_HighColorMask_var = tex2D(_Set_HighColorMask,TRANSFORM_TEX(Set_UV0, _Set_HighColorMask));
                float _Specular_var = 0.5*dot(halfDirection,mix( i.normalDir, normalDirection, _Is_NormalMapToHighColor ))+0.5; //  Specular                
                float _TweakHighColorMask_var = (saturate((_Set_HighColorMask_var.g+_Tweak_HighColorMaskLevel))*mix( (1.0 - step(_Specular_var,(1.0 - pow(_HighColor_Power,5)))), pow(_Specular_var,exp2(mix(11,1,_HighColor_Power))), _Is_SpecularToHighColor ));
                float4 highTexColor = tex2D(_HighColor_Tex,TRANSFORM_TEX(Set_UV0, _HighColor_Tex));
                float3 highColor = (mix( (highTexColor.rgb*_HighColor.rgb), ((highTexColor.rgb*_HighColor.rgb)*Set_LightColor), _Is_LightColor_HighColor )*_TweakHighColorMask_var);
                //Composition: 3 Basic Colors and HighColor as Set_HighColor
                float3 Set_HighColor = (mix( saturate((Set_FinalBaseColor-_TweakHighColorMask_var)), Set_FinalBaseColor, mix(_Is_BlendAddToHiColor,1.0,_Is_SpecularToHighColor) )+mix( highColor, (highColor*((1.0 - Set_FinalShadowMask)+(Set_FinalShadowMask*_TweakHighColorOnShadow))), _Is_UseTweakHighColorOnShadow ));
                float4 rimLightMask = tex2D(_Set_RimLightMask,TRANSFORM_TEX(Set_UV0, _Set_RimLightMask));
                float3 rimLightColor = mix( _RimLightColor.rgb, (_RimLightColor.rgb*Set_LightColor), _Is_LightColor_RimLight );
                float rimArea = (1.0 - dot(mix( i.normalDir, normalDirection, _Is_NormalMapToRimLight ),viewDirection));
                float rimPower = pow(rimArea,exp2(mix(3,0,_RimLight_Power)));
                float rimInsideMask = saturate(mix( (0.0 + ( (rimPower - _RimLight_InsideMask) * (1.0 - 0.0) ) / (1.0 - _RimLight_InsideMask)), step(_RimLight_InsideMask,rimPower), _RimLight_FeatherOff ));
                float _VertHalfLambert_var = 0.5*dot(i.normalDir,lightDirection)+0.5;
                float3 lightDirMaskOnRim = mix( (rimLightColor*rimInsideMask), (rimLightColor*saturate((rimInsideMask-((1.0 - _VertHalfLambert_var)+_Tweak_LightDirection_MaskLevel)))), _LightDirection_MaskOn );
                float _ApRimLightPower_var = pow(rimArea,exp2(mix(3,0,_Ap_RimLight_Power)));
                float3 Set_RimLight = (saturate((rimLightMask.g+_Tweak_RimLightMaskLevel))*mix( lightDirMaskOnRim, (lightDirMaskOnRim+(mix( _Ap_RimLightColor.rgb, (_Ap_RimLightColor.rgb*Set_LightColor), _Is_LightColor_Ap_RimLight )*saturate((mix( (0.0 + ( (_ApRimLightPower_var - _RimLight_InsideMask) * (1.0 - 0.0) ) / (1.0 - _RimLight_InsideMask)), step(_RimLight_InsideMask,_ApRimLightPower_var), _Ap_RimLight_FeatherOff )-(saturate(_VertHalfLambert_var)+_Tweak_LightDirection_MaskLevel))))), _Add_Antipodean_RimLight ));
                //Composition: HighColor and RimLight as _RimLight_var
                float3 _RimLight_var = mix( Set_HighColor, (Set_HighColor+Set_RimLight), _RimLight );
                //Matcap
                //v.2.0.6 : CameraRolling Stabilizer
                //鏡スクリプト判定：_sign_Mirror = -1 なら、鏡の中と判定.
                //v.2.0.7
                fixed _sign_Mirror = i.mirrorFlag;
                //
                float3 _Camera_Right = UNITY_MATRIX_V[0].xyz;
                float3 _Camera_Front = UNITY_MATRIX_V[2].xyz;
                float3 _Up_Unit = float3(0, 1, 0);
                float3 _Right_Axis = cross(_Camera_Front, _Up_Unit);
                //鏡の中なら反転.
                if(_sign_Mirror < 0){
                    _Right_Axis = -1 * _Right_Axis;
                    _Rotate_MatCapUV = -1 * _Rotate_MatCapUV;
                }else{
                    _Right_Axis = _Right_Axis;
                }
                float _Camera_Right_Magnitude = sqrt(_Camera_Right.x*_Camera_Right.x + _Camera_Right.y*_Camera_Right.y + _Camera_Right.z*_Camera_Right.z);
                float _Right_Axis_Magnitude = sqrt(_Right_Axis.x*_Right_Axis.x + _Right_Axis.y*_Right_Axis.y + _Right_Axis.z*_Right_Axis.z);
                float _Camera_Roll_Cos = dot(_Right_Axis, _Camera_Right) / (_Right_Axis_Magnitude * _Camera_Right_Magnitude);
                float _Camera_Roll = acos(clamp(_Camera_Roll_Cos, -1, 1));
                fixed _Camera_Dir = _Camera_Right.y < 0 ? -1 : 1;
                float _Rot_MatCapUV_var_ang = (_Rotate_MatCapUV*3.141592654) - _Camera_Dir*_Camera_Roll*_CameraRolling_Stabilizer;
                //v.2.0.7
                float2 _Rot_MatCapNmUV_var = RotateUV(Set_UV0, (_Rotate_NormalMapForMatCapUV*3.141592654), float2(0.5, 0.5), 1.0);
                //V.2.0.6
                float3 _NormalMapForMatCap_var = UnpackScaleNormal(tex2D(_NormalMapForMatCap,TRANSFORM_TEX(_Rot_MatCapNmUV_var, _NormalMapForMatCap)),_BumpScaleMatcap);
                //v.2.0.5: MatCap with camera skew correction
                float3 viewNormal = (mul(UNITY_MATRIX_V, float4(mix( i.normalDir, mul( _NormalMapForMatCap_var.rgb, tangentTransform ).rgb, _Is_NormalMapForMatCap ),0))).rgb;
                float3 NormalBlend_MatcapUV_Detail = viewNormal.rgb * float3(-1,-1,1);
                float3 NormalBlend_MatcapUV_Base = (mul( UNITY_MATRIX_V, float4(viewDirection,0) ).rgb*float3(-1,-1,1)) + float3(0,0,1);
                float3 noSknewViewNormal = NormalBlend_MatcapUV_Base*dot(NormalBlend_MatcapUV_Base, NormalBlend_MatcapUV_Detail)/NormalBlend_MatcapUV_Base.b - NormalBlend_MatcapUV_Detail;                
                float2 _ViewNormalAsMatCapUV = (mix(noSknewViewNormal,viewNormal,_Is_Ortho).rg*0.5)+0.5;
                //v.2.0.7
                float2 _Rot_MatCapUV_var = RotateUV((0.0 + ((_ViewNormalAsMatCapUV - (0.0+_Tweak_MatCapUV)) * (1.0 - 0.0) ) / ((1.0-_Tweak_MatCapUV) - (0.0+_Tweak_MatCapUV))), _Rot_MatCapUV_var_ang, float2(0.5, 0.5), 1.0);
                //鏡の中ならUV左右反転.
                if(_sign_Mirror < 0){
                    _Rot_MatCapUV_var.x = 1-_Rot_MatCapUV_var.x;
                }else{
                    _Rot_MatCapUV_var = _Rot_MatCapUV_var;
                }
                //v.2.0.6 : LOD of Matcap
                float4 _MatCap_Sampler_var = tex2Dlod(_MatCap_Sampler,float4(TRANSFORM_TEX(_Rot_MatCapUV_var, _MatCap_Sampler),0.0,_BlurLevelMatcap));
                //
                //MatcapMask
                float4 _Set_MatcapMask_var = tex2D(_Set_MatcapMask,TRANSFORM_TEX(Set_UV0, _Set_MatcapMask));
                float _Tweak_MatcapMaskLevel_var = saturate(mix(_Set_MatcapMask_var.g, (1.0 - _Set_MatcapMask_var.g), _Inverse_MatcapMask) + _Tweak_MatcapMaskLevel);
                //
                float3 _Is_LightColor_MatCap_var = mix( (_MatCap_Sampler_var.rgb*_MatCapColor.rgb), ((_MatCap_Sampler_var.rgb*_MatCapColor.rgb)*Set_LightColor), _Is_LightColor_MatCap );
                //v.2.0.6 : ShadowMask on Matcap in Blend mode : multiply
                float3 Set_MatCap = mix( _Is_LightColor_MatCap_var, (_Is_LightColor_MatCap_var*((1.0 - Set_FinalShadowMask)+(Set_FinalShadowMask*_TweakMatCapOnShadow)) + mix(Set_HighColor*Set_FinalShadowMask*(1.0-_TweakMatCapOnShadow), float3(0.0, 0.0, 0.0), _Is_BlendAddToMatCap)), _Is_UseTweakMatCapOnShadow );
                //
                //Composition: RimLight and MatCap as finalColor
                //Broke down finalColor composition
                float3 matCapColorOnAddMode = _RimLight_var+Set_MatCap*_Tweak_MatcapMaskLevel_var;
                float _Tweak_MatcapMaskLevel_var_MultiplyMode = _Tweak_MatcapMaskLevel_var * mix (1.0, (1.0 - (Set_FinalShadowMask)*(1.0 - _TweakMatCapOnShadow)), _Is_UseTweakMatCapOnShadow);
                float3 matCapColorOnMultiplyMode = Set_HighColor*(1-_Tweak_MatcapMaskLevel_var_MultiplyMode) + Set_HighColor*Set_MatCap*_Tweak_MatcapMaskLevel_var_MultiplyMode + mix(float3(0,0,0),Set_RimLight,_RimLight);
                float3 matCapColorFinal = mix(matCapColorOnMultiplyMode, matCapColorOnAddMode, _Is_BlendAddToMatCap);
                float3 finalColor = mix(_RimLight_var, matCapColorFinal, _MatCap);// Final Composition before Emissive
                //
                //v.2.0.6: GI_Intensity with Intensity Multiplier Filter
                float3 envLightColor = DecodeLightProbe(normalDirection) < float3(1,1,1) ? DecodeLightProbe(normalDirection) : float3(1,1,1);
                float envLightIntensity = 0.299*envLightColor.r + 0.587*envLightColor.g + 0.114*envLightColor.b <1 ? (0.299*envLightColor.r + 0.587*envLightColor.g + 0.114*envLightColor.b) : 1;
//v.2.0.7
#ifdef _EMISSIVE_SIMPLE
                float4 _Emissive_Tex_var = tex2D(_Emissive_Tex,TRANSFORM_TEX(Set_UV0, _Emissive_Tex));
                float emissiveMask = _Emissive_Tex_var.a;
                emissive = _Emissive_Tex_var.rgb * _Emissive_Color.rgb * emissiveMask;
#elif _EMISSIVE_ANIMATION
                //v.2.0.7 Calculation View Coord UV for Scroll 
                float3 viewNormal_Emissive = (mul(UNITY_MATRIX_V, float4(i.normalDir,0))).xyz;
                float3 NormalBlend_Emissive_Detail = viewNormal_Emissive * float3(-1,-1,1);
                float3 NormalBlend_Emissive_Base = (mul( UNITY_MATRIX_V, float4(viewDirection,0)).xyz*float3(-1,-1,1)) + float3(0,0,1);
                float3 noSknewViewNormal_Emissive = NormalBlend_Emissive_Base*dot(NormalBlend_Emissive_Base, NormalBlend_Emissive_Detail)/NormalBlend_Emissive_Base.z - NormalBlend_Emissive_Detail;
                float2 _ViewNormalAsEmissiveUV = noSknewViewNormal_Emissive.xy*0.5+0.5;
                float2 _ViewCoord_UV = RotateUV(_ViewNormalAsEmissiveUV, -(_Camera_Dir*_Camera_Roll), float2(0.5,0.5), 1.0);
                //鏡の中ならUV左右反転.
                if(_sign_Mirror < 0){
                    _ViewCoord_UV.x = 1-_ViewCoord_UV.x;
                }else{
                    _ViewCoord_UV = _ViewCoord_UV;
                }
                float2 emissive_uv = mix(i.uv0, _ViewCoord_UV, _Is_ViewCoord_Scroll);
                //
                float4 _time_var = _Time;
                float _base_Speed_var = (_time_var.g*_Base_Speed);
                float _Is_PingPong_Base_var = mix(_base_Speed_var, sin(_base_Speed_var), _Is_PingPong_Base );
                float2 scrolledUV = emissive_uv - float2(_Scroll_EmissiveU, _Scroll_EmissiveV)*_Is_PingPong_Base_var;
                float rotateVelocity = _Rotate_EmissiveUV*3.141592654;
                float2 _rotate_EmissiveUV_var = RotateUV(scrolledUV, rotateVelocity, float2(0.5, 0.5), _Is_PingPong_Base_var);
                float4 _Emissive_Tex_var = tex2D(_Emissive_Tex,TRANSFORM_TEX(Set_UV0, _Emissive_Tex));
                float emissiveMask = _Emissive_Tex_var.a;
                _Emissive_Tex_var = tex2D(_Emissive_Tex,TRANSFORM_TEX(_rotate_EmissiveUV_var, _Emissive_Tex));
                float _colorShift_Speed_var = 1.0 - cos(_time_var.g*_ColorShift_Speed);
                float viewShift_var = smoothstep( 0.0, 1.0, max(0,dot(normalDirection,viewDirection)));
                float4 colorShift_Color = mix(_Emissive_Color, mix(_Emissive_Color, _ColorShift, _colorShift_Speed_var), _Is_ColorShift);
                float4 viewShift_Color = mix(_ViewShift, colorShift_Color, viewShift_var);
                float4 emissive_Color = mix(colorShift_Color, viewShift_Color, _Is_ViewShift);
                emissive = emissive_Color.rgb * _Emissive_Tex_var.rgb * emissiveMask;

        */
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

// vim: set ft=glsl

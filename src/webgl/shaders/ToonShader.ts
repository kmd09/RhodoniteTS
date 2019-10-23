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

    float shade_mask(float shadeGrade, float shadeStep, float shadeFeather) {
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

    vec3 unpack_scale_normal(vec4 packednormal, float bumpScale) {
        vec3 normal;
        normal.xy = (packednormal.wy * 2.0 - 1.0);
        normal.xy *= bumpScale;
        normal.z = sqrt(1.0 - (dot(normal.xy, normal.xy)));

        return normal;
    }

    vec3 calculate_world_normal_tex(
            float materialSID
            ,vec4 normalMapTex
    ) {

        vec3 normal_inWorld = normalize(v_normal_inWorld);
        vec4 iblParameter = get_iblParameter(materialSID, 0);
        float rot = iblParameter.w + 3.1415;
        mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
        vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;

        if (abs(length(v_tangent_inWorld)) > 0.01) {
            vec3 normal = normalMapTex.xyz * 2.0 - 1.0;
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

        return normal_inWorld;
    }

    // ----------------------------------------------------------------------------------------------------
    // Rim Light
    vec3 calculate_rimlight(
            float materialSID
            ,vec3 lightColor
            ,vec3 normal_inWorld
            ,vec3 viewDirection
            ,float _halfLambert
    ) {

        vec4 rimLightMask = ${_texture}(u_Set_RimLightMask, v_texcoord);
        vec4 rimLightColor = get_RimLightColor(materialSID, 0);
        float rimLightInsideRatio = get_RimLight_InsideMask(materialSID, 0);

        bool useNormalMap               = (0.0 < get_Is_NormalMapToRimLight(materialSID,    0));
        bool disableFeather             = (0.0 < get_RimLight_FeatherOff(materialSID,       0));
        bool isLightColorContribute     = (0.0 < get_Is_LightColor_RimLight(materialSID,    0));
        bool isLightColorContributeOnAP = (0.0 < get_Is_LightColor_Ap_RimLight(materialSID, 0));
        bool enableAntipodeanRimLight   = (0.0 < get_Add_Antipodean_RimLight(materialSID,   0));
        bool disableFeatherOnAntipodean = (0.0 < get_Ap_RimLight_FeatherOff(materialSID,    0));

        vec3 res = rimLightColor.rgb;

        if (isLightColorContribute) {
            res *= lightColor;
        }

        float rimArea = 0.0;
        if (useNormalMap) {
            rimArea = (1.0 - dot(normal_inWorld, viewDirection));
        } else {
            rimArea = (1.0 - dot(v_normal_inWorld, viewDirection));
        }
        float rimPower = pow(rimArea, float(exp2(mix(3.0, 0.0, get_RimLight_Power(materialSID, 0)))));

        // apply inside mask
        if (disableFeather) {
            res *= step(rimLightInsideRatio, rimPower);
        } else {
            res *= (0.0 + ( (rimPower - rimLightInsideRatio) * (1.0 - 0.0) ) / (1.0 - rimLightInsideRatio));
        }

        // light direction
        float _VertHalfLambert_var = 0.5 * _halfLambert + 0.5;
        if (0.0 < get_LightDirection_MaskOn(materialSID, 0)) {
            res -= res * ((1.0 - _VertHalfLambert_var) + get_Tweak_LightDirection_MaskLevel(materialSID, 0));
        }

        // antipodean, if active, the rimlight effect appear in opposite to light direction.
        float antipodeanRimPower = pow(rimArea, float(exp2(mix(3.0, 0.0, get_Ap_RimLight_Power(materialSID, 0)))));
        vec4 antipodeanRimColor = get_Ap_RimLightColor(materialSID, 0);

        if (enableAntipodeanRimLight) {
            
            if (isLightColorContributeOnAP) {
                antipodeanRimColor.rgb *= lightColor;
            }

            float antipodeanPower = _VertHalfLambert_var + get_Tweak_LightDirection_MaskLevel(materialSID, 0);
            if (disableFeatherOnAntipodean) {
                antipodeanPower += step(rimLightInsideRatio, antipodeanRimPower);
            } else {
                antipodeanPower += (0.0 + ( (antipodeanRimPower - rimLightInsideRatio) * (1.0 - 0.0) ) / (1.0 - rimLightInsideRatio));
            }

            res += (antipodeanRimColor.rgb * antipodeanPower);
        }

        float rimMaskFactor = rimLightMask.g + get_Tweak_RimLightMaskLevel(materialSID, 0);
        res *= rimMaskFactor;
        res.r = clamp(res.r, 0.0, 1.0);
        res.g = clamp(res.g, 0.0, 1.0);
        res.b = clamp(res.b, 0.0, 1.0);

        return res;

    }

    vec3 calculate_matcap(
        float materialSID
        ,vec3 normal_inWorld 
        ,vec3 viewDirection
        ,vec3 lightColor
        ,vec4 highColor
        ,float shadeMask
    ) {

        vec3 res = vec3(0);

        // vec3 unpackedNormal = unpack_scale_normal(${_texture}(u_NormalMapForMatCap, v_texcoord), get_BumpScaleMatcap(materialSID, 0));
        // FIXME: texture cant fetch
        // vec3 unpackedNormal = ${_texture}(u_NormalMapForMatCap, v_texcoord).rgb;
        vec3 unpackedNormal = ${_texture}(u_Set_MatcapMask, v_texcoord).rgb;

        bool useNormalMap   = (0.0 < get_Is_NormalMapForMatCap(materialSID, 0));
        bool disableFeather = (0.0 < get_RimLight_FeatherOff(materialSID,   0));
        bool lightColorContribution = (0.0 < get_Is_LightColor_MatCap(materialSID,   0));
        bool isAdditiveOrMultiply = (0.0 < get_Is_BlendAddToMatCap(materialSID, 0));
        bool useMatCapOnShadow = (0.0 < get_Is_UseTweakMatCapOnShadow(materialSID, 0));

        float tweakMatCapOnShadow = get_TweakMatCapOnShadow(materialSID, 0);

        vec3 x = normalize( vec3( viewDirection.z, 0.0, - viewDirection.x ) );
        vec3 y = cross( viewDirection, x );
        vec2 uv = vec2( dot( x, normal_inWorld ), dot( y, normal_inWorld ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

        vec3 matcapColor = ${_texture}(u_MatCap_Sampler, uv).rgb;
        matcapColor *= get_MatCapColor(materialSID, 0).rgb;

        if( lightColorContribution ) {
            matcapColor *= lightColor;
        }

        if ( useMatCapOnShadow ){
            vec3 tmp3 = vec3(0.0, 0.0, 0.0);

            if( !isAdditiveOrMultiply )
            {
                tmp3 = highColor.rgb * (shadeMask * (1.0 - tweakMatCapOnShadow));
            }
            float tmp2 = (1.0 - shadeMask) + (shadeMask * tweakMatCapOnShadow);
            vec3 tmp = matcapColor * tmp2 + tmp3;

            res = tmp;

        } else {
            res = matcapColor;
        }

        vec3 matcapMask = ${_texture}(u_Set_MatcapMask, v_texcoord).rgb;
        float matcapTweak = mix(
                                matcapMask.g,
                                (1.0 - matcapMask.g),
                                get_Inverse_MatcapMask(materialSID, 0)
                            );
        matcapTweak += get_Tweak_MatcapMaskLevel(materialSID, 0);
        matcapTweak = clamp((matcapTweak), 0.0, 1.0);

        if( useMatCapOnShadow ) {
            matcapTweak *= (1.0 - shadeMask + shadeMask * tweakMatCapOnShadow);
        }

        matcapColor *= matcapTweak;

        res = matcapColor.rgb;



        return res;
    }

    // -----------------------------------------------------------------------
    void main(){
        ${this.mainPrerequisites}
        float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];

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
        vec4 clippingMask = ${_texture}(u_ClippingMask, v_texcoord);

        if( 0.0 < get_IsBaseMapAlphaAsClippingMask(materialSID, 0)) {
            alpha = baseTexColor.a;
        } else {
            alpha = clippingMask.r;
        }

        if( 0.0 < get_Inverse_Clipping(materialSID, 0) ) {
            alpha = 1.0 - alpha;
        }

        if( (clamp(alpha + get_Clipping_Level(materialSID, 0), 0.0, 1.0) - 0.5) < 0.01 ){
            discard;
        }

        if (alpha < 0.01) {
            discard;
        }

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

        /*
        vec3 F = fresnel(F0, NV);
        vec3 ibl = IBLContribution(materialSID, normal_forEnv, NV, reflection, albedo, F0, userRoughness, F);
        float occlusion = ${_texture}(u_occlusionTexture, v_texcoord).r;

        // Occlution to Indirect Lights
        // rt0.xyz += ibl * occlusion;

        // Indirect lights luminance
        _halfLambert += ((ibl.x * 0.3) + (ibl.y * 0.59) + (ibl.z * 0.11)) * occlusion;
        */

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

        // --------------------------------------------------------------------------------------------------
        // rimlight
        col.rgb += calculate_rimlight(materialSID, lightColor, normal_inWorld, viewDirection, _halfLambert);

        // --------------------------------------------------------------------------------------------------
        // matcap
        bool isMatcapEnabled = (0.0 < get_MatCap(materialSID, 0));
        bool isMatcapBlendModeAdd = (0.0 < get_Is_BlendAddToMatCap(materialSID, 0));
        bool isMatcapBlendModeMultiply = (!isMatcapBlendModeAdd);
        if( isMatcapEnabled )
        {
            if( isMatcapBlendModeAdd )
            {
                col.rgb += calculate_matcap(materialSID, normal_inWorld, viewDirection, lightColor, highColor, shadeMask1st);
            }
            else // multiply
            {
                col.rgb *= calculate_matcap(materialSID, normal_inWorld, viewDirection, lightColor, highColor, shadeMask1st);
            }
        }

        // --------------------------------------------------------------------------------------------------
        // baseColor *= srgbToLinear(textureColor.rgb);

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

        rt0.rgb = col.rgb;
        rt0.a = alpha;

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

// vim: set ft=glsl

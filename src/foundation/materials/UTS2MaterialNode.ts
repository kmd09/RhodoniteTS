import AbstractMaterialNode from "./AbstractMaterialNode";
import { AlphaMode } from "../definitions/AlphaMode";
import BlendShapeComponent from "../components/BlendShapeComponent";
import CameraComponent from "../components/CameraComponent";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ComponentRepository from "../core/ComponentRepository";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import Config from "../core/Config";
import Material from "./Material";
import MeshComponent from "../components/MeshComponent";
import ToonShader from "../../webgl/shaders/ToonShader";
import MutableVector3 from "../math/MutableVector3";
import Scalar from "../math/Scalar";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";
import VectorN from "../math/VectorN";

export default class UTS2MaterialNode extends AbstractMaterialNode {

  static readonly IsOutputHDR                                         = new ShaderSemanticsClass({ str: 'isOutputHDR' });

  static readonly _IsBaseMapAlphaAsClippingMask    = new ShaderSemanticsClass({ str: 'IsBaseMapAlphaAsClippingMask'});
  static readonly _Inverse_Clipping                = new ShaderSemanticsClass({ str: 'Inverse_Clipping'});
  static readonly _Is_LightColor_Base              = new ShaderSemanticsClass({ str: 'Is_LightColor_Base'});
  static readonly _Use_BaseAs1st                   = new ShaderSemanticsClass({ str: 'Use_BaseAs1st'});
  static readonly _Is_LightColor_1st_Shade         = new ShaderSemanticsClass({ str: 'Is_LightColor_1st_Shade'});
  static readonly _Use_1stAs2nd                    = new ShaderSemanticsClass({ str: 'Use_1stAs2nd'});
  static readonly _Is_LightColor_2nd_Shade         = new ShaderSemanticsClass({ str: 'Is_LightColor_2nd_Shade'});
  static readonly _Is_NormalMapToBase              = new ShaderSemanticsClass({ str: 'Is_NormalMapToBase'});
  static readonly _Set_SystemShadowsToBase         = new ShaderSemanticsClass({ str: 'Set_SystemShadowsToBase'});
  static readonly _Is_Filter_HiCutPointLightColor  = new ShaderSemanticsClass({ str: 'Is_Filter_HiCutPointLightColor'});
  static readonly _Is_LightColor_HighColor         = new ShaderSemanticsClass({ str: 'Is_LightColor_HighColor'});
  static readonly _Is_NormalMapToHighColor         = new ShaderSemanticsClass({ str: 'Is_NormalMapToHighColor'});
  static readonly _Is_SpecularToHighColor          = new ShaderSemanticsClass({ str: 'Is_SpecularToHighColor'});
  static readonly _Is_BlendAddToHiColor            = new ShaderSemanticsClass({ str: 'Is_BlendAddToHiColor'});
  static readonly _Is_UseTweakHighColorOnShadow    = new ShaderSemanticsClass({ str: 'Is_UseTweakHighColorOnShadow'});
  static readonly _Is_LightColor_RimLight          = new ShaderSemanticsClass({ str: 'Is_LightColor_RimLight'});
  static readonly _Is_NormalMapToRimLight          = new ShaderSemanticsClass({ str: 'Is_NormalMapToRimLight'});
  static readonly _Is_LightColor_Ap_RimLight       = new ShaderSemanticsClass({ str: 'Is_LightColor_Ap_RimLight'});
  static readonly _Is_LightColor_MatCap            = new ShaderSemanticsClass({ str: 'Is_LightColor_MatCap'});
  static readonly _Is_BlendAddToMatCap             = new ShaderSemanticsClass({ str: 'Is_BlendAddToMatCap'});
  static readonly _CameraRolling_Stabilizer        = new ShaderSemanticsClass({ str: 'CameraRolling_Stabilizer'});
  static readonly _Is_NormalMapForMatCap           = new ShaderSemanticsClass({ str: 'Is_NormalMapForMatCap'});
  static readonly _Is_UseTweakMatCapOnShadow       = new ShaderSemanticsClass({ str: 'Is_UseTweakMatCapOnShadow'});
  static readonly _Is_Ortho                        = new ShaderSemanticsClass({ str: 'Is_Ortho'});
  static readonly _Is_PingPong_Base                = new ShaderSemanticsClass({ str: 'Is_PingPong_Base'});
  static readonly _Is_ColorShift                   = new ShaderSemanticsClass({ str: 'Is_ColorShift'});
  static readonly _Is_ViewShift                    = new ShaderSemanticsClass({ str: 'Is_ViewShift'});
  static readonly _Is_ViewCoord_Scroll             = new ShaderSemanticsClass({ str: 'Is_ViewCoord_Scroll'});
  static readonly _RimLight                        = new ShaderSemanticsClass({ str: 'RimLight'});
  static readonly _RimLight_FeatherOff             = new ShaderSemanticsClass({ str: 'RimLight_FeatherOff'});
  static readonly _LightDirection_MaskOn           = new ShaderSemanticsClass({ str: 'LightDirection_MaskOn'});
  static readonly _Add_Antipodean_RimLight         = new ShaderSemanticsClass({ str: 'Add_Antipodean_RimLight'});
  static readonly _Ap_RimLight_FeatherOff          = new ShaderSemanticsClass({ str: 'Ap_RimLight_FeatherOff'});
  static readonly _MatCap                          = new ShaderSemanticsClass({ str: 'MatCap'});
  static readonly _Inverse_MatcapMask              = new ShaderSemanticsClass({ str: 'Inverse_MatcapMask'});
  static readonly _Is_BlendBaseColor               = new ShaderSemanticsClass({ str: 'Is_BlendBaseColor'});
  static readonly _Is_LightColor_Outline           = new ShaderSemanticsClass({ str: 'Is_LightColor_Outline'});
  static readonly _Is_OutlineTex                   = new ShaderSemanticsClass({ str: 'Is_OutlineTex'});
  static readonly _Is_BakedNormal                  = new ShaderSemanticsClass({ str: 'Is_BakedNormal'});
  static readonly _Is_Filter_LightColor            = new ShaderSemanticsClass({ str: 'Is_Filter_LightColor'});
  static readonly _Clipping_Level                  = new ShaderSemanticsClass({ str: 'Clipping_Level'});
  static readonly _BumpScale                       = new ShaderSemanticsClass({ str: 'BumpScale'});
  static readonly _Tweak_SystemShadowsLevel        = new ShaderSemanticsClass({ str: 'Tweak_SystemShadowsLevel'});
  static readonly _1st_ShadeColor_Step             = new ShaderSemanticsClass({ str: '1st_ShadeColor_Step'});
  static readonly _1st_ShadeColor_Feather          = new ShaderSemanticsClass({ str: '1st_ShadeColor_Feather'});
  static readonly _2nd_ShadeColor_Step             = new ShaderSemanticsClass({ str: '2nd_ShadeColor_Step'});
  static readonly _2nd_ShadeColor_Feather          = new ShaderSemanticsClass({ str: '2nd_ShadeColor_Feather'});
  static readonly _StepOffset                      = new ShaderSemanticsClass({ str: 'StepOffset'});
  static readonly _Tweak_ShadingGradeMapLevel      = new ShaderSemanticsClass({ str: 'Tweak_ShadingGradeMapLevel'});
  static readonly _BlurLevelSGM                    = new ShaderSemanticsClass({ str: 'BlurLevelSGM'});
  static readonly _HighColor_Power                 = new ShaderSemanticsClass({ str: 'HighColor_Power'});
  static readonly _TweakHighColorOnShadow          = new ShaderSemanticsClass({ str: 'TweakHighColorOnShadow'});
  static readonly _Tweak_HighColorMaskLevel        = new ShaderSemanticsClass({ str: 'Tweak_HighColorMaskLevel'});
  static readonly _RimLight_Power                  = new ShaderSemanticsClass({ str: 'RimLight_Power'});
  static readonly _RimLight_InsideMask             = new ShaderSemanticsClass({ str: 'RimLight_InsideMask'});
  static readonly _Tweak_LightDirection_MaskLevel  = new ShaderSemanticsClass({ str: 'Tweak_LightDirection_MaskLevel'});
  static readonly _Ap_RimLight_Power               = new ShaderSemanticsClass({ str: 'Ap_RimLight_Power'});
  static readonly _Tweak_RimLightMaskLevel         = new ShaderSemanticsClass({ str: 'Tweak_RimLightMaskLevel'});
  static readonly _BlurLevelMatcap                 = new ShaderSemanticsClass({ str: 'BlurLevelMatcap'});
  static readonly _Tweak_MatCapUV                  = new ShaderSemanticsClass({ str: 'Tweak_MatCapUV'});
  static readonly _Rotate_MatCapUV                 = new ShaderSemanticsClass({ str: 'Rotate_MatCapUV'});
  static readonly _BumpScaleMatcap                 = new ShaderSemanticsClass({ str: 'BumpScaleMatcap'});
  static readonly _Rotate_NormalMapForMatCapUV     = new ShaderSemanticsClass({ str: 'Rotate_NormalMapForMatCapUV'});
  static readonly _TweakMatCapOnShadow             = new ShaderSemanticsClass({ str: 'TweakMatCapOnShadow'});
  static readonly _Tweak_MatcapMaskLevel           = new ShaderSemanticsClass({ str: 'Tweak_MatcapMaskLevel'});
  static readonly _Base_Speed                      = new ShaderSemanticsClass({ str: 'Base_Speed'});
  static readonly _Scroll_EmissiveU                = new ShaderSemanticsClass({ str: 'Scroll_EmissiveU'});
  static readonly _Scroll_EmissiveV                = new ShaderSemanticsClass({ str: 'Scroll_EmissiveV'});
  static readonly _Rotate_EmissiveUV               = new ShaderSemanticsClass({ str: 'Rotate_EmissiveUV'});
  static readonly _ColorShift_Speed                = new ShaderSemanticsClass({ str: 'ColorShift_Speed'});
  static readonly _Tweak_transparency              = new ShaderSemanticsClass({ str: 'Tweak_transparency'});
  static readonly _Color                           = new ShaderSemanticsClass({ str: 'Color'});
  static readonly _BaseColor                       = new ShaderSemanticsClass({ str: 'BaseColor'});
  static readonly _1st_ShadeColor                  = new ShaderSemanticsClass({ str: '1st_ShadeColor'});
  static readonly _2nd_ShadeColor                  = new ShaderSemanticsClass({ str: '2nd_ShadeColor'});
  static readonly _HighColor                       = new ShaderSemanticsClass({ str: 'HighColor'});
  static readonly _RimLightColor                   = new ShaderSemanticsClass({ str: 'RimLightColor'});
  static readonly _Ap_RimLightColor                = new ShaderSemanticsClass({ str: 'Ap_RimLightColor'});
  static readonly _MatCapColor                     = new ShaderSemanticsClass({ str: 'MatCapColor'});
  static readonly _Emissive_Color                  = new ShaderSemanticsClass({ str: 'Emissive_Color'});
  static readonly _ColorShift                      = new ShaderSemanticsClass({ str: 'ColorShift'});
  static readonly _ViewShift                       = new ShaderSemanticsClass({ str: 'ViewShift'});
  static readonly _Outline_Color                   = new ShaderSemanticsClass({ str: 'Outline_Color'});
  static readonly _MainTex                         = new ShaderSemanticsClass({ str: 'MainTex'});
  static readonly _1st_ShadeMap                    = new ShaderSemanticsClass({ str: '1st_ShadeMap'});
  static readonly _2nd_ShadeMap                    = new ShaderSemanticsClass({ str: '2nd_ShadeMap'});
  static readonly _ShadingGradeMap                 = new ShaderSemanticsClass({ str: 'ShadingGradeMap'});
  static readonly _ClippingMask                    = new ShaderSemanticsClass({ str: 'ClippingMask'});
  static readonly _NormalMap                       = new ShaderSemanticsClass({ str: 'NormalMap'});
  static readonly _HighColor_Tex                   = new ShaderSemanticsClass({ str: 'HighColor_Tex'});
  static readonly _Set_HighColorMask               = new ShaderSemanticsClass({ str: 'Set_HighColorMask'});
  static readonly _Set_RimLightMask                = new ShaderSemanticsClass({ str: 'Set_RimLightMask'});
  static readonly _MatCap_Sampler                  = new ShaderSemanticsClass({ str: 'MatCap_Sampler'});
  static readonly _NormalMapForMatCap              = new ShaderSemanticsClass({ str: 'NormalMapForMatCap '});
  static readonly _Set_MatcapMask                  = new ShaderSemanticsClass({ str: 'Set_MatcapMask'});
  static readonly _Emissive_Tex                    = new ShaderSemanticsClass({ str: 'Emissive_Tex '});
  static readonly _Outline_Sampler                 = new ShaderSemanticsClass({ str: 'Outline_Sampler'});
  static readonly _OutlineTex                      = new ShaderSemanticsClass({ str: 'OutlineTex'});
  static readonly _BakedNormal                     = new ShaderSemanticsClass({ str: 'BakedNormal'});


  static readonly Aspect = new ShaderSemanticsClass({ str: 'aspect' });
  static readonly CameraUp = new ShaderSemanticsClass({ str: 'cameraUp' });

  static blendEquationModeAlpha: number | null = null;
  private __OutlineWidthModeIsScreen = false;

  private __floatPropertiesArray: any[] = [];
  private __vectorPropertiesArray: any[] = [];
  private __texturePropertiesArray: any[] = [];

  constructor(isOutline: boolean, materialPropertiesArray: any, textures: any, isMorphing: boolean, isSkinning: boolean, isLighting: boolean) {
    super(ToonShader.getInstance(), 'ToonShading'
      + (isMorphing ? '+morphing' : '')
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'),
      { isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting }
    );

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    if (materialPropertiesArray != null) {
      this.__floatPropertiesArray = materialPropertiesArray[0];
      this.__vectorPropertiesArray = materialPropertiesArray[1];
      this.__texturePropertiesArray = materialPropertiesArray[2];
    } else {

      this.__floatPropertiesArray[0] = 0.0;  // _IsBaseMapAlphaAsClippingMask
      this.__floatPropertiesArray[1] = 0.0;  // _Inverse_Clipping
      this.__floatPropertiesArray[2] = 1.0;  // _Is_LightColor_Base
      this.__floatPropertiesArray[3] = 0.0;  // _Use_BaseAs1st
      this.__floatPropertiesArray[4] = 1.0;  // _Is_LightColor_1st_Shade
      this.__floatPropertiesArray[5] = 0.0;  // _Use_1stAs2nd
      this.__floatPropertiesArray[6] = 1.0;  // _Is_LightColor_2nd_Shade
      this.__floatPropertiesArray[7] = 0.0;  // _Is_NormalMapToBase
      this.__floatPropertiesArray[8] = 1.0;  // _Set_SystemShadowsToBase
      this.__floatPropertiesArray[9] = 1.0;  // _Is_Filter_HiCutPointLightColor
      this.__floatPropertiesArray[10] = 1.0;  // _Is_LightColor_HighColor
      this.__floatPropertiesArray[11] = 0.0;  // _Is_NormalMapToHighColor
      this.__floatPropertiesArray[12] = 0.0;  // _Is_SpecularToHighColor
      this.__floatPropertiesArray[13] = 0.0;  // _Is_BlendAddToHiColor
      this.__floatPropertiesArray[14] = 0.0;  // _Is_UseTweakHighColorOnShadow
      this.__floatPropertiesArray[15] = 1.0;  // _Is_LightColor_RimLight
      this.__floatPropertiesArray[16] = 0.0;  // _Is_NormalMapToRimLight
      this.__floatPropertiesArray[17] = 1.0;  // _Is_LightColor_Ap_RimLight
      this.__floatPropertiesArray[18] = 1.0;  // _Is_LightColor_MatCap
      this.__floatPropertiesArray[19] = 1.0;  // _Is_BlendAddToMatCap
      this.__floatPropertiesArray[20] = 0.0;  // _CameraRolling_Stabilizer
      this.__floatPropertiesArray[21] = 0.0;  // _Is_NormalMapForMatCap
      this.__floatPropertiesArray[22] = 0.0;  // _Is_UseTweakMatCapOnShadow
      this.__floatPropertiesArray[23] = 0.0;  // _Is_Ortho
      this.__floatPropertiesArray[24] = 0.0;  // _Is_PingPong_Base
      this.__floatPropertiesArray[25] = 0.0;  // _Is_ColorShift
      this.__floatPropertiesArray[26] = 0.0;  // _Is_ViewShift
      this.__floatPropertiesArray[27] = 0.0;  // _Is_ViewCoord_Scroll
      this.__floatPropertiesArray[28] = 0.0;  // _RimLight
      this.__floatPropertiesArray[29] = 0.0;  // _RimLight_FeatherOff
      this.__floatPropertiesArray[30] = 0.0;  // _LightDirection_MaskOn
      this.__floatPropertiesArray[31] = 0.0;  // _Add_Antipodean_RimLight
      this.__floatPropertiesArray[32] = 0.0;  // _Ap_RimLight_FeatherOff
      this.__floatPropertiesArray[33] = 0.0;  // _MatCap
      this.__floatPropertiesArray[34] = 0.0;  // _Inverse_MatcapMask
      this.__floatPropertiesArray[35] = 0.0;  // _Is_BlendBaseColor
      this.__floatPropertiesArray[36] = 1.0;  // _Is_LightColor_Outline
      this.__floatPropertiesArray[37] = 0.0;  // _Is_OutlineTex
      this.__floatPropertiesArray[38] = 0.0;  // _Is_BakedNormal
      this.__floatPropertiesArray[39] = 0.0;  // _Is_Filter_LightColor
      this.__floatPropertiesArray[40] = 0.0;  // _Clipping_Level
      this.__floatPropertiesArray[41] = 1.0;  // _BumpScale
      this.__floatPropertiesArray[42] = 0.0;  // _Tweak_SystemShadowsLevel
      this.__floatPropertiesArray[43] = 0.5;  // _1st_ShadeColor_Step
      this.__floatPropertiesArray[44] = 0.0001;  // _1st_ShadeColor_Feather
      this.__floatPropertiesArray[45] = 0.0;  // _2nd_ShadeColor_Step
      this.__floatPropertiesArray[46] = 0.0001;  // _2nd_ShadeColor_Feather
      this.__floatPropertiesArray[47] = 0.0;  // _StepOffset
      this.__floatPropertiesArray[48] = 0.0;  // _Tweak_ShadingGradeMapLevel
      this.__floatPropertiesArray[49] = 0.0;  // _BlurLevelSGM
      this.__floatPropertiesArray[50] = 0.0;  // _HighColor_Power
      this.__floatPropertiesArray[51] = 0.0;  // _TweakHighColorOnShadow
      this.__floatPropertiesArray[52] = 0.0;  // _Tweak_HighColorMaskLevel
      this.__floatPropertiesArray[53] = 0.1;  // _RimLight_Power
      this.__floatPropertiesArray[54] = 0.0001;  // _RimLight_InsideMask
      this.__floatPropertiesArray[55] = 0.0;  // _Tweak_LightDirection_MaskLevel
      this.__floatPropertiesArray[56] = 0.1;  // _Ap_RimLight_Power
      this.__floatPropertiesArray[57] = 0.0;  // _Tweak_RimLightMaskLevel
      this.__floatPropertiesArray[58] = 0.0;  // _BlurLevelMatcap
      this.__floatPropertiesArray[59] = 0.0;  // _Tweak_MatCapUV
      this.__floatPropertiesArray[60] = 0.0;  // _Rotate_MatCapUV
      this.__floatPropertiesArray[61] = 1.0;  // _BumpScaleMatcap
      this.__floatPropertiesArray[62] = 0.0;  // _Rotate_NormalMapForMatCapUV
      this.__floatPropertiesArray[63] = 0.0;  // _TweakMatCapOnShadow
      this.__floatPropertiesArray[64] = 0.0;  // _Tweak_MatcapMaskLevel
      this.__floatPropertiesArray[65] = 0.0;  // _Base_Speed
      this.__floatPropertiesArray[66] = 0.0;  // _Scroll_EmissiveU
      this.__floatPropertiesArray[67] = 0.0;  // _Scroll_EmissiveV
      this.__floatPropertiesArray[68] = 0.0;  // _Rotate_EmissiveUV
      this.__floatPropertiesArray[69] = 0.0;  // _ColorShift_Speed
      this.__floatPropertiesArray[70] = 0.0;  // _Tweak_transparency
      // ---------------------------------------------------------------------------
      this.__vectorPropertiesArray[0] = [1, 1, 1, 1];  // _Color
      this.__vectorPropertiesArray[1] = [1, 1, 1, 1];  // _BaseColor
      this.__vectorPropertiesArray[2] = [1, 1, 1, 1];  // _1st_ShadeColor
      this.__vectorPropertiesArray[3] = [1, 1, 1, 1];  // _2nd_ShadeColor
      this.__vectorPropertiesArray[4] = [0, 0, 0, 1];  // _HighColor
      this.__vectorPropertiesArray[5] = [1, 1, 1, 1];  // _RimLightColor
      this.__vectorPropertiesArray[6] = [1, 1, 1, 1];  // _Ap_RimLightColor
      this.__vectorPropertiesArray[7] = [1, 1, 1, 1];  // _MatCapColor
      this.__vectorPropertiesArray[8] = [0, 0, 0, 1];  // _Emissive_Color
      this.__vectorPropertiesArray[9] = [0, 0, 0, 1];  // _ColorShift
      this.__vectorPropertiesArray[10] = [0, 0, 0, 1];  // _ViewShift
      this.__vectorPropertiesArray[11] = [0.5, 0.5, 0.5, 1];  // _Outline_Color
      // ---------------------------------------------------------------------------
      this.__texturePropertiesArray[0] = 0;  // _MainTex
      this.__texturePropertiesArray[1] = 0;  // _1st_ShadeMap
      this.__texturePropertiesArray[2] = 0;  // _2nd_ShadeMap
      this.__texturePropertiesArray[3] = 0;  // _ShadingGradeMap
      this.__texturePropertiesArray[4] = 0;  // _ClippingMask
      this.__texturePropertiesArray[5] = 0;  // _NormalMap
      this.__texturePropertiesArray[6] = 0;  // _HighColor_Tex
      this.__texturePropertiesArray[7] = 0;  // _Set_HighColorMask
      this.__texturePropertiesArray[8] = 0;  // _Set_RimLightMask
      this.__texturePropertiesArray[9] = 0;  // _MatCap_Sampler
      this.__texturePropertiesArray[10] = 0;  // _NormalMapForMatCap 
      this.__texturePropertiesArray[11] = 0;  // _Set_MatcapMask
      this.__texturePropertiesArray[12] = 1;  // _Emissive_Tex 
      this.__texturePropertiesArray[13] = 0;  // _Outline_Sampler
      this.__texturePropertiesArray[14] = 0;  // _OutlineTex
      this.__texturePropertiesArray[15] = 0;  // _BakedNormal
      // this.texturePropertiesArray[9] = 0 // _UvAnimMaskTexture

      textures = [
        AbstractMaterialNode.__dummyWhiteTexture,
        AbstractMaterialNode.__dummyBlackTexture
      ]
    }

    // --------------------------------------------------------------------------------------------------------
    // PixelShader
    // UTS2
    shaderSemanticsInfoArray.push(

      {
        semantic: UTS2MaterialNode._IsBaseMapAlphaAsClippingMask, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Inverse_Clipping, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_Base, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Use_BaseAs1st, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_1st_Shade, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Use_1stAs2nd, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_2nd_Shade, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_NormalMapToBase, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Set_SystemShadowsToBase, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_Filter_HiCutPointLightColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_HighColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_NormalMapToHighColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_SpecularToHighColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_BlendAddToHiColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_UseTweakHighColorOnShadow, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_RimLight, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_NormalMapToRimLight, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_Ap_RimLight, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_MatCap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_BlendAddToMatCap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._CameraRolling_Stabilizer, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_NormalMapForMatCap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_UseTweakMatCapOnShadow, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_Ortho, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_PingPong_Base, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_ColorShift, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_ViewShift, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_ViewCoord_Scroll, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._RimLight, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._RimLight_FeatherOff, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._LightDirection_MaskOn, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Add_Antipodean_RimLight, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Ap_RimLight_FeatherOff, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._MatCap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Inverse_MatcapMask, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_BlendBaseColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_LightColor_Outline, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_OutlineTex, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_BakedNormal, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Is_Filter_LightColor, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Clipping_Level, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._BumpScale, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_SystemShadowsLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._1st_ShadeColor_Step, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.5), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._1st_ShadeColor_Feather, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0001), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._2nd_ShadeColor_Step, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._2nd_ShadeColor_Feather, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0001), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._StepOffset, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_ShadingGradeMapLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._BlurLevelSGM, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._HighColor_Power, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._TweakHighColorOnShadow, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_HighColorMaskLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._RimLight_Power, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.1), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._RimLight_InsideMask, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0001), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_LightDirection_MaskLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Ap_RimLight_Power, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.1), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_RimLightMaskLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._BlurLevelMatcap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_MatCapUV, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Rotate_MatCapUV, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._BumpScaleMatcap, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(1.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Rotate_NormalMapForMatCapUV, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._TweakMatCapOnShadow, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_MatcapMaskLevel, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Base_Speed, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Scroll_EmissiveU, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Scroll_EmissiveV, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Rotate_EmissiveUV, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._ColorShift_Speed, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Tweak_transparency, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      // ---------------------------------------------------------------------------
      {
        semantic: UTS2MaterialNode._Color, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[0]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._BaseColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[1]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._1st_ShadeColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[2]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._2nd_ShadeColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[3]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._HighColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[4]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._RimLightColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[5]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Ap_RimLightColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[6]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._MatCapColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[7]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Emissive_Color, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[8]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._ColorShift, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[9]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._ViewShift, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[10]), min: 0, max: 1,
      },
      {
        semantic: UTS2MaterialNode._Outline_Color, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: new Vector4(this.__vectorPropertiesArray[11]), min: 0, max: 1,
      },
      // ---------------------------------------------------------------------------
      {
        semantic: UTS2MaterialNode._MainTex, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, textures[materialPropertiesArray[2][0]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._1st_ShadeMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, textures[materialPropertiesArray[2][1]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._2nd_ShadeMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [2, textures[materialPropertiesArray[2][2]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._ShadingGradeMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [3, textures[materialPropertiesArray[2][3]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._ClippingMask, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [4, textures[materialPropertiesArray[2][4]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._NormalMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [5, textures[materialPropertiesArray[2][5]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._HighColor_Tex, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [6, textures[materialPropertiesArray[2][6]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._Set_HighColorMask, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [7, textures[materialPropertiesArray[2][7]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._Set_RimLightMask, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [8, textures[materialPropertiesArray[2][8]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._MatCap_Sampler, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [9, textures[materialPropertiesArray[2][9]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._NormalMapForMatCap , componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [10, textures[materialPropertiesArray[2][10]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._Set_MatcapMask, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [11, textures[materialPropertiesArray[2][11]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._Emissive_Tex , componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [12, textures[materialPropertiesArray[2][12]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._Outline_Sampler, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [13, textures[materialPropertiesArray[2][13]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._OutlineTex, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [14, textures[materialPropertiesArray[2][14]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: UTS2MaterialNode._BakedNormal, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [15, textures[materialPropertiesArray[2][15]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
    );

    // --------------------------------------------------------------------------------------------------------
    // wip
    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.HDRIFormat, componentType: ComponentType.Int, compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector2(0, 0), min: 0, max: 5,
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessFactor, componentType: ComponentType.Float, compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector2(1, 1), min: 0, max: 2,
      },
      {
        semantic: ShaderSemantics.Wireframe, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(0, 0, 1), min: 0, max: 10,
      },
      {
        semantic: ShaderSemantics.BaseColorFactor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1), min: 0, max: 2,
      },
      {
        semantic: ShaderSemantics.IBLParameter, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
      },
      {
        semantic: ShaderSemantics.BaseColorTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [16, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [17, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.NormalTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [18, AbstractMaterialNode.__dummyBlueTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.OcclusionTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [19, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.EmissiveTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [20, AbstractMaterialNode.__dummyBlackTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.DiffuseEnvTexture, componentType: ComponentType.Int, compositionType: CompositionType.TextureCube,
        stage: ShaderType.PixelShader, isSystem: true, soloDatum: false,
        initialValue: [21, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.SpecularEnvTexture, componentType: ComponentType.Int, compositionType: CompositionType.TextureCube,
        stage: ShaderType.PixelShader, isSystem: true, soloDatum: false,
        initialValue: [22, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },

      {
        semantic: ShaderSemantics.Wireframe, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(0, 0, 1), min: 0, max: 10,
      },

    );

    // point cloud
    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(30.0), min: 0, max: 100
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1
      }
    );

    // _DebugMode
    switch (this.__floatPropertiesArray[4]) {
      case 1: this.__definitions += '#define RN_MTOON_DEBUG_NORMAL\n'; break;
      case 2: this.__definitions += '#define RN_MTOON_DEBUG_LITSHADERATE\n'; break;
    }

    if (isOutline) {
      this.__definitions += '#define RN_MTOON_IS_OUTLINE\n';

      // _OutlineWidthMode
      switch (this.__floatPropertiesArray[13]) {
        case 0: this.__definitions += '#define RN_MTOON_OUTLINE_NONE\n'; break;
        case 1: this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_WORLD\n'; break;
        case 2:
          this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_SCREEN\n';
          this.__OutlineWidthModeIsScreen = true;
          break;
      }

      // _OutlineColorMode
      switch (this.__floatPropertiesArray[8]) {
        case 0: this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_FIXED\n'; break;
        case 1: this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_MIXED\n'; break;
      }

      shaderSemanticsInfoArray.push(
        /*
        {
          semantic: MToonSingleMaterialNode._OutlineWidthTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [9, textures[materialPropertiesArray[2][3]]], min: 0, max: Number.MAX_SAFE_INTEGER,
        },
        {
          semantic: MToonSingleMaterialNode._OutlineWidth, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[12]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode._OutlineScaledMaxDistance, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[11]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode._OutlineColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Vector3(this.__vectorPropertiesArray[2]), min: 0, max: 1,
        },
        {
          semantic: MToonSingleMaterialNode._OutlineLightingMix, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[10]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode.Aspect, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new Scalar(1.0), min: 0, max: 1,
        },
        */
      );
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.MorphTargetNumber, componentType: ComponentType.Int, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new Scalar(0), min: 0, max: Config.maxVertexMorphNumberInShader, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.DataTextureMorphOffsetPosition, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.MorphWeights, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        }
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setMaterialParameters(material: Material, isOutline: boolean) {

    /*
    if (MToonSingleMaterialNode.blendEquationModeAlpha === undefined) {
      const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      const gl = glw!.getRawContext();
      if (glw!.isWebGL2) {
        MToonSingleMaterialNode.blendEquationModeAlpha = gl.MAX;
      } else if (glw!.webgl1ExtBM) {
        MToonSingleMaterialNode.blendEquationModeAlpha = glw!.webgl1ExtBM.MAX_EXT;
      } else {
        MToonSingleMaterialNode.blendEquationModeAlpha = gl.FUNC_ADD;
      }
    }
     */

    // _BlendMode
    switch (this.__floatPropertiesArray[0]) {
      case 1: this.__definitions += '#define RN_ALPHATEST_ON\n'; material.alphaMode = AlphaMode.Mask; break;
      case 2: this.__definitions += '#define RN_ALPHABLEND_ON\n'; material.alphaMode = AlphaMode.Blend; break;
      case 3: this.__definitions += '#define RN_ALPHABLEND_ON\n'; material.alphaMode = AlphaMode.Blend; break;
    }

    // _ZWrite
    if (this.__floatPropertiesArray[22] === 0) {
      material.depthMask = false;
      // material.blendEquationMode = MToonSingleMaterialNode.blendEquationModeAlpha;
      // material.blendFuncSrcFactor = MToonSingleMaterialNode.unityBlendEnumCorrespondence(this.__floatPropertiesArray[21]);
      // material.blendFuncDstFactor = MToonSingleMaterialNode.unityBlendEnumCorrespondence(this.__floatPropertiesArray[5]);
    } else {
      material.depthMask = true;
    }

    if (!isOutline) {
      // _CullMode
      switch (this.__floatPropertiesArray[2]) {
        case 0: material.cullface = false; break;
        case 1: material.cullface = true; material.cullFrontFaceCCW = false; break;
        case 2: material.cullface = true; material.cullFrontFaceCCW = true; break;
      }

    } else {
      // _OutlineCullMode
      switch (this.__floatPropertiesArray[9]) {
        case 0: material.cullface = false; break;
        case 1: material.cullface = true; material.cullFrontFaceCCW = false; break;
        case 2: material.cullface = true; material.cullFrontFaceCCW = true; break;
      }
    }
    this.__floatPropertiesArray = [];
    this.__vectorPropertiesArray = [];
    this.__texturePropertiesArray = [];
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }

    if (args.setUniform) {
      /// Matrices
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      /// Skinning
      const skeletalComponent = args.entity.getSkeletal();
      this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

      (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).cameraUp, cameraComponent.upInner.v);

      if (this.__OutlineWidthModeIsScreen) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).aspect, cameraComponent.aspect);
      }

    } else {
      /*
      material.setParameter(MToonSingleMaterialNode.CameraUp, cameraComponent.upInner);

      if (this.__OutlineWidthModeIsScreen) {
        material.setParameter(MToonSingleMaterialNode.Aspect, cameraComponent.aspect);
      }
       */
    }

    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }

  static unityBlendEnumCorrespondence(enumNumber: number) {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const gl = glw!.getRawContext();

    let result;
    switch (enumNumber) {
      case 0: result = gl.ZERO; break;
      case 1: result = gl.ONE; break;
      case 2: result = gl.DST_COLOR; break;
      case 3: result = gl.SRC_COLOR; break;
      case 4: result = gl.ONE_MINUS_DST_COLOR; break;
      case 5: result = gl.SRC_ALPHA; break;
      case 6: result = gl.ONE_MINUS_SRC_COLOR; break;
      case 7: result = gl.DST_ALPHA; break;
      case 8: result = gl.ONE_MINUS_DST_ALPHA; break;
      case 9: result = gl.SRC_ALPHA_SATURATE; break;
      case 10: result = gl.ONE_MINUS_SRC_ALPHA; break;
    }
    return result;
  }

}

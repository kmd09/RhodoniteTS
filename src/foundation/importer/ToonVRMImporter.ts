import ComponentRepository from "../core/ComponentRepository";
import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption, glTF2 } from "../../types/glTF";
import MeshComponent from "../components/MeshComponent";
import ModelConverter from "./ModelConverter";
import PhysicsComponent from "../components/PhysicsComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import SphereCollider from "../physics/SphereCollider";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import VRMColliderGroup from "../physics/VRMColliderGroup";
import VRMSpringBoneGroup from "../physics/VRMSpringBoneGroup";
import VRMSpringBonePhysicsStrategy from "../physics/VRMSpringBonePhysicsStrategy";

type HumanBone = {
  bone: string,
  node: number,
  useDefaultValues: boolean
};

type LookAt = {
  curve: number[],
  xRange: number,
  yRange: number
};

type BlendShapeBind = {
  mesh: number,
  index: number,
  weight: number
};

type BlendShapeGroup = {
  name: string,
  presetName: string,
  binds: BlendShapeBind[],
  materialValues: []
};

type BoneGroup = {
  comment: string,
  stiffiness: number,
  gravityPower: number,
  gravityDir: {
    x: number,
    y: number,
    z: number
  },
  dragForce: number,
  center: number,
  hitRadius: number,
  bones: number[],
  colliderGroups: number[]
}

type Collider = {
  offset: {
    x: number,
    y: number,
    z: number
  },
  radius: number
}

type ColliderGroup = {
  node: number,
  colliders: Collider[]
}

type MaterialProperty = {
  name: string,
  renderQueue: number,
  shader: string,
  floatProperties: {
    _Cutoff: number,
    _BumpScale: number,
    _ReceiveShadowRate: number,
    _ShadingGradeRate: number,
    _ShadeShift: number,
    _ShadeToony: number,
    _LightColorAttenuation: number,
    _IndirectLightIntensity: number,
    _OutlineWidth: number,
    _OutlineScaledMaxDistance: number,
    _OutlineLightingMix: number,
    _DebugMode: number,
    _BlendMode: number,
    _OutlineWidthMode: number,
    _OutlineColorMode: number,
    _CullMode: number,
    _OutlineCullMode: number,
    _SrcBlend: number,
    _DstBlend: number,
    _ZWrite: number
  },
  vectorProperties: {
    _Color: number[],
    _ShadeColor: number[],
    _MainTex: number[],
    _ShadeTexture: number[],
    _BumpMap: number[],
    _ReceiveShadowTexture: number[],
    _ShadingGradeTexture: number[],
    _SphereAdd: number[],
    _EmissionColor: number[],
    _EmissionMap: number[],
    _OutlineWidthTexture: number[],
    _OutlineColor: number[]
  },
  textureProperties: {
    _MainTex: number,
    _ShadeTexture: number,
    _BumpMap: number,
    _SphereAdd: number,
    _EmissionMap: number
  },
  keywordMap: {
    _NORMALMAP: boolean
  },
  tagMap: {
    RenderType: string
  }
}

export type VRM = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption,
      rnEntities?: Entity[],
      basePath?: string,
      version?: string,
      fileType?: string,
    }
  },
  buffers: any[],
  scenes: any[],
  meshes: any[],
  nodes: any[],
  skins: any[],
  materials: any[],
  cameras: any[],
  shaders?: any[],
  images: any[],
  animations: Array<{
    channels: any[],
    samplers: any[]
  }>,
  textures: any[],
  samplers: any[],
  accessors: any[],
  bufferViews: any[],
  buffer: any[],
  extensionsUsed?: any,
  extensions: {
    VRM: {
      exporterVersion: string,
      meta: {
        version: string,
        author: string,
        contactInformation: string,
        reference: string,
        title: string,
        texture: 30,
        allowedUserName: string,
        violentUssageName: string,
        sexualUssageName: string,
        commercialUssageName: string,
        otherPermissionUrl: string,
        licenseName: string,
        otherLicenseUrl: string
      }
      humanoid: {
        humanBones: HumanBone[],
        armStretch: number,
        legStretch: number,
        upperArmTwist: number,
        lowerArmTwist: number,
        upperLegTwist: number,
        lowerLegTwist: number,
        feetSpacing: number,
        hasTranslationDoF: false
      },
      firstPerson: {
        firstPersonBone: number,
        firstPersonBoneOffset: {
          x: number,
          y: number,
          z: number
        },
        meshAnnotations: [],
        lookAtTypeName: string,
        lookAtHorizontalInner: LookAt,
        lookAtHorizontalOuter: LookAt,
        lookAtVerticalDown: LookAt,
        lookAtVerticalUP: LookAt,
      },
      blendShapeMaster: {
        blendShapeGroups: BlendShapeGroup[]
      },
      secondaryAnimation: {
        boneGroups: BoneGroup[],
        colliderGroups: ColliderGroup[]
      },
      materialProperties: MaterialProperty[]
    }
  }
};
export default class ToonVRMImporter {
  private static __instance: ToonVRMImporter;

  private constructor() { }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new ToonVRMImporter();
    }
    return this.__instance;
  }

  /**
   * Import VRM file.
   */
  async import(uri: string, options?: GltfLoadOption) {
    if (options != null) {
      for (let file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      options.isImportVRM = true;
      if (options.defaultMaterialHelperName === "createUTS2Material") {
        options.defaultMaterialHelperName = null;
      }
    } else {
      options = {
        files: {},
        loaderExtension: null,
        defaultMaterialHelperName: null,
        defaultMaterialHelperArgumentArray: [],
        statesOfElements: [
          {
            targets: [], //["name_foo", "name_boo"],
            states: {
              enable: [],
              functions: {}
            },
            isTransparent: true,
            opacity: 1.0,
            isTextureImageToLoadPreMultipliedAlpha: false,
          }
        ],
        isImportVRM: true
      }
    }

    const gltf2Importer = Gltf2Importer.getInstance();
    const modelConverter = ModelConverter.getInstance();

    const gltfModel = await gltf2Importer.import(uri, options);

    const textures = this.__createTextures(gltfModel);
    const materialPropertiesArray = this.__createMaterialPropertiesArray(gltfModel, textures.length - 2, textures.length - 1);
    gltfModel.extensions.VRM["rnExtension"] = { materialPropertiesArray: materialPropertiesArray };

    let helperArgument = gltfModel.asset.extras!.rnLoaderOptions!.defaultMaterialHelperArgumentArray;
    if (helperArgument == null) {
      helperArgument = [{}];
    }
    const helperArgument0 = gltfModel.asset.extras!.rnLoaderOptions!.defaultMaterialHelperArgumentArray[0];
    helperArgument0["isOutline"] = false;
    helperArgument0["textures"] = textures;
    // if (helperArgument0["maxInstancesNumber"] == null) {
    //   helperArgument0["maxInstancesNumber"] = 100;
    // }


    const componentRepository = ComponentRepository.getInstance();
    let meshComponentsAll = <MeshComponent[]>componentRepository.getComponentsWithType(MeshComponent);

    let meshComponentsOld = <MeshComponent[]>meshComponentsAll.slice();
    const rootEntity = modelConverter.convertToRhodoniteObject(gltfModel);

    let meshComponentsInRootEntity;
    if (meshComponentsAll.length === 0) {
      meshComponentsInRootEntity = <MeshComponent[]>componentRepository.getComponentsWithType(MeshComponent).slice();
      meshComponentsAll = <MeshComponent[]>componentRepository.getComponentsWithType(MeshComponent);
    } else {
      meshComponentsInRootEntity = <MeshComponent[]>meshComponentsAll.slice();
      for (let i = 0; i < meshComponentsOld.length; i++) {
        const deleteIndex = meshComponentsInRootEntity.indexOf(meshComponentsOld[i]);
        meshComponentsInRootEntity.splice(deleteIndex, 1);
      }
    }

    helperArgument0["isOutline"] = true;

    meshComponentsOld = <MeshComponent[]>meshComponentsAll.slice();
    const outlineEntity = modelConverter.convertToRhodoniteObject(gltfModel);
    const meshComponentsInOutlineEntity = <MeshComponent[]>meshComponentsAll.slice();
    for (let i = 0; i < meshComponentsOld.length; i++) {
      const deleteIndex = meshComponentsInOutlineEntity.indexOf(meshComponentsOld[i]);
      meshComponentsInOutlineEntity.splice(deleteIndex, 1);
    }

    this.readSpringBone(rootEntity, gltfModel);

    return [rootEntity, outlineEntity];
  }

  readSpringBone(rootEntity: Entity, gltfModel: VRM) {
    const entityRepository = EntityRepository.getInstance();
    const boneGroups: VRMSpringBoneGroup[] = [];
    for (let boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      const vrmSpringBoneGroup = new VRMSpringBoneGroup();
      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.dragForce = boneGroup.dragForce;
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffiness;
      vrmSpringBoneGroup.gravityPower = boneGroup.gravityPower;
      vrmSpringBoneGroup.gravityDir = new Vector3(boneGroup.gravityDir.x, boneGroup.gravityDir.y, boneGroup.gravityDir.z);
      vrmSpringBoneGroup.colliderGroupIndices = boneGroup.colliderGroups;
      vrmSpringBoneGroup.hitRadius = boneGroup.hitRadius;
      for (let idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        vrmSpringBoneGroup.rootBones.push(entity.getSceneGraph());
        // const boneNodeIndex = boneGroup.bones[idxOfArray];
        // const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        // entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
      }
      boneGroups.push(vrmSpringBoneGroup);
    }

    VRMSpringBonePhysicsStrategy.setBoneGroups(boneGroups)
    for (let boneGroup of boneGroups) {
      for (let sg of boneGroup.rootBones) {
        this.addPhysicsComponentRecursively(entityRepository, sg);
      }
    }

    const colliderGroups: VRMColliderGroup[] = [];
    for (let colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation.colliderGroups) {
      const colliderGroup = gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[colliderGroupIdx]
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      for (let collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider();
        sphereCollider.position = new Vector3(collider.offset.x, collider.offset.y, collider.offset.z);
        sphereCollider.radius = collider.radius;
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.colliders = colliders;
      const baseSg = gltfModel.asset.extras!.rnEntities![colliderGroup.node].getSceneGraph();
      vrmColliderGroup.baseSceneGraph = baseSg;
      VRMSpringBonePhysicsStrategy.addColliderGroup(parseInt(colliderGroupIdx), vrmColliderGroup);
    }

  }

  addPhysicsComponentRecursively(entityRepository: EntityRepository, sg: SceneGraphComponent) {
    const entity = sg.entity;
    entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (let child of sg.children) {
        this.addPhysicsComponentRecursively(entityRepository, child);
      }
    }
  }

  private __createTextures(gltfModel: glTF2) {
    const gltfTextures = gltfModel.textures;
    const rnTextures: any = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture({ texture: gltfTextures[i] }, gltfModel);
      rnTextures.push(rnTexture);
    }

    const dummyWhiteTexture = new Texture();
    dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  private __createMaterialPropertiesArray(gltfModel: glTF2, dummyWhiteTextureNumber: number, dummyBlackTextureNumber: number) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;
    const materialPropertiesArray: any = [];

    for (let i = 0; i < materialProperties.length; i++) {
      // ----------------------------------------------------------------------------------
      const floatProperties = materialProperties[i].floatProperties;
      const floatPropertiesArray: number[] = [];

      floatPropertiesArray[0]  = (floatProperties["_IsBaseMapAlphaAsClippingMask "]   != null ? floatProperties["_IsBaseMapAlphaAsClippingMask "]   : 0.0);
      floatPropertiesArray[1]  = (floatProperties["_Inverse_Clipping "]               != null ? floatProperties["_Inverse_Clipping "]               : 0.0);
      floatPropertiesArray[2]  = (floatProperties["_Is_LightColor_Base "]             != null ? floatProperties["_Is_LightColor_Base "]             : 1.0);

      floatPropertiesArray[3]  = (floatProperties["_Use_BaseAs1st "]                  != null ? floatProperties["_Use_BaseAs1st "]                  : 0.0);
      floatPropertiesArray[4]  = (floatProperties["_Is_LightColor_1st_Shade "]        != null ? floatProperties["_Is_LightColor_1st_Shade "]        : 1.0);
      floatPropertiesArray[5]  = (floatProperties["_Use_1stAs2nd "]                   != null ? floatProperties["_Use_1stAs2nd "]                   : 0.0);
      floatPropertiesArray[6]  = (floatProperties["_Is_LightColor_2nd_Shade "]        != null ? floatProperties["_Is_LightColor_2nd_Shade "]        : 1.0);

      floatPropertiesArray[7]  = (floatProperties["_Is_NormalMapToBase "]             != null ? floatProperties["_Is_NormalMapToBase "]             : 0.0);

      floatPropertiesArray[8]  = (floatProperties["_Set_SystemShadowsToBase "]        != null ? floatProperties["_Set_SystemShadowsToBase "]        : 1.0);
      floatPropertiesArray[9]  = (floatProperties["_Is_Filter_HiCutPointLightColor "] != null ? floatProperties["_Is_Filter_HiCutPointLightColor "] : 1.0);
      floatPropertiesArray[10] = (floatProperties["_Is_LightColor_HighColor "]        != null ? floatProperties["_Is_LightColor_HighColor "]        : 1.0);
      floatPropertiesArray[11] = (floatProperties["_Is_NormalMapToHighColor "]        != null ? floatProperties["_Is_NormalMapToHighColor "]        : 0.0);
      floatPropertiesArray[12] = (floatProperties["_Is_SpecularToHighColor "]         != null ? floatProperties["_Is_SpecularToHighColor "]         : 0.0);
      floatPropertiesArray[13] = (floatProperties["_Is_BlendAddToHiColor "]           != null ? floatProperties["_Is_BlendAddToHiColor "]           : 0.0);
      floatPropertiesArray[14] = (floatProperties["_Is_UseTweakHighColorOnShadow "]   != null ? floatProperties["_Is_UseTweakHighColorOnShadow "]   : 0.0);

      floatPropertiesArray[15] = (floatProperties["_Is_LightColor_RimLight "]         != null ? floatProperties["_Is_LightColor_RimLight "]         : 1.0);
      floatPropertiesArray[16] = (floatProperties["_Is_NormalMapToRimLight "]         != null ? floatProperties["_Is_NormalMapToRimLight "]         : 0.0);
      floatPropertiesArray[17] = (floatProperties["_Is_LightColor_Ap_RimLight "]      != null ? floatProperties["_Is_LightColor_Ap_RimLight "]      : 1.0);
      floatPropertiesArray[18] = (floatProperties["_Is_LightColor_MatCap "]           != null ? floatProperties["_Is_LightColor_MatCap "]           : 1.0);
      floatPropertiesArray[19] = (floatProperties["_Is_BlendAddToMatCap "]            != null ? floatProperties["_Is_BlendAddToMatCap "]            : 1.0);

      floatPropertiesArray[20] = (floatProperties["_CameraRolling_Stabilizer "]       != null ? floatProperties["_CameraRolling_Stabilizer "]       : 0.0);
      floatPropertiesArray[21] = (floatProperties["_Is_NormalMapForMatCap "]          != null ? floatProperties["_Is_NormalMapForMatCap "]          : 0.0);
      floatPropertiesArray[22] = (floatProperties["_Is_UseTweakMatCapOnShadow "]      != null ? floatProperties["_Is_UseTweakMatCapOnShadow "]      : 0.0);
      floatPropertiesArray[23] = (floatProperties["_Is_Ortho "]                       != null ? floatProperties["_Is_Ortho "]                       : 0.0);
      floatPropertiesArray[24] = (floatProperties["_Is_PingPong_Base "]               != null ? floatProperties["_Is_PingPong_Base "]               : 0.0);
      floatPropertiesArray[25] = (floatProperties["_Is_ColorShift "]                  != null ? floatProperties["_Is_ColorShift "]                  : 0.0);
      floatPropertiesArray[26] = (floatProperties["_Is_ViewShift "]                   != null ? floatProperties["_Is_ViewShift "]                   : 0.0);
      floatPropertiesArray[27] = (floatProperties["_Is_ViewCoord_Scroll "]            != null ? floatProperties["_Is_ViewCoord_Scroll "]            : 0.0);

      floatPropertiesArray[28] = (floatProperties["_RimLight "]                       != null ? floatProperties["_RimLight "]                       : 0.0);
      floatPropertiesArray[29] = (floatProperties["_RimLight_FeatherOff "]            != null ? floatProperties["_RimLight_FeatherOff "]            : 0.0);
      floatPropertiesArray[30] = (floatProperties["_LightDirection_MaskOn "]          != null ? floatProperties["_LightDirection_MaskOn "]          : 0.0);
      floatPropertiesArray[31] = (floatProperties["_Add_Antipodean_RimLight "]        != null ? floatProperties["_Add_Antipodean_RimLight "]        : 0.0);
      floatPropertiesArray[32] = (floatProperties["_Ap_RimLight_FeatherOff "]         != null ? floatProperties["_Ap_RimLight_FeatherOff "]         : 0.0);
      floatPropertiesArray[33] = (floatProperties["_MatCap "]                         != null ? floatProperties["_MatCap "]                         : 0.0);
      floatPropertiesArray[34] = (floatProperties["_Inverse_MatcapMask "]             != null ? floatProperties["_Inverse_MatcapMask "]             : 0.0);
      floatPropertiesArray[35] = (floatProperties["_Is_BlendBaseColor "]              != null ? floatProperties["_Is_BlendBaseColor "]              : 0.0);
      floatPropertiesArray[36] = (floatProperties["_Is_LightColor_Outline "]          != null ? floatProperties["_Is_LightColor_Outline "]          : 1.0);
      floatPropertiesArray[37] = (floatProperties["_Is_OutlineTex "]                  != null ? floatProperties["_Is_OutlineTex "]                  : 0.0);
      floatPropertiesArray[38] = (floatProperties["_Is_BakedNormal "]                 != null ? floatProperties["_Is_BakedNormal "]                 : 0.0);
      floatPropertiesArray[39] = (floatProperties["_Is_Filter_LightColor "]           != null ? floatProperties["_Is_Filter_LightColor "]           : 0.0);

      floatPropertiesArray[40] = (floatProperties["_Clipping_Level"]                  != null ? floatProperties["_Clipping_Level"]                  : 0.0);
      floatPropertiesArray[41] = (floatProperties["_BumpScale"]                       != null ? floatProperties["_BumpScale"]                       : 1.0);
      floatPropertiesArray[42] = (floatProperties["_Tweak_SystemShadowsLevel"]        != null ? floatProperties["_Tweak_SystemShadowsLevel"]        : 0.0);

      floatPropertiesArray[43] = (floatProperties["_1st_ShadeColor_Step"]             != null ? floatProperties["_1st_ShadeColor_Step"]             : 0.5);
      floatPropertiesArray[44] = (floatProperties["_1st_ShadeColor_Feather"]          != null ? floatProperties["_1st_ShadeColor_Feather"]          : 0.0001);
      floatPropertiesArray[45] = (floatProperties["_2nd_ShadeColor_Step"]             != null ? floatProperties["_2nd_ShadeColor_Step"]             : 0.0);
      floatPropertiesArray[46] = (floatProperties["_2nd_ShadeColor_Feather"]          != null ? floatProperties["_2nd_ShadeColor_Feather"]          : 0.0001);
      floatPropertiesArray[47] = (floatProperties["_StepOffset"]                      != null ? floatProperties["_StepOffset"]                      : 0.0);
      floatPropertiesArray[48] = (floatProperties["_Tweak_ShadingGradeMapLevel"]      != null ? floatProperties["_Tweak_ShadingGradeMapLevel"]      : 0.0);
      floatPropertiesArray[49] = (floatProperties["_BlurLevelSGM"]                    != null ? floatProperties["_BlurLevelSGM"]                    : 0.0);
      floatPropertiesArray[50] = (floatProperties["_HighColor_Power"]                 != null ? floatProperties["_HighColor_Power"]                 : 0.0);

      floatPropertiesArray[50] = (floatProperties["_TweakHighColorOnShadow"]          != null ? floatProperties["_TweakHighColorOnShadow"]          : 0.0);
      floatPropertiesArray[51] = (floatProperties["_Tweak_HighColorMaskLevel"]        != null ? floatProperties["_Tweak_HighColorMaskLevel"]        : 0.0);
      floatPropertiesArray[52] = (floatProperties["_RimLight_Power"]                  != null ? floatProperties["_RimLight_Power"]                  : 0.1);
      floatPropertiesArray[53] = (floatProperties["_RimLight_InsideMask"]             != null ? floatProperties["_RimLight_InsideMask"]             : 0.0001);
      floatPropertiesArray[54] = (floatProperties["_Tweak_LightDirection_MaskLevel"]  != null ? floatProperties["_Tweak_LightDirection_MaskLevel"]  : 0.0);
      floatPropertiesArray[55] = (floatProperties["_Ap_RimLight_Power"]               != null ? floatProperties["_Ap_RimLight_Power"]               : 0.1);
      floatPropertiesArray[56] = (floatProperties["_Tweak_RimLightMaskLevel"]         != null ? floatProperties["_Tweak_RimLightMaskLevel"]         : 0.0);
      floatPropertiesArray[57] = (floatProperties["_BlurLevelMatcap"]                 != null ? floatProperties["_BlurLevelMatcap"]                 : 0.0);
      floatPropertiesArray[58] = (floatProperties["_Tweak_MatCapUV"]                  != null ? floatProperties["_Tweak_MatCapUV"]                  : 0.0);
      floatPropertiesArray[59] = (floatProperties["_Rotate_MatCapUV"]                 != null ? floatProperties["_Rotate_MatCapUV"]                 : 0.0);
      floatPropertiesArray[60] = (floatProperties["_BumpScaleMatcap"]                 != null ? floatProperties["_BumpScaleMatcap"]                 : 1.0);
      floatPropertiesArray[61] = (floatProperties["_Rotate_NormalMapForMatCapUV"]     != null ? floatProperties["_Rotate_NormalMapForMatCapUV"]     : 0.0);
      floatPropertiesArray[62] = (floatProperties["_TweakMatCapOnShadow"]             != null ? floatProperties["_TweakMatCapOnShadow"]             : 0.0);
      floatPropertiesArray[63] = (floatProperties["_Tweak_MatcapMaskLevel"]           != null ? floatProperties["_Tweak_MatcapMaskLevel"]           : 0.0);
      floatPropertiesArray[64] = (floatProperties["_Base_Speed"]                      != null ? floatProperties["_Base_Speed"]                      : 0.0);
      floatPropertiesArray[65] = (floatProperties["_Scroll_EmissiveU"]                != null ? floatProperties["_Scroll_EmissiveU"]                : 0.0);
      floatPropertiesArray[66] = (floatProperties["_Scroll_EmissiveV"]                != null ? floatProperties["_Scroll_EmissiveV"]                : 0.0);
      floatPropertiesArray[67] = (floatProperties["_Rotate_EmissiveUV"]               != null ? floatProperties["_Rotate_EmissiveUV"]               : 0.0);
      floatPropertiesArray[68] = (floatProperties["_ColorShift_Speed"]                != null ? floatProperties["_ColorShift_Speed"]                : 0.0);
      floatPropertiesArray[69] = (floatProperties["_Tweak_transparency "]             != null ? floatProperties["_Tweak_transparency "]             : 0.0);  // range(-1, 1)

      // ----------------------------------------------------------------------------------
      const vectorProperties = materialProperties[i].vectorProperties;
      const vectorPropertiesArray: any[] = [];
      vectorPropertiesArray[0]   = (vectorProperties["_Color"]            != null ? vectorProperties["_Color"]            : [1,1,1,1]);
      vectorPropertiesArray[1]   = (vectorProperties["_BaseColor"]        != null ? vectorProperties["_BaseColor"]        : [1,1,1,1]);
      vectorPropertiesArray[2]   = (vectorProperties["_1st_ShadeColor"]   != null ? vectorProperties["_1st_ShadeColor"]   : [1,1,1,1]);
      vectorPropertiesArray[3]   = (vectorProperties["_2nd_ShadeColor"]   != null ? vectorProperties["_2nd_ShadeColor"]   : [1,1,1,1]);
      vectorPropertiesArray[4]   = (vectorProperties["_HighColor"]        != null ? vectorProperties["_HighColor"]        : [0,0,0,1]);

      vectorPropertiesArray[5]   = (vectorProperties["_RimLightColor"]    != null ? vectorProperties["_RimLightColor"]    : [1,1,1,1]);
      vectorPropertiesArray[6]   = (vectorProperties["_Ap_RimLightColor"] != null ? vectorProperties["_Ap_RimLightColor"] : [1,1,1,1]);
      vectorPropertiesArray[7]   = (vectorProperties["_MatCapColor"]      != null ? vectorProperties["_MatCapColor"]      : [1,1,1,1]);
      vectorPropertiesArray[8]   = (vectorProperties["_Emissive_Color"]   != null ? vectorProperties["_Emissive_Color"]   : [0,0,0,1]);
      vectorPropertiesArray[9]   = (vectorProperties["_ColorShift"]       != null ? vectorProperties["_ColorShift"]       : [0,0,0,1]);
      vectorPropertiesArray[10]   = (vectorProperties["_ViewShift"]        != null ? vectorProperties["_ViewShift"]        : [0,0,0,1]);
      vectorPropertiesArray[11]   = (vectorProperties["_Outline_Color"]    != null ? vectorProperties["_Outline_Color"]    : [0.5,0.5,0.5,1]);

      // ----------------------------------------------------------------------------------
      // do not set initial value
      const textureProperties = materialProperties[i].textureProperties;
      const texturePropertiesArray: any[] = [];
      texturePropertiesArray[0]  = (textureProperties["_MainTex"]             != null ? textureProperties["_MainTex"]             : dummyWhiteTextureNumber);
      texturePropertiesArray[1]  = (textureProperties["_1st_ShadeMap"]        != null ? textureProperties["_1st_ShadeMap"]        : dummyWhiteTextureNumber);
      texturePropertiesArray[2]  = (textureProperties["_2nd_ShadeMap"]        != null ? textureProperties["_2nd_ShadeMap"]        : dummyWhiteTextureNumber);

      texturePropertiesArray[3]  = (textureProperties["_ShadingGradeMap"]     != null ? textureProperties["_ShadingGradeMap"]     : dummyWhiteTextureNumber);

      texturePropertiesArray[4]  = (textureProperties["_ClippingMask"]        != null ? textureProperties["_ClippingMask"]        : dummyWhiteTextureNumber);
      texturePropertiesArray[5]  = (textureProperties["_NormalMap"]           != null ? textureProperties["_NormalMap"]           : dummyWhiteTextureNumber);
      texturePropertiesArray[6]  = (textureProperties["_HighColor_Tex"]       != null ? textureProperties["_HighColor_Tex"]       : dummyWhiteTextureNumber);

      texturePropertiesArray[7]  = (textureProperties["_Set_HighColorMask"]   != null ? textureProperties["_Set_HighColorMask"]   : dummyWhiteTextureNumber);
      texturePropertiesArray[8]  = (textureProperties["_Set_RimLightMask"]    != null ? textureProperties["_Set_RimLightMask"]    : dummyWhiteTextureNumber);
      texturePropertiesArray[9]  = (textureProperties["_MatCap_Sampler"]      != null ? textureProperties["_MatCap_Sampler"]      : dummyWhiteTextureNumber);
      texturePropertiesArray[10] = (textureProperties["_NormalMapForMatCap "] != null ? textureProperties["_NormalMapForMatCap "] : dummyWhiteTextureNumber);
      texturePropertiesArray[11] = (textureProperties["_Set_MatcapMask"]      != null ? textureProperties["_Set_MatcapMask"]      : dummyWhiteTextureNumber);
      texturePropertiesArray[12] = (textureProperties["_Emissive_Tex "]       != null ? textureProperties["_Emissive_Tex "]       : dummyBlackTextureNumber);
      texturePropertiesArray[13] = (textureProperties["_Outline_Sampler"]     != null ? textureProperties["_Outline_Sampler"]     : dummyWhiteTextureNumber);
      texturePropertiesArray[14] = (textureProperties["_OutlineTex"]          != null ? textureProperties["_OutlineTex"]          : dummyWhiteTextureNumber);
      texturePropertiesArray[15] = (textureProperties["_BakedNormal"]         != null ? textureProperties["_BakedNormal"]         : dummyWhiteTextureNumber);


      materialPropertiesArray.push([floatPropertiesArray, vectorPropertiesArray, texturePropertiesArray]);

    }
    return materialPropertiesArray;
  }

}
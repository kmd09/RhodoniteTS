import Config from "../core/Config";
import Material from "../materials/core/Material";
import RenderPass from "../renderer/RenderPass";
import AbstractMaterialNode from "../materials/core/AbstractMaterialNode";
import PbrShadingSingleMaterialNode from "../materials/singles/PbrShadingSingleMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/singles/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/singles/EnvConstantSingleMaterialNode";
import FXAA3QualitySingleMaterialNode from "../materials/singles/FXAA3QualitySingleMaterialNode";
import DepthEncodeSingleMaterialNode from "../materials/singles/DepthEncodeSingleMaterialNode";
import ShadowMapDecodeClassicSingleMaterialNode from "../materials/singles/ShadowMapDecodeClassicSingleMaterialNode";
import GammaCorrectionSingleMaterialNode from "../materials/singles/GammaCorrectionSingleMaterialNode";
import EntityUIDOutputSingleMaterialNode from "../materials/singles/EntityUIDOutputSingleMaterialNode";
import MToonSingleMaterialNode from "../materials/singles/MToonSingleMaterialNode";
import classicSingleShaderVertex from "../../webgl/shaderity_shaders/classicSingleShader/classicSingleShader.vert";
import classicSingleShaderFragment from "../../webgl/shaderity_shaders/classicSingleShader/classicSingleShader.frag";
import CustomSingleMaterialNode from "../materials/singles/CustomSingleMaterialNode";
import Shaderity, { ShaderityObject } from "shaderity";

function createMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material {
  const isRegistMaterialType = Material.isRegisteredMaterialType(materialName);

  if (!isRegistMaterialType) {
    Material.registerMaterial(materialName, materialNodes!, maxInstancesNumber!);
  }

  const material = Material.createMaterial(materialName, materialNodes);
  return material;
}

function createEmptyMaterial() {
  const materialName = 'Empty';
  const material = createMaterial(materialName, [], Config.maxMaterialInstanceForEachType);
  material.tryToSetUniqueName('EmptyMaterial', true);
  return material;
}


function createPbrUberMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'PbrUber'
    + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new PbrShadingSingleMaterialNode({ isMorphing, isSkinning, isLighting });

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterialOld({
  additionalName = '', isSkinning = false, isLighting = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'ClassicUberOld'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ClassicShadingSingleMaterialNode({ isSkinning: isSkinning, isLighting: isLighting });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterial({
  additionalName = '', isSkinning = true, isLighting = false, isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'ClassicUber'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new CustomSingleMaterialNode({ name: 'ClassicUber', isSkinning: isSkinning, isLighting: isLighting, isMorphing: isMorphing,
    vertexShader: classicSingleShaderVertex,
    pixelShader: classicSingleShaderFragment });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createEnvConstantMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'EnvConstant' + `_${additionalName}`;

  const materialNode = new EnvConstantSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createFXAA3QualityMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}) {
  const materialName = 'FXAA3Quality' + `_${additionalName}`;

  const materialNode = new FXAA3QualitySingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createDepthEncodeMaterial({ additionalName = '', isSkinning = false, maxInstancesNumber = 10 } = {}) {
  const materialName = 'DepthEncode'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '');

  const materialNode = new DepthEncodeSingleMaterialNode({ isSkinning: isSkinning });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createShadowMapDecodeClassicSingleMaterial(depthEncodeRenderPass: RenderPass, { additionalName = '', isMorphing = false, isSkinning = false, isLighting = true, colorAttachmentsNumber = 0, maxInstancesNumber = 20 } = {}) {
  const materialName = 'ShadowMapDecodeClassic'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ShadowMapDecodeClassicSingleMaterialNode(depthEncodeRenderPass, { isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting, colorAttachmentsNumber: colorAttachmentsNumber });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createGammaCorrectionMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}) {
  const materialName = 'GammaCorrection' + `_${additionalName}`;

  const materialNode = new GammaCorrectionSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createEntityUIDOutputMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'EntityUIDOutput' + `_${additionalName}`;

  const materialNode = new EntityUIDOutputSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createMToonMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = true,
  isOutline = false, materialProperties = undefined, textures = undefined, debugMode = undefined,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'MToon'
    + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '-lighting' : '')
    + (isOutline ? '-outline' : '');

  const materialNode = new MToonSingleMaterialNode(isOutline, materialProperties, textures, isMorphing, isSkinning, isLighting, debugMode);

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);
  materialNode.setMaterialParameters(material, isOutline);

  return material;
}


export default Object.freeze({
  createEmptyMaterial, createClassicUberMaterial, createPbrUberMaterial, createEnvConstantMaterial, createFXAA3QualityMaterial, createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial, createGammaCorrectionMaterial, createEntityUIDOutputMaterial, createMToonMaterial
});

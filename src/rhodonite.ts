import EntityRepository from './foundation/core/EntityRepository';
import ComponentRepository from './foundation/core/ComponentRepository';
import TransformComponent from './foundation/components/TransformComponent';
import SceneGraphComponent from './foundation/components/SceneGraphComponent';
import MeshComponent from './foundation/components/MeshComponent';
import MeshRendererComponent from './foundation/components/MeshRendererComponent';
import Primitive from './foundation/geometry/Primitive';
import { PrimitiveMode, PrimitiveModeEnum as primitiveModeEnum } from './foundation/definitions/PrimitiveMode';
import { VertexAttribute, VertexAttributeEnum as vertexAttributeEnum } from './foundation/definitions/VertexAttribute';
import { CompositionType, CompositionTypeEnum as compositionTypeEnum } from './foundation/definitions/CompositionType';
import { ComponentType, ComponentTypeEnum as componentTypeEnum } from './foundation/definitions/ComponentType';
import { CameraControllerType, CameraControllerTypeEnum as cameraControllerTypeEnum } from './foundation/definitions/CameraControllerType';
import System from './foundation/system/System';
import Scalar from './foundation/math/Scalar';
import Vector2 from './foundation/math/Vector2';
import Vector3 from './foundation/math/Vector3';
import Vector4 from './foundation/math/Vector4';
import MutableVector2 from './foundation/math/MutableVector2';
import MutableVector3 from './foundation/math/MutableVector3';
import MutableVector4 from './foundation/math/MutableVector4';
import Matrix22 from './foundation/math/Matrix22';
import Matrix33 from './foundation/math/Matrix33';
import Matrix44 from './foundation/math/Matrix44';
import MutableMatrix22 from './foundation/math/MutableMatrix22';
import MutableMatrix33 from './foundation/math/MutableMatrix33';
import MutableMatrix44 from './foundation/math/MutableMatrix44';
import { ProcessApproach } from './foundation/definitions/ProcessApproach';
import Gltf1Importer from './foundation/importer/Gltf1Importer';
import Gltf2Importer from './foundation/importer/Gltf2Importer';
import DrcPointCloudImporter from './foundation/importer/DrcPointCloudImporter';
import GltfImporter from './foundation/importer/GltfImporter';
import Gltf2Exporter from './foundation/exporter/Gltf2Exporter';
import ModelConverter from './foundation/importer/ModelConverter';
import ModuleManager from './foundation/system/ModuleManager';
import MemoryManager from './foundation/core/MemoryManager';
import CameraComponent from './foundation/components/CameraComponent';
import { CameraType } from './foundation/definitions/CameraType';
import AnimationComponent from './foundation/components/AnimationComponent';
import LightComponent from './foundation/components/LightComponent';
import { LightType } from './foundation/definitions/LightType';
import { AlphaMode } from './foundation/definitions/AlphaMode';
import CubeTexture from './foundation/textures/CubeTexture';
import CameraControllerComponent from './foundation/components/CameraControllerComponent';
import detectFormat from './foundation/importer/FormatDetector';
import Config from './foundation/core/Config';
import Plane from './foundation/geometry/Plane';
import Sphere from './foundation/geometry/Sphere';
import Material from './foundation/materials/Material';
import MaterialHelper from './foundation/helpers/MaterialHelper';
import { ShaderSemantics } from './foundation/definitions/ShaderSemantics';
import RenderPass from './foundation/renderer/RenderPass';
import FrameBuffer from './foundation/renderer/FrameBuffer';
import Expression from './foundation/renderer/Expression';
import { HdriFormat } from './foundation/definitions/HdriFormat';
import RenderTargetTexture from './foundation/textures/RenderTargetTexture';
import RenderBuffer from './foundation/textures/RenderBuffer';
import { TextureParameter } from './foundation/definitions/TextureParameter';
import RenderableHelper from './foundation/helpers/RenderableHelper';
import Texture from './foundation/textures/Texture';
import EntityHelper from './foundation/helpers/EntityHelper';
import MathClassUtil from './foundation/math/MathClassUtil';
import Mesh from './foundation/geometry/Mesh';
import { MathUtil } from './foundation/math/MathUtil';
import Component from './foundation/core/Component';
import EnvConstantSingleMaterialNode from './foundation/materials/EnvConstantSingleMaterialNode';
import RnObject from './foundation/core/RnObject';
import VRMImporter from './foundation/importer/VRMImporter';
import BlendShapeComponent from './foundation/components/BlendShapeComponent';
import AnimationAssigner from './foundation/importer/AnimationAssigner';
import { MiscUtil } from './foundation/misc/MiscUtil';
import OrbitCameraController from './foundation/cameras/OrbitCameraController';
import WalkThroughCameraController from './foundation/cameras/WalkThroughCameraController';

let Rn = {
  EntityRepository,
  ComponentRepository,
  TransformComponent,
  SceneGraphComponent,
  MeshComponent,
  MeshRendererComponent,
  Primitive,
  CompositionType,
  ComponentType,
  VertexAttribute,
  PrimitiveMode,
  System,
  Scalar,
  Vector2,
  Vector3,
  Vector4,
  MutableVector2,
  MutableVector3,
  MutableVector4,
  Matrix22,
  Matrix33,
  Matrix44,
  MutableMatrix22,
  MutableMatrix33,
  MutableMatrix44,
  ProcessApproach,
  Gltf1Importer,
  Gltf2Importer,
  DrcPointCloudImporter,
  GltfImporter,
  ModelConverter,
  ModuleManager,
  MemoryManager,
  CameraComponent,
  CameraType,
  AnimationComponent,
  LightComponent,
  LightType,
  CubeTexture,
  CameraControllerComponent,
  CameraControllerType,
  AlphaMode,
  Gltf2Exporter,
  detectFormat,
  Config,
  Plane,
  Sphere,
  Material,
  MaterialHelper,
  ShaderSemantics,
  RenderPass,
  FrameBuffer,
  Expression,
  HdriFormat,
  RenderTargetTexture,
  RenderBuffer,
  TextureParameter,
  RenderableHelper,
  Texture,
  EntityHelper,
  MathClassUtil,
  Mesh,
  MathUtil,
  Component,
  EnvConstantSingleMaterialNode,
  RnObject,
  VRMImporter,
  BlendShapeComponent,
  AnimationAssigner,
  MiscUtil,
  OrbitCameraController,
  WalkThroughCameraController
};

if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Rn;
}

export type RnType = typeof Rn;
(0,eval)('this').Rn = Rn;

export type CompositionTypeEnum = compositionTypeEnum;
export type ComponentTypeEnum = componentTypeEnum;
export type VertexAttributeEnum = vertexAttributeEnum;
export type PrimitiveModeEnum = primitiveModeEnum;
export type CameraControllerTypeEnum = cameraControllerTypeEnum;
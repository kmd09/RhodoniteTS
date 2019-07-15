import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import RowMajarMatrix44 from "../foundation/math/RowMajarMatrix44";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";
import Entity from "../foundation/core/Entity";
import CubeTexture from "../foundation/textures/CubeTexture";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import Material from "../foundation/materials/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import Mesh from "../foundation/geometry/Mesh";
import { WebGLResourceHandle, Index, Count } from "../types/CommonTypes";
export default class WebGLStrategyUniform implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __lightComponents?;
    private __dummyWhiteTextureUid?;
    private __dummyBlackTextureUid?;
    private __dummyBlackCubeTextureUid?;
    private static __isOpaqueMode;
    private __webglShaderProgram?;
    private __lastRenderPassCullFace;
    private __pointDistanceAttenuation;
    private __lastRenderPassTickCount;
    private __pbrCookTorranceBrdfLutDataUrlUid?;
    private vertexShaderMethodDefinitions_uniform;
    private __lastShader;
    private static transposedMatrix44;
    private constructor();
    setupShaderProgram(meshComponent: MeshComponent): void;
    $load(meshComponent: MeshComponent): Promise<void>;
    $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attatchShaderProgram(material: Material): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    dettachVertexData(glw: WebGLContextWrapper): void;
    static getInstance(): WebGLStrategyUniform;
    common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass): boolean;
    static isOpaqueMode(): boolean;
    static isTransparentMode(): boolean;
    private __setUniformBySystem;
    $render(idx: Index, meshComponent: MeshComponent, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, renderPassTickCount: Count, diffuseCube?: CubeTexture, specularCube?: CubeTexture): void;
    private setWebGLStates;
}

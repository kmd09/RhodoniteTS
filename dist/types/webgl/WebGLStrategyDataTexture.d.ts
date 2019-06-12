import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Matrix44 from "../foundation/math/Matrix44";
import Material from "../foundation/materials/Material";
export default class WebGLStrategyDataTexture implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __meshComponent?;
    private __vertexHandles;
    private static __vertexHandleOfPrimitiveObjectUids;
    private __isVAOSet;
    private constructor();
    readonly vertexShaderMethodDefinitions_dataTexture: string;
    setupShaderProgram(meshComponent: MeshComponent): void;
    private __isLoaded;
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attatchShaderProgram(material: Material): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyDataTexture;
    common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44): boolean;
}

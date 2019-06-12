import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import RowMajarMatrix44 from "../foundation/math/RowMajarMatrix44";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";
import Entity from "../foundation/core/Entity";
import CubeTexture from "../foundation/textures/CubeTexture";
import Material from "../foundation/materials/Material";
import RenderPass from "../foundation/renderer/RenderPass";
export default interface WebGLStrategy {
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    $render?(i: Index, meshComponent: MeshComponent, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, diffuseCube?: CubeTexture, specularCube?: CubeTexture): void;
    common_$prerender(): void;
    common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44): boolean;
    attachGPUData(primitive: Primitive): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attatchShaderProgram(material: Material): void;
}

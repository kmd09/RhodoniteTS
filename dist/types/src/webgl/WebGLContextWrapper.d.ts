/// <reference types="webgl2" />
import { WebGLExtensionEnum } from "./WebGLExtension";
import { RenderBufferTargetEnum } from "../foundation/definitions/RenderBufferTarget";
export default class WebGLContextWrapper {
    __gl: WebGLRenderingContext | any;
    __webglVersion: number;
    width: Size;
    height: Size;
    readonly canvas: HTMLCanvasElement;
    readonly webgl1ExtVAO?: OES_vertex_array_object;
    readonly webgl1ExtIA?: ANGLE_instanced_arrays;
    readonly webgl1ExtTF?: OES_texture_float;
    readonly webgl1ExtTHF?: OES_texture_half_float;
    readonly webgl1ExtTFL?: OES_texture_float_linear;
    readonly webgl1ExtTHFL?: OES_texture_half_float_linear;
    readonly webgl1ExtTFA?: EXT_texture_filter_anisotropic;
    readonly webgl1ExtEIUI?: OES_element_index_uint;
    readonly webgl1ExtSTL?: EXT_shader_texture_lod;
    readonly webgl1ExtDRV?: OES_standard_derivatives;
    readonly webgl1ExtDB?: WEBGL_draw_buffers;
    readonly webgl2ExtTFL?: OES_texture_float_linear;
    private __activeTextures2D;
    private __activeTexturesCube;
    private __isDebugMode;
    __extensions: Map<WebGLExtensionEnum, WebGLObject>;
    constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement);
    getRawContext(): WebGLRenderingContext | any;
    isSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum): boolean;
    readonly isWebGL2: boolean;
    createVertexArray(): any;
    deleteVertexArray(vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES): void;
    bindVertexArray(vao: WebGLVertexArrayObjectOES | null): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number): void;
    drawArraysInstanced(primitiveMode: number, first: number, count: number, instanceCount: number): void;
    colorAttachiment(index: Index): any;
    drawBuffers(buffers: RenderBufferTargetEnum[]): void;
    private __activeTexture;
    bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture): void;
    bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture): void;
    unbindTexture2D(activeTextureIndex: Index): void;
    unbindTextureCube(activeTextureIndex: Index): void;
    unbindTextures(): void;
    private __getExtension;
}

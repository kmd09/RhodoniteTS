import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class ZoPBRShader extends GLSLShader {
    static __instance: ZoPBRShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): ZoPBRShader;
    readonly vertexShaderDefinitions: string;
    vertexShaderBody: string;
    readonly fragmentShaderSimple: string;
    readonly pixelShaderDefinitions: string;
    readonly pixelShaderBody: string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}

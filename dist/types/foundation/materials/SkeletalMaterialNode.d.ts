import { ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
export default class SkeletalMaterialNode extends AbstractMaterialNode {
    constructor();
    static initDefaultTextures(): Promise<void>;
    convertValue(shaderSemantic: ShaderSemanticsEnum, value: any): void;
}

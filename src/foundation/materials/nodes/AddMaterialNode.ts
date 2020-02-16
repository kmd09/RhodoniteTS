import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import AddShaderityObject from "../../../webgl/shaderity_shaders/nodes/Add.glsl"
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";

export default class AddMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(null, 'add', {}, AddShaderityObject, AddShaderityObject);

    this.__vertexInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'lhs',
      });
    this.__vertexInputs.push(
      {
        compositionType: compositionType,
        componentType: ComponentType.Float,
        name: 'rhs',
      });
    this.__vertexOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

    this.__pixelInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'lhs',
      });
    this.__pixelInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'rhs',
      });
    this.__pixelOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });
  }

}

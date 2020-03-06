
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class IfStatementShaderNode extends AbstractShaderNode {
  private elseOutputName = 'ElseStart';

  constructor() {
    super('ifStatement', undefined, new IfStatementShader());

    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'condition',
      });
    this.__outputs.push(
      {
        compositionType: CompositionType.Unknown,
        componentType: ComponentType.Unknown,
        name: 'ifStart',
      });

  }

  setElse(isElseExist: boolean) {
    if (isElseExist) {
      this.__outputs.push(
        {
          compositionType: CompositionType.Unknown,
          componentType: ComponentType.Unknown,
          name: this.elseOutputName,
        });
    } else {
      this.__outputs = this.__outputs.filter((output)=>{
        if (output.name !== this.elseOutputName) {
          return true;
        } else {
          return false;
        }
      });
    }
  }
}

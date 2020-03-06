
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class IfStatementShaderNode extends AbstractShaderNode {
  public static readonly functionName = 'ifStatement';
  public static readonly IfStart = 'IfStart';
  public static readonly ElseStart = 'ElseStart'

  constructor() {
    super(IfStatementShaderNode.functionName, undefined, new IfStatementShader());

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
        name: IfStatementShaderNode.IfStart,
      });

  }

  setElse(isElseExist: boolean) {
    if (isElseExist) {
      this.__outputs.push(
        {
          compositionType: CompositionType.Unknown,
          componentType: ComponentType.Unknown,
          name: IfStatementShaderNode.ElseStart,
        });
    } else {
      this.__outputs = this.__outputs.filter((output)=>{
        if (output.name !== IfStatementShaderNode.ElseStart) {
          return true;
        } else {
          return false;
        }
      });
    }
  }
}

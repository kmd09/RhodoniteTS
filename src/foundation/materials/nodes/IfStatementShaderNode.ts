
import AbstractMaterialNode, { ShaderSocket } from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class IfStatementShaderNode extends AbstractShaderNode {
  public static readonly functionName = 'ifStatement';
  public static readonly IfStart = 'IfStart';
  public static readonly ElseIfStart = 'ElseIfStart'
  public static readonly ElseStart = 'ElseStart'
  private __isElseExist = false;

  constructor() {
    super(IfStatementShaderNode.functionName, undefined, new IfStatementShader());

    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'if_condition',
      });
    this.__outputs.push(
      {
        compositionType: CompositionType.Unknown,
        componentType: ComponentType.Unknown,
        name: IfStatementShaderNode.IfStart,
      });

  }

  addElseIf() {

    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'elseif_condition_' + (this.__inputs.length - 1),
      });


    let elseOutput: ShaderSocket|undefined;
    if (this.__isElseExist) {
      elseOutput = this.__outputs.pop();
    }

    this.__outputs.push(
      {
        compositionType: CompositionType.Unknown,
        componentType: ComponentType.Unknown,
        name: IfStatementShaderNode.ElseIfStart + '_' + (this.__outputs.length - 1 - (this.__isElseExist ? 1 : 0)),
      });

    if (this.__isElseExist) {
      this.__outputs.push(elseOutput!);
    }
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
    this.__isElseExist = isElseExist;
  }
}

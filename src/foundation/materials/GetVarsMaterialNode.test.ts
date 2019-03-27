import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import GetVarsMaterialNode from "./GetVarsMaterialNode";

test('GetVersMaterialNode vertex shader works correctly', () => {

  const getVarsMaterialNode = new GetVarsMaterialNode();
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'a_position',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inLocal',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'viewMatrix',
      isImmediateValue: false
    }
  );

  console.log(getVarsMaterialNode.shader.vertexShaderDefinitions);

expect(getVarsMaterialNode.shader.vertexShaderDefinitions).toEqual(`function getVars(
  in vec4 a_position,
  out vec4 position_inLocal,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inLocal = a_position;
  viewMatrix = u_viewMatrix;
}`)
});

test('GetVersMaterialNode pixel shader works correctly', () => {

  const getVarsMaterialNode = new GetVarsMaterialNode();
  getVarsMaterialNode.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'v_position',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inWorld',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'viewMatrix',
      isImmediateValue: false
    }
  );

  console.log(getVarsMaterialNode.shader.pixelShaderDefinitions);

expect(getVarsMaterialNode.shader.pixelShaderDefinitions).toEqual(`function getVars(
  in vec4 v_position,
  out vec4 position_inWorld,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inWorld = v_position;
  viewMatrix = u_viewMatrix;
}`)
});

import _Rn from '../../../dist/esm/index';
import { CameraComponent } from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;

const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');

  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  // camera
  const cameraComponent = createCameraComponent();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;  // depthCameraComponent.direction = lightDirection;
  const cameraEntity = cameraComponent.entity;
  cameraEntity.getTransform().translate = new Rn.Vector3(0.2, 0.35, -0.5);

  // render pass and expression
  const renderPass = createRenderPassSpecifyingCameraComponent(cameraComponent);

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  // entities
  const smallBoardEntity = createBoardEntityWithDepthEncodeMaterial();
  const largeBoardEntity = createBoardEntityWithDepthEncodeMaterial();

  renderPass.addEntities([smallBoardEntity, largeBoardEntity]);

  smallBoardEntity.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);
  smallBoardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -1.0);
  smallBoardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);

  largeBoardEntity.getTransform().translate = new Rn.Vector3(0, 0, -1.5);
  largeBoardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);


  // For debug
  // const cameraControllerComponent = cameraEntity.getCameraController();
  // const controller = cameraControllerComponent.controller as OrbitCameraController;
  // controller.dolly = 0.65;
  // controller.setTarget(largeBoardEntity);


  let count = 0;

  const draw = function () {

    if (count > 0) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    }

    system.process([expression]);

    count++;
    requestAnimationFrame(draw);
  };

  draw();
})();

  function createBoardEntityWithDepthEncodeMaterial() {
    const entityRepository = Rn.EntityRepository.getInstance();
    const entity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);

    const primitive = new Rn.Plane();
    primitive.generate({
      width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
      material: Rn.MaterialHelper.createDepthEncodeMaterial({})
    });

    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createCameraComponent() {
    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
    // For debug
    // const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
    const cameraComponent = cameraEntity.getCamera();
    return cameraComponent;
  }

  function createRenderPassSpecifyingCameraComponent(cameraComponent) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    return renderPass;
  }


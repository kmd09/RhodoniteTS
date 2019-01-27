
let p = null;

const load = async function(time){
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent.componentTID);
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.parameters = new Rn.Vector4(1, 10000, 90, 1);
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 5);

//  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/BoxTextured/glTF/BoxTextured.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/Lantern/glTF/Lantern.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/WaterBottle/glTF/WaterBottle.gltf');
 // const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/VC/glTF/VC.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/Buggy/glTF/Buggy.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
 // const response = await importer.import('../../../assets/gltf/2.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
 // const response = await importer.import('../../../assets/gltf/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
  const response = await importer.import('../../../assets/gltf/2.0/BoxAnimated/glTF/BoxAnimated.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/BrainStem/glTF/BrainStem.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
  rootGroup.getTransform().rotate = new Rn.Vector3(0, 1.0, 0.0);

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.zero();
  const draw = function(time) {

    if (p == null) {
      if (response != null) {

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 600, 600);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      p = document.createElement('p');
      p.setAttribute("id", "rendered");
      p.innerText = 'Rendered.';
      document.body.appendChild(p);

    }

    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      //rotationVec3.v[0] = 0.1;
      //rotationVec3.v[1] = rotation;
      //rotationVec3.v[2] = 0.1;
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
      //console.log(time);
      rootGroup.getTransform().rotate = rotationVec3;
    }

    system.process();

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;


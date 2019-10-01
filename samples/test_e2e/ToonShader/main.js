
let p = null;

const load = async function(time){
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.ToonVRMImporter.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.parameters = new Rn.Vector4(0.1, 1000, 90, 1);
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);


  // Lights
  // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  // lightEntity.getTransform().translate = new Rn.Vector3(1.0, 100000.0, 1.0);
  // lightEntity.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);
  const lightEntity2 = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  lightEntity2.getTransform().translate = new Rn.Vector3(0.0, 0.0, 10.0);
  lightEntity2.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);
  //lightEntity2.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
  //lightEntity2.getComponent(Rn.LightComponent).type = Rn.LightType.Directional;


  const rootGroups = await importer.import('../../../assets/vrm/yuuko_san.vrm', {
    defaultMaterialHelperArgumentArray: [{ isLighting: true }],
  });

  for (let rootGroup of rootGroups) {
    rootGroup.getTransform().rotate = new Rn.Vector3(0, Math.PI, 0.0);
  }
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
  // rootGroup.getTransform().rotate = new Rn.Vector3(0, Math.PI, 0.0);
  //  rootGroup.getTransform().scale = new Rn.Vector3(0.01, 0.01, 0.01);

  const componentRepository = Rn.ComponentRepository.getInstance();
  const meshComponent = componentRepository.getComponentsWithType(Rn.MeshComponent)[0];
  const mesh = meshComponent.mesh;
  const primitive = mesh.getPrimitiveAt(0);
  // primitive.material.setParameter(Rn.ShaderSemantics.PointSize, 1);

  // primitive.material = Rn.MaterialHelper.createToonShadingMaterial();
  // primitive.material.setParameter(Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(512, 512));

  // console.log(primitive.material);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
  cameraControllerComponent.setTarget(rootGroups[0]);


  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function(time) {

    if (p == null && count > 0) {
      if (rootGroups[0] != null) {

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
      //      rootGroup.getTransform().scale = rotationVec3;
      //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
    }

    system.process();
    count++;

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}

function setRoughness(value) {
  window.modelMaterial.setParameter(Rn.ShaderSemantics.MetallicRoughnessFactor, new Rn.Vector2(1, value));
  window.draw();
}

function setDebugView(value) {
  window.modelMaterial.setParameter('debugView', value);
  window.draw();
}

function setGtype(value) {
  window.modelMaterial.setParameter('g_type', value);
  window.draw();
}

function setF0(value) {
  window.modelMaterial.setParameter('f0', value);
  window.draw();
}

function setDisableFresnel(value) {
  window.modelMaterial.setParameter('disable_fresnel', value);
  window.draw();
}


function setClearColor(x, y, z) {
  window.clearColor = new Rn.Vector4(x,y,z,1);
  window.gl.clearColor(window.clearColor.x, window.clearColor.y, window.clearColor.z, window.clearColor.w);
  window.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setMode(value) {
  window.modelMaterial.setParameter('mode', value);
  if (value === 0) {
    window.planeEntity.getComponent(Rn.MeshRendererComponent).isVisible = true;
    window.sphereEntity.getComponent(Rn.MeshRendererComponent).isVisible = false;
  } else {
    window.planeEntity.getComponent(Rn.MeshRendererComponent).isVisible = false;
    window.sphereEntity.getComponent(Rn.MeshRendererComponent).isVisible = true;
  }
  window.draw();
}

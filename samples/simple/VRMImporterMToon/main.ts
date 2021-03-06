import CameraComponent from '../../../dist/esm/foundation/components/CameraComponent';
import _Rn from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  const VRMImporter = Rn.VRMImporter.getInstance();
  const entityRepository = Rn.EntityRepository.getInstance();


  // params
  const rootGroupScale = new Rn.Vector3(1, 1, 1);

  const displayResolution = 800;


  // setting cameras except for post effect
  const mainCameraComponent = createCameraComponent();
  mainCameraComponent.zNear = 0.1;
  mainCameraComponent.zFar = 1000.0;
  mainCameraComponent.setFovyAndChangeFocalLength(25.0);
  mainCameraComponent.aspect = 1.0;
  // mainCameraComponent.zFarInner = 3000.0;


  const renderPassMain = renderPassHelperSetCameraComponent(mainCameraComponent);
  const framebufferMain = createFramebuffer(renderPassMain, 2 * displayResolution, 2 * displayResolution, 1, {});

  const renderPassGamma = createRenderPassForPostEffect('createGammaCorrectionMaterial');
  setTextureParameterForMeshComponents(renderPassGamma.meshComponents, Rn.ShaderSemantics.BaseColorTexture, framebufferMain.colorAttachments[0]);
  const framebufferGamma = createFramebuffer(renderPassGamma, displayResolution, displayResolution, 1, {});


  const renderPassFxaa = createRenderPassForPostEffect('createFXAA3QualityMaterial');
  setParameterForMeshComponents(renderPassFxaa.meshComponents, Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(displayResolution, displayResolution));
  setTextureParameterForMeshComponents(renderPassFxaa.meshComponents, Rn.ShaderSemantics.BaseColorTexture, framebufferGamma.colorAttachments[0]);

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPassMain, renderPassGamma, renderPassFxaa]);

  // rootGroups[0]: main entity, rootGroups[1]: outline entity(if exist)
  const rootGroups = await VRMImporter.import('./../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [{
      isSkinning: false,
      isMorphing: false
    }],
    // autoResizeTexture: true
  });

  for (let rootGroup of rootGroups) {
    rootGroup.getTransform().scale = rootGroupScale;
    rootGroup.getTransform().rotate = new Rn.Vector3(0.0, Math.PI, 0.0);
  }

  renderPassMain.addEntities(rootGroups);

  // Env Cube
  const sphereEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  const spherePrimitive = new Rn.Sphere();
  window.sphereEntity = sphereEntity;
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = './../../../assets/ibl/shanghai_bund/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();
  sphereMaterial.setTextureParameter(Rn.ShaderSemantics.ColorEnvTexture, environmentCubeTexture);
  spherePrimitive.generate({ radius: -50, widthSegments: 40, heightSegments: 40, material: sphereMaterial });
  const sphereMeshComponent = sphereEntity.getMesh();
  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);
  sphereMeshComponent.setMesh(sphereMesh);
  sphereEntity.getTransform().translate = new Rn.Vector3(0, 20, -20);


  renderPassMain.addEntities([sphereEntity]);


  // Lights
  const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent]);
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);

  // CameraControllerComponent
  const mainCameraEntityUID = mainCameraComponent.entityUID;
  entityRepository.addComponentsToEntity([Rn.CameraControllerComponent], mainCameraEntityUID);

  const mainCameraEntity = mainCameraComponent.entity;
  const cameraControllerComponent = mainCameraEntity.getCameraController();
  cameraControllerComponent.controller.setTarget(rootGroups[0]);

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  // const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  let rot = 0;

  const draw = function () {
    if (p == null && count > 0) {
      if (rootGroups[0] != null) {

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 800, 800);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);

    }

    if (window.isAnimating) {
      const date = new Date();
    }

    system.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();

})();




function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}

function rotEnv(rot) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.rotationOfCubeMap = rot;
  }
  // window.sphere2MeshRendererComponent.rotationOfCubeMap = rot;
  window.sphereEntity.getTransform().rotate = new Rn.Vector3(0, -rot, 0);
}

function setDiffuseCubeMapContribution(value) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.diffuseCubeMapContribution = value;
  }
}

function setSpecularCubeMapContribution(value) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.specularCubeMapContribution = value;
  }
}

function setAnisotropy(baseAnisotropy, clearcoatAnisotropy) {
  const materials = Rn.Material.getAllMaterials();
  for (let material of materials) {
    material.setParameter(Rn.ShaderSemantics.Anisotropy, new Rn.Vector2(baseAnisotropy, clearcoatAnisotropy));
  }
}

function setClearCoat(factor, roughness) {
  const materials = Rn.Material.getAllMaterials();
  for (let material of materials) {
    material.setParameter(Rn.ShaderSemantics.ClearCoatParameter, new Rn.Vector2(factor, roughness));
  }
}

function setSheen(sheenColor, sheenSubsurfaceColor) {
  const materials = Rn.Material.getAllMaterials();
  for (let material of materials) {
    material.setParameter(Rn.ShaderSemantics.SheenParameter, new Rn.Vector2(sheenColor, sheenSubsurfaceColor));
  }
}

function arrayDifference(arrayWholeSet, arraySubset) {
  const result = arrayWholeSet.slice();
  for (let i = 0; i < arraySubset.length; i++) {
    const deleteIndex = result.indexOf(arraySubset[i]);
    result.splice(deleteIndex, 1);
  }
  return result;
}

function createCameraComponent() {
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
  const cameraComponent = cameraEntity.getCamera();
  return cameraComponent;
}

function createFramebuffer(renderPass, width, height, textureNum, property) {
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(width, height, textureNum, property);
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  return entity;
}

function materialHelperForMeshComponents(meshComponents, materialHelperFunctionStr, argumentsArray) {
  for (let meshComponent of meshComponents) {
    const mesh = meshComponent.mesh;
    for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
      const primitive = mesh.getPrimitiveAt(i);
      primitive.material = Rn.MaterialHelper[materialHelperFunctionStr].apply(this, argumentsArray);
    }
  }
}

let renderPassForPostEffectCameraComponent: CameraComponent;
function createRenderPassForPostEffect(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
    material: Rn.MaterialHelper[materialHelperFunctionStr].apply(this, arrayOfHelperFunctionArgument)
  });

  const boardEntity = generateEntity();
  boardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);
  boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  if (renderPassForPostEffectCameraComponent == null) {
    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zFarInner = 1.0;
    renderPassForPostEffectCameraComponent = cameraComponent;
  }

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
  renderPass.cameraComponent = renderPassForPostEffectCameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function renderPassHelperSetCameraComponent(cameraComponent) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;

  return renderPass;
}

function setParameterForMeshComponents(meshComponents, shaderSemantic, value) {
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    const primitiveNumber = mesh.getPrimitiveNumber();

    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setParameter(shaderSemantic, value);
    }
  }
}

function setTextureParameterForMeshComponents(meshComponents, shaderSemantic, value) {
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    if (!mesh) continue;

    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setTextureParameter(shaderSemantic, value);
    }
  }
}



const load = async function (time) {
  const moduleManager = Rn.ModuleManager.getInstance();
  await moduleManager.loadModule('webgl');
  await moduleManager.loadModule('pbr');
  const rnWebXRModule = await moduleManager.loadModule('xr');
  const webXRSystem = rnWebXRModule.WebXRSystem.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  let count = 0;
  const draw = function (time) {


    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 600, 600);
    gl.clearColor(0.5, 0.2, 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    system.process([]);
    count++;

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;


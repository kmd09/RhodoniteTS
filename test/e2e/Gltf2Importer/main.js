import Rn from "../../../dist/rhodonite.mjs";

let p = null;

const load = async function(time){

  const importer = Rn.Gltf2Importer.getInstance();
  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');

  const draw = function(time) {

    if (p == null) {
      if (response != null) {
        const system = Rn.System.getInstance();
        const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.DataTextureWebGL1, document.getElementById('world'));

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

    system.process();

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;


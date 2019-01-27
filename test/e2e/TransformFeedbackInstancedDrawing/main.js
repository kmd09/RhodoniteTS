(async function(){

  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }

  function readyBasicVerticesData() {
    const indices = new Uint16Array([
//        0, 1, 2, 2, 3, 0

      3, 1, 0, 2, 1, 3,
      4, 5, 7, 7, 5, 6,
      8, 9, 11, 11, 9, 10,
      15, 13, 12, 14, 13, 15,
      19, 17, 16, 18, 17, 19,
      20, 21, 23, 23, 21, 22
    ]);

    const positions = new Float32Array([
      // -1, -1, 0.0,
      //  1, -1, 0.0,
      //  1, 1, 0.0,
      // -1, 1, 0.0

      // upper
      -1, 1, -1,
      1,  1, -1,
      1,  1, 1,
      -1, 1, 1,
      // lower
      -1, -1, -1,
      1,  -1, -1,
      1,  -1, 1,
      -1, -1, 1,
      // front
      -1, -1, 1,
      1,  -1, 1,
      1,  1, 1,
      -1, 1, 1,
      // back
      -1, -1, -1,
      1,  -1, -1,
      1,  1, -1,
      -1, 1, -1,
      // right
      1, -1, -1,
      1,  -1, 1,
      1,  1, 1,
      1, 1, -1,
      // left
      -1, -1, -1,
      -1,  -1, 1,
      -1,  1, 1,
      -1, 1, -1
    ]);

    const colors = new Float32Array([
      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      0.0, 1.0, 1.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0
    ]);

    const primitive = Rn.Primitive.createPrimitive({
      indices: indices,
      attributeCompositionTypes: [Rn.CompositionType.Vec3, Rn.CompositionType.Vec3],
      attributeSemantics: [Rn.VertexAttribute.Position, Rn.VertexAttribute.Color0],
      attributes: [positions, colors],
      material: 0,
      primitiveMode: Rn.PrimitiveMode.Triangles
    });

    return primitive;
  }
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.TransformFeedbackWebGL2, document.getElementById('world'));

  gl.enable(gl.DEPTH_TEST);

  gl.viewport(0, 0, 600, 600);

  // 背景描画
  gl.clearColor(0.8, 0.8, 0.8, 1.0);
  // バッファをクリアする
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const primitive = readyBasicVerticesData();
  const primitive2 = readyBasicVerticesData();

  const entities = [];
  const entityNumber = 100;
  for (let i=0; i<entityNumber; i++) {
    const sqrtEntityNumber = Math.floor(Math.sqrt(entityNumber));
    const entity = generateEntity();
    entities.push(entity);
    const meshComponent = entity.getComponent(Rn.MeshComponent);
    meshComponent.addPrimitive(primitive);
    entity.getTransform().scale = new Rn.Vector3(1/sqrtEntityNumber/2, 1/sqrtEntityNumber/2, 1/sqrtEntityNumber/2);
    entity.getTransform().translate = new Rn.Vector3(1/sqrtEntityNumber * 2 * (i%sqrtEntityNumber) - 1.0 + 1/sqrtEntityNumber, Math.floor(i / sqrtEntityNumber)/sqrtEntityNumber*2 -1.0 + 1/sqrtEntityNumber, 0.0);
  }

  const startTime = Date.now();
  let p = null;
  const rotationVec3 = Rn.MutableVector3.zero();
  let count = 0
  const draw = function(time){

    if (p == null) {
      p = document.createElement('p');
      p.setAttribute("id", "rendered");
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }
    const date = new Date();

    if (window.isAnimating) {
      const rotation = 0.001 * (date.getTime() - startTime);
      entities.forEach(function(entity){
      rotationVec3.v[0] = rotation;
      rotationVec3.v[1] = rotation;
      rotationVec3.v[2] = rotation;
      entity.getTransform().rotate = rotationVec3;
      });
    }

//      console.log(date.getTime());
    system.process();
    requestAnimationFrame(draw);
  }

  draw();


})();

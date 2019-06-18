import Primitive from "./Primitive";
import { VertexAttribute } from "../definitions/VertexAttribute";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import MemoryManager from "../core/MemoryManager";
import { BufferUse } from "../definitions/BufferUse";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import Vector3 from "../math/Vector3";
import Accessor from "../memory/Accessor";
import Vector2 from "../math/Vector2";
import AABB from "../math/AABB";

export default class Mesh {
  private readonly __meshUID: MeshUID;
  public static readonly invalidateMeshUID = -1;
  public static __mesh_uid_count = Mesh.invalidateMeshUID;
  private __instanceIdx = 0;
  private __primitives: Primitive[] = [];
  private __opaquePrimitives: Array<Primitive> = [];
  private __transparentPrimitives: Array<Primitive> = [];
  private __instanceOf?: Mesh;
  public weights = [];
  private __morphPrimitives: Array<Primitive> = [];
  private __localAABB = new AABB();

  constructor() {
    this.__meshUID = ++Mesh.__mesh_uid_count;
  }

  addPrimitive(primitive: Primitive) {
    this.__instanceOf = void 0;
    this.__instanceIdx = 0;

    if (primitive.material == null || !primitive.material.isBlend()) {
      this.__opaquePrimitives.push(primitive);
    } else {
      this.__transparentPrimitives.push(primitive);
    }
    this.__primitives = this.__opaquePrimitives.concat(this.__transparentPrimitives);
  }

  setMesh(mesh: Mesh) {
    this.__primitives.length = 0;
    this.__instanceOf = mesh;
    this.__instanceIdx = mesh.instanceIndex + 1;
  }

  isAllBlend(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isAllBlend();
    } else {
      if (this.__transparentPrimitives.length > 0 && this.__opaquePrimitives.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  isBlendPartially(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isBlendPartially();
    } else {
      if (this.__transparentPrimitives.length > 0 && this.__opaquePrimitives.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  isOpaque(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isOpaque();
    } else {
      if (this.__transparentPrimitives.length === 0 && this.__opaquePrimitives.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  isFirstOpaquePrimitiveAt(index: Index): boolean {
    if (this.isFirstOpaquePrimitiveAt(index)) {
      return this.__instanceOf!.isFirstOpaquePrimitiveAt(index);
    } else {
      if (this.__opaquePrimitives.length > 0) {
        if (index === 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  isFirstTransparentPrimitiveAt(index: Index): boolean {
    if (this.isFirstOpaquePrimitiveAt(index)) {
      return this.__instanceOf!.isFirstTransparentPrimitiveAt(index);
    } else {
      if (this.__transparentPrimitives.length > 0) {
        if (this.__opaquePrimitives.length === index) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  __calcFaceNormalFor3Vertices(i: Index, pos0: Vector3, pos1: Vector3, pos2: Vector3, normalAccessor: Accessor, indicesAccessor?: Accessor) {
    // Calc normal
    const ax = pos1.x - pos0.x;
    const ay = pos1.y - pos0.y;
    const az = pos1.z - pos0.z;
    const bx = pos2.x - pos0.x;
    const by = pos2.y - pos0.y;
    const bz = pos2.z - pos0.z;

    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    let da = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (da <= 1e-6) {
      da = 0.0001;
    }
    da = 1.0 / da;
    nx *= da;
    ny *= da;
    nz *= da;
    const faceNormal = new Vector3(nx, ny, nz);
    normalAccessor.setVec3(i, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });
    normalAccessor.setVec3(i + 1, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });
    normalAccessor.setVec3(i + 2, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });

  }

  __calcTangents() {
    for (let primitive of this.__primitives) {
      const tangentIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Tangent);
      if (tangentIdx !== -1) {
        continue;
      }
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal);
      if (texcoordIdx !== -1 && normalIdx !== -1) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);

        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const normalAccessor = primitive.attributeAccessors[normalIdx];
        const indicesAccessor = primitive.indicesAccessor;

        let incrementNum = 3; // PrimitiveMode.Triangles
        if (primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
          primitive.primitiveMode === PrimitiveMode.TriangleFan) {
          incrementNum = 1;
        }

        const vertexNum = primitive.getVertexCountAsIndicesBased();
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);

        const tangentAttributeByteSize = positionAccessor.byteLength;
        const tangentBufferView = buffer.takeBufferView({ byteLengthToNeed: tangentAttributeByteSize, byteStride: 0, isAoS: false });
        const tangentAccessor = tangentBufferView.takeAccessor({ compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: positionAccessor.elementCount });
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
          const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
          const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });
          const uv0 = texcoordAccessor.getVec2(i, { indicesAccessor });
          const uv1 = texcoordAccessor.getVec2(i + 1, { indicesAccessor });
          const uv2 = texcoordAccessor.getVec2(i + 2, { indicesAccessor });
          const norm0 = normalAccessor.getVec3(i, { indicesAccessor });
          const norm1 = normalAccessor.getVec3(i + 1, { indicesAccessor });
          const norm2 = normalAccessor.getVec3(i + 2, { indicesAccessor });

          this.__calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, norm1, norm2, tangentAccessor, indicesAccessor);
        }
        primitive.setVertexAttribute(tangentAccessor, VertexAttribute.Tangent);
      }
    }
  }

  __calcTangentFor3Vertices(
    i: Index,
    pos0: Vector3,
    pos1: Vector3,
    pos2: Vector3,
    uv0: Vector2,
    uv1: Vector2,
    uv2: Vector2,
    norm0: Vector3,
    norm1: Vector3,
    norm2: Vector3,
    tangentAccessor: Accessor,
    indicesAccessor?: Accessor,
  ) {
    const tan0Vec3 = this.__calcTangentPerVertex(pos0, pos1, pos2, uv0, uv1, uv2, norm0, norm1, norm2);
    const tan1Vec3 = this.__calcTangentPerVertex(pos1, pos2, pos0, uv1, uv2, uv0, norm0, norm1, norm2);
    const tan2Vec3 = this.__calcTangentPerVertex(pos2, pos0, pos1, uv2, uv0, uv1, norm0, norm1, norm2);

    tangentAccessor.setVec3(i, tan0Vec3.x, tan0Vec3.y, tan0Vec3.z, { indicesAccessor });
    tangentAccessor.setVec3(i + 1, tan1Vec3.x, tan1Vec3.y, tan1Vec3.z, { indicesAccessor });
    tangentAccessor.setVec3(i + 2, tan2Vec3.x, tan2Vec3.y, tan2Vec3.z, { indicesAccessor });
  }

  __calcTangentPerVertex(
    pos0Vec3: Vector3,
    pos1Vec3: Vector3,
    pos2Vec3: Vector3,
    uv0Vec2: Vector2,
    uv1Vec2: Vector2,
    uv2Vec2: Vector2,
    norm0Vec3: Vector3,
    norm1Vec3: Vector3,
    norm2Vec3: Vector3
  ) {
    let cp0 = [
      new Vector3(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y)
    ];

    let cp1 = [
      new Vector3(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y)
    ];

    let cp2 = [
      new Vector3(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y)
    ];

    let u = [];
    let v = [];

    for (let i = 0; i < 3; i++) {
      let v1 = Vector3.subtract(cp1[i], cp0[i]);
      let v2 = Vector3.subtract(cp2[i], cp1[i]);
      let abc = Vector3.cross(v1, v2);

      let validate = Math.abs(abc.x) < Number.EPSILON;
      if (validate) {
        console.assert(validate, "Polygons or polygons on UV are degenerate!");
        return new Vector3(0, 0, 0);
      }

      u[i] = -abc.y / abc.x;
      v[i] = -abc.z / abc.x;

    }
    if (u[0] * u[0] + u[1] * u[1] + u[2] * u[2] < Number.EPSILON) {
      const tangent = Vector3.cross(norm0Vec3, new Vector3(pos1Vec3));
      u[0] = tangent.x;
      u[1] = tangent.y;
      u[2] = tangent.z;
    }

    return Vector3.normalize(new Vector3(u[0], u[1], u[2]));
  }

  getPrimitiveAt(i: number) {
    if (this.weights.length > 0) {
      this.__calcMorphPrimitives();
      return this.__morphPrimitives[i];
    } else {
      return this.__primitives[i];
    }
  }

  getPrimitiveNumber() {
    return this.__primitives.length;
  }

  __calcFaceNormals() {
    for (let primitive of this.__primitives) {
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;

      let incrementNum = 3; // PrimitiveMode.Triangles
      if (primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
        primitive.primitiveMode === PrimitiveMode.TriangleFan) {
        incrementNum = 1;
      }

      const vertexNum = primitive.getVertexCountAsIndicesBased();
      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);

      const normalAttributeByteSize = positionAccessor.byteLength;
      const normalBufferView = buffer.takeBufferView({ byteLengthToNeed: normalAttributeByteSize, byteStride: 0, isAoS: false });
      const normalAccessor = normalBufferView.takeAccessor({ compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: positionAccessor.elementCount });
      for (let i = 0; i < vertexNum - 2; i += incrementNum) {
        const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
        const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
        const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });

        this.__calcFaceNormalFor3Vertices(i, pos0, pos1, pos2, normalAccessor, indicesAccessor);
      }
      primitive.setVertexAttribute(normalAccessor, VertexAttribute.FaceNormal);
    }
  }

  makeVerticesSepareted() {
    for (let primitive of this.__primitives) {
      if (primitive.hasIndices()) {
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
        const vertexCount = primitive.getVertexCountAsIndicesBased();

        const indexAccessor = primitive.indicesAccessor;
        for (let i in primitive.attributeAccessors) {
          const attributeAccessor = primitive.attributeAccessors[i];
          const elementSizeInBytes = attributeAccessor.elementSizeInBytes;
          const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
          const newAccessor = bufferView.takeAccessor({ compositionType: attributeAccessor.compositionType, componentType: attributeAccessor.componentType, count: vertexCount });

          for (let j = 0; j < vertexCount; j++) {
            const idx = indexAccessor!.getScalar(j, {});
            newAccessor.setElementFromSameCompositionAccessor(j, attributeAccessor, idx);
          }

          primitive.setVertexAttribute(newAccessor, primitive.attributeSemantics[i]);
        }


        const indicesAccessor = primitive.indicesAccessor!;
        const elementSizeInBytes = indicesAccessor.elementSizeInBytes;
        const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
        const newAccessor = bufferView.takeAccessor({ compositionType: indicesAccessor.compositionType, componentType: indicesAccessor.componentType, count: vertexCount });

        for (let j = 0; j < vertexCount; j++) {
          //const idx = indexAccessor!.getScalar(j, {});
          newAccessor.setScalar(j, j, {});
        }

        primitive.setIndices(newAccessor);
      }
    }
  }

  __calcBaryCentricCoord() {
    for (let primitive of this.__primitives) {
      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;
      const baryCentricCoordAttributeByteSize = positionAccessor.byteLength;
      const baryCentricCoordBufferView = buffer.takeBufferView({ byteLengthToNeed: baryCentricCoordAttributeByteSize, byteStride: 0, isAoS: false });
      const baryCentricCoordAccessor = baryCentricCoordBufferView.takeAccessor({ compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: positionAccessor.elementCount });

      const vertexNum = positionAccessor.elementCount;
      let num = vertexNum;
      if (indicesAccessor) {
        num = indicesAccessor.elementCount;
      }
      for (let ver_i = 0; ver_i < num; ver_i++) {
        let idx = ver_i;
        if (indicesAccessor) {
          idx = indicesAccessor!.getScalar(ver_i, {});
        }
        baryCentricCoordAccessor.setVec3(idx,
          idx % 3 === 0 ? 1 : 0, // 1 0 0  1 0 0  1 0 0,
          idx % 3 === 1 ? 1 : 0, // 0 1 0  0 1 0  0 1 0,
          idx % 3 === 2 ? 1 : 0, // 0 0 1  0 0 1  0 0 1
          {});
      }
      primitive.setVertexAttribute(baryCentricCoordAccessor, VertexAttribute.BaryCentricCoord);
    }
  }

  __initMorphPrimitives() {
    if (this.weights.length === 0) {
      return;
    }

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
    for (let i = 0; i < this.__primitives.length; i++) {
      const primitive = this.__primitives[i];
      if (this.__morphPrimitives[i] == null) {
        const target = primitive.targets[0];
        const map = new Map();
        target.forEach((accessor, semantic) => {
          const bufferView = buffer.takeBufferView({ byteLengthToNeed: accessor.byteLength, byteStride: 0, isAoS: false });
          const morphAccessor = bufferView.takeAccessor({ compositionType: accessor.compositionType, componentType: accessor.componentType, count: accessor.elementCount });
          map.set(semantic, morphAccessor);
        });
        const morphPrimitive = new Primitive();
        morphPrimitive.setData(map, primitive.primitiveMode, primitive.material, primitive.indicesAccessor);
        this.__morphPrimitives[i] = morphPrimitive;
      }
    }
  }

  __calcMorphPrimitives() {
    if (this.weights.length === 0) {
      return;
    }

    this.__initMorphPrimitives();

    for (let i = 0; i < this.__primitives.length; i++) {
      const morphPrimitive = this.__morphPrimitives[i];
      const primitive = this.__primitives[i];
      const target = primitive.targets[0];
      target.forEach((accessor, semantic) => {
        const morphAccessor = morphPrimitive.getAttribute(semantic)!;
        const elementCount = morphAccessor.elementCount;
        for (let j = 0; j < elementCount; j++) {
          morphAccessor.setElementFromSameCompositionAccessor(j, primitive.getAttribute(semantic)!)
        }
      });

      for (let k = 0; k < primitive.targets.length; k++) {
        const target = primitive.targets[k];
        target.forEach((accessor, semantic) => {
          const morphAccessor = morphPrimitive.getAttribute(semantic)!;
          const elementCount = morphAccessor.elementCount;
          for (let j = 0; j < elementCount; j++) {
            morphAccessor.addElementFromSameCompositionAccessor(j, accessor, this.weights[k]);
          }
        });
      }
    }
  }

  get AABB() {
    if (this.__localAABB.isVanilla()) {
      for (let primitive of this.__primitives) {
        this.__localAABB.mergeAABB(primitive.AABB);
      }
    }

    return this.__localAABB;
  }

  get instanceIndex() {
    return this.__instanceIdx;
  }

  isInstanceMesh() {
    if (this.__instanceOf != null) {
      return true;
    } else {
      return false;
    }
  }

  get meshUID() {
    return this.__meshUID;
  }
}
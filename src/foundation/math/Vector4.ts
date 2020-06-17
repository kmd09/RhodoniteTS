import { IVector2, IVector3, IVector4, IVector, IMutableVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { MathUtil } from "./MathUtil";
import { CompositionType } from "../definitions/CompositionType";

export class Vector4_<T extends TypedArrayConstructor> implements IVector, IVector4 {
  v: TypedArray;

  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: { type: T }) {

    if (ArrayBuffer.isView(x)) {
      this.v = (x as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof x === 'number') {
      this.v[0] = x;
      this.v[1] = y;
      this.v[2] = z;
      this.v[3] = w;
    } else {
      if (typeof x.v[2] === 'undefined') {
        // IVector2
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = 0;
        this.v[3] = 1;
      } else if (typeof x.v[3] === 'undefined') {
        // IVector3
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = 1;
      } else {
        // IVector4
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = x.v[3];
      }
    }
  }

  get x(): number {
    return this.v[0];
  }

  get y(): number {
    return this.v[1];
  }

  get z(): number {
    return this.v[2];
  }

  get w(): number {
    return this.v[3];
  }

  get className() {
    return this.constructor.name;
  }

  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(this.x)}, ${MathUtil.convertToStringAsGLSLFloat(this.y)}, ${MathUtil.convertToStringAsGLSLFloat(this.z)}, ${MathUtil.convertToStringAsGLSLFloat(this.w)})`;
  }

  get glslStrAsInt() {
    return `ivec4(${Math.floor(this.x)}, ${Math.floor(this.y)}, ${Math.floor(this.z)}, ${Math.floor(this.w)})`;
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  /**
   * to square length(static version)
   */
  static lengthSquared(vec: IVector4) {
    return vec.lengthSquared();
  }

  static lengthBtw(l_vec: IVector4, r_vec: IVector4) {
    return l_vec.lengthTo(r_vec);
  }

  /**
   * Zero Vector
   */
  static zero() {
    return new (this as any)(0, 0, 0, 1);
  }

  static _one(type: TypedArrayConstructor) {
    return new this(1, 1, 1, 1, { type });
  }

  static _dummy(type: TypedArrayConstructor) {
    return new this(null, 0, 0, 0, { type });
  }

  static normalize(vec4: Vector4) {
    const length = vec4.length();
    let newVec = new (vec4.constructor as any)(vec4.v[0], vec4.v[1], vec4.v[2], vec4.v[3]);
    newVec = Vector4_.divide(newVec, length);

    return newVec;
  }

  /**
   * add value（static version）
   */
  static add(lv: Vector4, rv: Vector4) {
    return new (lv.constructor as any)(lv.v[0] + rv.v[0], lv.v[1] + rv.v[1], lv.v[2] + rv.v[2], lv.v[2] + rv.v[2]);
  }

  /**
   * add value（static version）
   */
  static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] + r_vec.v[0];
    out.v[1] = l_vec.v[1] + r_vec.v[1];
    out.v[2] = l_vec.v[2] + r_vec.v[2];
    out.v[3] = l_vec.v[3] + r_vec.v[3];
    return out;
  }

  static subtract(lv: Vector4, rv: Vector4) {
    return new (lv.constructor as any)(lv.v[0] - rv.v[0], lv.v[1] - rv.v[1], lv.v[2] - rv.v[2], lv.v[3] - rv.v[3]);
  }

  /**
   * subtract(static version)
   */
  static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] - r_vec.v[0];
    out.v[1] = l_vec.v[1] - r_vec.v[1];
    out.v[2] = l_vec.v[2] - r_vec.v[2];
    out.v[3] = l_vec.v[3] - r_vec.v[3];
    return out;
  }

  static multiply(vec4: Vector4, val: number) {
    return new (vec4.constructor as any)(vec4.v[0] * val, vec4.v[1] * val, vec4.v[2] * val, vec4.v[3] * val);
  }

  /**
   * multiplyTo(static version)
   */
  static multiplyTo(vec: IVector4, value: number, out: IMutableVector4) {
    out.v[0] = vec.v[0] * value;
    out.v[1] = vec.v[1] * value;
    out.v[2] = vec.v[2] * value;
    out.v[3] = vec.v[3] * value;
    return out;
  }

  static multiplyVector(vec4: Vector4, vec: Vector4) {
    return new (vec4.constructor as any)(vec4.v[0] * vec.v[0], vec4.v[1] * vec.v[1], vec4.v[2] * vec.v[2], vec4.v[3] * vec.v[3]);
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] * r_vec.v[0];
    out.v[1] = l_vec.v[1] * r_vec.v[1];
    out.v[2] = l_vec.v[2] * r_vec.v[2];
    out.v[3] = l_vec.v[3] * r_vec.v[3];
    return out;
  }

  static divide(vec4: Vector4, val: number) {
    if (val !== 0) {
      return new (vec4.constructor as any)(vec4.v[0] / val, vec4.v[1] / val, vec4.v[2] / val, vec4.v[3] / val);
    } else {
      console.warn("0 division occurred!");
      return new (vec4.constructor as any)(Infinity, Infinity, Infinity, Infinity);
    }
  }

  /**
   * divide by value(static version)
   */
  static divideTo(vec: IVector4, value: number, out: IMutableVector4) {
    if (value !== 0) {
      out.v[0] = vec.v[0] / value;
      out.v[1] = vec.v[1] / value;
      out.v[2] = vec.v[2] / value;
      out.v[3] = vec.v[3] / value;
    } else {
      console.error("0 division occurred!");
      out.v[0] = Infinity;
      out.v[1] = Infinity;
      out.v[2] = Infinity;
      out.v[3] = Infinity;
    }
    return out;
  }

  static divideVector(lvec4: Vector4, rvec4: Vector4) {
    return new (lvec4.constructor as any)(lvec4.v[0] / rvec4.v[0], lvec4.v[1] / rvec4.v[1], lvec4.v[2] / rvec4.v[2], lvec4.v[3] / rvec4.v[3]);
  }

  /**
   * divide by vector(static version)
   */
  static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    if (r_vec.v[0] !== 0 && r_vec.v[1] !== 0 && r_vec.v[2] !== 0 && r_vec.v[3] !== 0) {
      out.v[0] = l_vec.v[0] / r_vec.v[0];
      out.v[1] = l_vec.v[1] / r_vec.v[1];
      out.v[2] = l_vec.v[2] / r_vec.v[2];
      out.v[3] = l_vec.v[3] / r_vec.v[3];
    } else {
      console.error("0 division occurred!");
      out.v[0] = r_vec.v[0] === 0 ? Infinity : l_vec.v[0] / r_vec.v[0];
      out.v[1] = r_vec.v[1] === 0 ? Infinity : l_vec.v[1] / r_vec.v[1];
      out.v[2] = r_vec.v[2] === 0 ? Infinity : l_vec.v[2] / r_vec.v[2];
      out.v[3] = r_vec.v[3] === 0 ? Infinity : l_vec.v[3] / r_vec.v[3];
    }
    return out;
  }

  /**
   * dot product(static version)
   */
  static dot<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>) {
    return lv.v[0] * rv.v[0] + lv.v[1] * rv.v[1] + lv.v[2] * rv.v[2] + lv.v[3] * rv.v[3];
  }

  toString() {
    return '(' + this.v[0] + ', ' + this.v[1] + ', ' + this.v[2] + ', ' + this.v[3] + ')';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + ' ' + MathUtil.nearZeroToZero(this.v[1]) +
      ' ' + MathUtil.nearZeroToZero(this.v[2]) + ' ' + MathUtil.nearZeroToZero(this.v[3]) + '\n';
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2], this.v[3]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: IVector4, delta: number = Number.EPSILON) {
    if (
      Math.abs(vec.v[0] - this.v[0]) < delta &&
      Math.abs(vec.v[1] - this.v[1]) < delta &&
      Math.abs(vec.v[2] - this.v[2]) < delta &&
      Math.abs(vec.v[3] - this.v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: IVector4): boolean {
    if (
      this.v[0] === vec.v[0] &&
      this.v[1] === vec.v[1] &&
      this.v[2] === vec.v[2] &&
      this.v[3] === vec.v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    return this.v[i];
  }

  length() {
    return Math.hypot(this.v[0], this.v[1], this.v[2], this.v[3]);
  }

  lengthSquared(): number {
    return this.v[0] ** 2 + this.v[1] ** 2 + this.v[2] ** 2 + this.v[3] ** 2;
  }

  lengthTo(vec: IVector4) {
    const deltaX = this.v[0] - vec.v[0];
    const deltaY = this.v[1] - vec.v[1];
    const deltaZ = this.v[2] - vec.v[2];
    const deltaW = this.v[3] - vec.v[3];
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  /**
   * dot product
   */
  dot(vec: IVector4) {
    return this.v[0] * vec.v[0] + this.v[1] * vec.v[1] + this.v[2] * vec.v[2] + this.v[3] * vec.v[3];
  }

  clone() {
    return new (this.constructor as any)(this.v[0], this.v[1], this.v[2], this.v[3]);
  }
}

export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float32Array })
  }

  static zero() {
    return new Vector4(0, 0, 0, 0);
  }

  static one() {
    return new Vector4(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4(null, 0, 0, 0);
  }

  clone() {
    return new Vector4(this.v[0], this.v[1], this.v[2], this.v[3]);
  }
}

export class Vector4d extends Vector4_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float64Array })
  }

  static zero() {
    return new Vector4d(0, 0, 0, 0);
  }

  static one() {
    return new Vector4d(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4d(null, 0, 0, 0);
  }

  clone() {
    return new Vector4d(this.v[0], this.v[1], this.v[2], this.v[3]);
  }
}

export type Vector4f = Vector4;

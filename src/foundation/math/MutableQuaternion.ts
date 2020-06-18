import Quaternion from "./Quaternion";
import Matrix44 from "./Matrix44";
import { IVector3, IVector4 } from "./IVector";
import { TypedArray } from "../../commontypes/CommonTypes";
import { IMutableQuaternion, ILogQuaternion, IQuaternion } from "./IQuaternion";
import { IMatrix44 } from "./IMatrix";

export default class MutableQuaternion extends Quaternion implements IMutableQuaternion {

  constructor(x?: number | TypedArray | IVector3 | IVector4 | IQuaternion | ILogQuaternion | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y, z, w);
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get x(): number {
    return this.v[0];
  }

  set y(y: number) {
    this.v[1] = y;
  }

  get y(): number {
    return this.v[1];
  }

  set z(z: number) {
    this.v[2] = z;
  }

  get z(): number {
    return this.v[2];
  }

  set w(w: number) {
    this.v[3] = w;
  }

  get w(): number {
    return this.v[3];
  }

  static identity() {
    return super.identity() as MutableQuaternion;
  }

  static dummy() {
    return new MutableQuaternion(null);
  }

  static fromMatrix(m: Matrix44) {

    let q = new MutableQuaternion(0, 0, 0, 1);
    let tr = m.m00 + m.m11 + m.m22;

    if (tr > 0) {
      let S = 0.5 / Math.sqrt(tr + 1.0);
      q.v[3] = 0.25 / S;
      q.v[0] = (m.m21 - m.m12) * S;
      q.v[1] = (m.m02 - m.m20) * S;
      q.v[2] = (m.m10 - m.m01) * S;
    } else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
      let S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      q.v[3] = (m.m21 - m.m12) / S;
      q.v[0] = 0.25 * S;
      q.v[1] = (m.m01 + m.m10) / S;
      q.v[2] = (m.m02 + m.m20) / S;
    } else if (m.m11 > m.m22) {
      let S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      q.v[3] = (m.m02 - m.m20) / S;
      q.v[0] = (m.m01 + m.m10) / S;
      q.v[1] = 0.25 * S;
      q.v[2] = (m.m12 + m.m21) / S;
    } else {
      let S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      q.v[3] = (m.m10 - m.m01) / S;
      q.v[0] = (m.m02 + m.m20) / S;
      q.v[1] = (m.m12 + m.m21) / S;
      q.v[2] = 0.25 * S;
    }

    return q;
  }

  raw() {
    return this.v;
  }

  setAt(i: number, val: number) {
    this.v[i] = val;
    return this;
  }

  setComponents(x: number, y: number, z: number, w: number) {
    this.v[0] = x;
    this.v[1] = y;
    this.v[2] = z;
    this.v[3] = w;
    return this;
  }

  copyComponents(quat: IQuaternion) {
    return this.setComponents(quat.v[0], quat.v[1], quat.v[2], quat.v[3]);
  }

  identity() {
    return this.setComponents(0, 0, 0, 1);
  }

  normalize() {
    const norm = this.length();
    return this.divideNumber(norm);
  }

  invert() {
    const norm = this.length();
    if (norm === 0.0) {
      return this; // [0, 0, 0, 0]
    }

    this.v[0] = - this.v[0] / norm;
    this.v[1] = - this.v[1] / norm;
    this.v[2] = - this.v[2] / norm;
    this.v[3] = this.v[3] / norm;
    return this;
  }

  qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {

    let qr = l_quat.w * r_quat.w + l_quat.x * r_quat.x + l_quat.y * r_quat.y + l_quat.z * r_quat.z;
    const ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      return this.copyComponents(l_quat);
    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr = - l_quat.w * r_quat.w - l_quat.x * r_quat.x - l_quat.y * r_quat.y - l_quat.z * r_quat.z;
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      const s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      this.v[0] = l_quat.x * s1 + r_quat.x * s2;
      this.v[1] = l_quat.y * s1 + r_quat.y * s2;
      this.v[2] = l_quat.z * s1 + r_quat.z * s2;
      this.v[3] = l_quat.w * s1 + r_quat.w * s2;
    }

    return this;
  }

  lerp(lhq: IQuaternion, rhq: IQuaternion, ratio: number) {
    this.v[0] = lhq.v[0] * (1 - ratio) + rhq.v[0] * ratio;
    this.v[1] = lhq.v[1] * (1 - ratio) + rhq.v[1] * ratio;
    this.v[2] = lhq.v[2] * (1 - ratio) + rhq.v[2] * ratio;
    this.v[3] = lhq.v[3] * (1 - ratio) + rhq.v[3] * ratio;

    return this;
  }

  axisAngle(vec: IVector3, radian: number) {
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    const length = vec.length();
    if (length === 0) {
      console.error("0 division occurred!");
    }

    this.w = Math.cos(halfAngle);
    this.x = sin * vec.v[0] / length;
    this.y = sin * vec.v[1] / length;
    this.z = sin * vec.v[2] / length;

    return this;
  }

  fromMatrix(mat: IMatrix44) {

    const tr = mat.m00 + mat.m11 + mat.m22;

    if (tr > 0) {
      const S = 0.5 / Math.sqrt(tr + 1.0);
      this.v[0] = (mat.m21 - mat.m12) * S;
      this.v[1] = (mat.m02 - mat.m20) * S;
      this.v[2] = (mat.m10 - mat.m01) * S;
      this.v[3] = 0.25 / S;
    } else if ((mat.m00 > mat.m11) && (mat.m00 > mat.m22)) {
      const S = Math.sqrt(1.0 + mat.m00 - mat.m11 - mat.m22) * 2;
      this.v[0] = 0.25 * S;
      this.v[1] = (mat.m01 + mat.m10) / S;
      this.v[2] = (mat.m02 + mat.m20) / S;
      this.v[3] = (mat.m21 - mat.m12) / S;
    } else if (mat.m11 > mat.m22) {
      const S = Math.sqrt(1.0 + mat.m11 - mat.m00 - mat.m22) * 2;
      this.v[0] = (mat.m01 + mat.m10) / S;
      this.v[1] = 0.25 * S;
      this.v[2] = (mat.m12 + mat.m21) / S;
      this.v[3] = (mat.m02 - mat.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + mat.m22 - mat.m00 - mat.m11) * 2;
      this.v[0] = (mat.m02 + mat.m20) / S;
      this.v[1] = (mat.m12 + mat.m21) / S;
      this.v[2] = 0.25 * S;
      this.v[3] = (mat.m10 - mat.m01) / S;
    }

    return this;
  }

  fromPosition(vec: IVector3) {
    return this.setComponents(vec.v[0], vec.v[1], vec.v[2], 0);
  }

  add(quat: IQuaternion) {
    this.x += quat.x;
    this.y += quat.y;
    this.z += quat.z;
    this.w += quat.w;
    return this;
  }

  subtract(quat: IQuaternion) {
    this.x -= quat.x;
    this.y -= quat.y;
    this.z -= quat.z;
    this.w -= quat.w;
    return this;
  }

  multiply(quat: IQuaternion) {
    const x = quat.w * this.x + quat.z * this.y + quat.y * this.z - quat.x * this.w;
    const y = - quat.z * this.x + quat.w * this.y + quat.x * this.z - quat.y * this.w;
    const z = quat.y * this.x + quat.x * this.y + quat.w * this.z - quat.z * this.w;
    const w = - quat.x * this.x - quat.y * this.y - quat.z * this.z - quat.w * this.w;
    return this.setComponents(x, y, z, w);
  }

  multiplyNumber(val: number) {
    this.v[0] *= val;
    this.v[1] *= val;
    this.v[2] *= val;
    this.v[3] *= val;
    return this;
  }

  divideNumber(val: number) {
    if (val !== 0) {
      this.v[0] /= val;
      this.v[1] /= val;
      this.v[2] /= val;
      this.v[3] /= val;
    } else {
      console.error("0 division occurred!");
      this.v[0] = Infinity;
      this.v[1] = Infinity;
      this.v[2] = Infinity;
      this.v[3] = Infinity;
    }
    return this;
  }

  clone(): MutableQuaternion {
    return super.clone() as MutableQuaternion;
  }
}

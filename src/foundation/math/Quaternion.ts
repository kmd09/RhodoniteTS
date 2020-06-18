import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import { CompositionType } from '../definitions/CompositionType';
import MutableQuaternion from './MutableQuaternion';
import LogQuaternion from './LogQuaternion';
import { TypedArray } from '../../commontypes/CommonTypes';
import { IQuaternion, ILogQuaternion, IMutableQuaternion } from './IQuaternion';
import { IVector3, IVector4, IVector2 } from './IVector';
import { MathUtil } from './MathUtil';
import { IMutableVector3 } from './IVector';

export default class Quaternion implements IQuaternion {
  v: TypedArray;

  constructor(x?: number | TypedArray | IVector2 | IVector3 | IVector4 | IQuaternion | ILogQuaternion | Array<number> | null, y?: number, z?: number, w?: number) {
    if (ArrayBuffer.isView(x)) {
      this.v = (x as TypedArray);
      return;
    } else if (x == null) {
      this.v = new Float32Array(0);
      return;
    } else {
      this.v = new Float32Array(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof x === 'number') {
      this.v[0] = x;
      this.v[1] = y as number;
      this.v[2] = z as number;
      this.v[3] = w as number;
    } else if (x instanceof LogQuaternion) {
      const theta = x.x * x.x + x.y * x.y + x.z * x.z;
      const sin = Math.sin(theta);
      this.v[0] = x.x * (sin / theta);
      this.v[1] = x.y * (sin / theta);
      this.v[2] = x.z * (sin / theta);
      this.v[3] = Math.cos(theta);
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
        // IVector4 and IQuaternion
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

  static get compositionType() {
    return CompositionType.Vec4;
  }

  static identity() {
    return new this(0, 0, 0, 1);
  }

  static dummy() {
    return new Quaternion(null);
  }

  static invert(quat: Quaternion) {
    quat = new Quaternion(-quat.x, -quat.y, -quat.z, quat.w);
    const norm = quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w;
    const inorm2 = norm ? 1.0 / norm : 0;
    quat.v[0] *= inorm2;
    quat.v[1] *= inorm2;
    quat.v[2] *= inorm2;
    quat.v[3] *= inorm2;
    return quat;
  }

  static qlerp(lhq: Quaternion, rhq: Quaternion, ratio: number) {

    let q = new Quaternion(0, 0, 0, 1);
    let qr = lhq.w * rhq.w + lhq.x * rhq.x + lhq.y * rhq.y + lhq.z * rhq.z;
    let ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      q.v[3] = lhq.w;
      q.v[0] = lhq.x;
      q.v[1] = lhq.y;
      q.v[2] = lhq.z;

      return q;
    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr = - lhq.w * rhq.w - lhq.x * rhq.x - lhq.y * rhq.y - lhq.z * rhq.z;
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      let s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      q.v[0] = lhq.x * s1 + rhq.x * s2;
      q.v[1] = lhq.y * s1 + rhq.y * s2;
      q.v[2] = lhq.z * s1 + rhq.z * s2;
      q.v[3] = lhq.w * s1 + rhq.w * s2;

      return q;
    }
  }

  static qlerpTo(lhq: Quaternion, rhq: Quaternion, ratio: number, outQ: MutableQuaternion) {

    //    let q = new Quaternion(0, 0, 0, 1);
    let qr = lhq.w * rhq.w + lhq.x * rhq.x + lhq.y * rhq.y + lhq.z * rhq.z;
    let ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      outQ.v[3] = lhq.w;
      outQ.v[0] = lhq.x;
      outQ.v[1] = lhq.y;
      outQ.v[2] = lhq.z;

    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr = - lhq.w * rhq.w - lhq.x * rhq.x - lhq.y * rhq.y - lhq.z * rhq.z;
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      let s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      outQ.v[0] = lhq.x * s1 + rhq.x * s2;
      outQ.v[1] = lhq.y * s1 + rhq.y * s2;
      outQ.v[2] = lhq.z * s1 + rhq.z * s2;
      outQ.v[3] = lhq.w * s1 + rhq.w * s2;

    }
  }

  static lerpTo(lhq: Quaternion, rhq: Quaternion, ratio: number, outQ: MutableQuaternion) {
    outQ.x = lhq.x * (1 - ratio) + rhq.x * ratio;
    outQ.y = lhq.y * (1 - ratio) + rhq.y * ratio;
    outQ.z = lhq.z * (1 - ratio) + rhq.z * ratio;
    outQ.w = lhq.w * (1 - ratio) + rhq.w * ratio;
  }

  static axisAngle(axisVec3: Vector3, radian: number) {
    let halfAngle = 0.5 * radian;
    let sin = Math.sin(halfAngle);

    let axis = Vector3.normalize(axisVec3);
    return new Quaternion(
      sin * axis.x,
      sin * axis.y,
      sin * axis.z,
      Math.cos(halfAngle));
  }

  static fromMatrix(m: Matrix44) {

    let q = new Quaternion(0, 0, 0, 1);
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

  static lookFromTo(fromDirection: Vector3, toDirection: Vector3) {

    if (fromDirection.isEqual(toDirection)) {
      return new Quaternion(0, 0, 0, 1);
    }
    return this.qlerp(this.lookForward(fromDirection), this.lookForward(toDirection), 1);
  }

  static lookForward(forward: Vector3) {
    const up = new Vector3(0, 1, 0);
    return this.lookForwardAccordingToThisUp(forward, up);
  }

  static lookForwardAccordingToThisUp(forward: Vector3, up: Vector3) {
    forward = Vector3.normalize(forward);
    const right = Vector3.normalize(Vector3.cross(up, forward));
    up = Vector3.cross(forward, right);

    const m00 = right.x;
    const m01 = right.y;
    const m02 = right.z;
    const m10 = up.x;
    const m11 = up.y;
    const m12 = up.z;
    const m20 = forward.x;
    const m21 = forward.y;
    const m22 = forward.z;

    const num8 = (m00 + m11) + m22;
    if (num8 > 0) {
      let num = Math.sqrt(num8 + 1);
      let num2 = 0.5 / num;
      return new Quaternion(
        (m12 - m21) * num2,
        (m20 - m02) * num2,
        (m01 - m10) * num2,
        num * 0.5);
    } else if ((m00 >= m11) && (m00 >= m22)) {
      let num7 = Math.sqrt(((1 + m00) - m11) - m22);
      let num4 = 0.5 / num7;
      return new Quaternion(
        0.5 * num7,
        (m01 + m10) * num4,
        (m02 + m20) * num4,
        (m12 - m21) * num4);
    } else if (m11 > m22) {
      let num6 = Math.sqrt(((1 + m11) - m00) - m22);
      let num3 = 0.5 / num6;
      return new Quaternion(
        (m10 + m01) * num3,
        0.5 * num6,
        (m21 + m12) * num3,
        (m20 - m02) * num3);
    } else {
      let num5 = Math.sqrt(((1 + m22) - m00) - m11);
      let num2 = 0.5 / num5;
      return new Quaternion(
        (m20 + m02) * num2,
        (m21 + m12) * num2,
        0.5 * num5,
        (m01 - m10) * num2);
    }
  }

  static fromPosition(vec3: Vector3) {
    let q = new Quaternion(vec3.x, vec3.y, vec3.z, 0);
    return q;
  }

  static add(lhs: Quaternion, rhs: Quaternion) {
    return new Quaternion(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z, lhs.w + rhs.w)
  }

  static subtract(lhs: Quaternion, rhs: Quaternion) {
    return new Quaternion(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z, lhs.w - rhs.w)
  }

  static multiply(q1: Quaternion, q2: Quaternion) {
    let result = new Quaternion(0, 0, 0, 1);
    result.v[0] = q2.w * q1.x + q2.z * q1.y - q2.y * q1.z + q2.x * q1.w;
    result.v[1] = - q2.z * q1.x + q2.w * q1.y + q2.x * q1.z + q2.y * q1.w;
    result.v[2] = q2.y * q1.x - q2.x * q1.y + q2.w * q1.z + q2.z * q1.w;
    result.v[3] = - q2.x * q1.x - q2.y * q1.y - q2.z * q1.z + q2.w * q1.w;
    return result;
  }

  static multiplyTo(quat1: IQuaternion, quat2: IQuaternion, out: IMutableQuaternion) {
    const x = quat2.w * quat1.x + quat2.z * quat1.y - quat2.y * quat1.z + quat2.x * quat1.w;
    const y = - quat2.z * quat1.x + quat2.w * quat1.y + quat2.x * quat1.z + quat2.y * quat1.w;
    const z = quat2.y * quat1.x - quat2.x * quat1.y + quat2.w * quat1.z + quat2.z * quat1.w;
    const w = - quat2.x * quat1.x - quat2.y * quat1.y - quat2.z * quat1.z + quat2.w * quat1.w;
    return out.setComponents(x, y, z, w);
  }

  static multiplyNumber(q1: Quaternion, val: number) {
    return new Quaternion(q1.x * val, q1.y * val, q1.z * val, q1.w * val);
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
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

  isEqual(quat: Quaternion) {
    if (this.x === quat.x && this.y === quat.y && this.z === quat.z && this.w === quat.w) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(quat: IQuaternion): boolean {
    if (
      this.v[0] === quat.v[0] &&
      this.v[1] === quat.v[1] &&
      this.v[2] === quat.v[2] &&
      this.v[3] === quat.v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    switch (i % 4) {
      case 0: return this.x;
      case 1: return this.y;
      case 2: return this.z;
      case 3: return this.w;
      default: return void 0;
    }
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  lengthSquared(): number {
    return this.v[0] ** 2 + this.v[1] ** 2 + this.v[2] ** 2 + this.v[3] ** 2;
  }

  /**
   * dot product
   */
  dot(quat: IQuaternion) {
    return this.v[0] * quat.v[0] + this.v[1] * quat.v[1] + this.v[2] * quat.v[2] + this.v[3] * quat.v[3];
  }

  multiplyVector3(point: Vector3) {
    const num = this.x * 2;
    const num2 = this.y * 2;
    const num3 = this.z * 2;
    const num4 = this.x * num;
    const num5 = this.y * num2;
    const num6 = this.z * num3;
    const num7 = this.x * num2;
    const num8 = this.x * num3;
    const num9 = this.y * num3;
    const num10 = this.w * num;
    const num11 = this.w * num2;
    const num12 = this.w * num3;
    const result = new Vector3(
      (1 - (num5 + num6)) * point.x + (num7 - num12) * point.y + (num8 + num11) * point.z,
      (num7 + num12) * point.x + (1 - (num4 + num6)) * point.y + (num9 - num10) * point.z,
      (num8 - num11) * point.x + (num9 + num10) * point.y + (1 - (num4 + num5)) * point.z);

    return result;
  }

  toEulerAnglesTo(out: IMutableVector3) {
    // this is from https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Source_Code_2
    const sinr_cosp = 2.0 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1.0 - 2.0 * (this.x * this.x + this.y * this.y);
    out.v[0] = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2.0 * (this.w * this.y - this.z * this.x);
    if (Math.abs(sinp) >= 1) {
      out.v[1] = Math.PI / 2 * Math.sign(sinp); // use 90 degrees if out of range
    } else {
      out.v[1] = Math.asin(sinp);
    }

    const siny_cosp = 2.0 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1.0 - 2.0 * (this.y * this.y + this.z * this.z);
    out.v[2] = Math.atan2(siny_cosp, cosy_cosp);

    return out;
  }

  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }
}


import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector4 from './Vector4';
import { IMatrix, IMatrix44 } from './IMatrix';
import { CompositionType } from '../definitions/CompositionType';
import MutableVector3 from './MutableVector3';
import MutableMatrix44 from './MutableMatrix44';
import MutableVector4 from './MutableVector4';
import { TypedArray } from '../../commontypes/CommonTypes';
import { IVector3 } from './IVector';
import { MathUtil } from './MathUtil';

const FloatArray = Float32Array;
type FloatArray = Float32Array;

export default class Matrix44 implements IMatrix, IMatrix44 {
  v: TypedArray;

  constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: null);
  constructor(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
    isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(
    m0: any, m1?: any, m2?: any, m3?: any,
    m4?: number, m5?: number, m6?: number, m7?: number,
    m8?: number, m9?: number, m10?: number, m11?: number,
    m12?: number, m13?: number, m14?: number, m15?: number,
    isColumnMajor: boolean = false, notCopyFloatArray: boolean = false) {

    const _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
    const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;

    const m = m0;

    if (m == null) {
      this.v = new FloatArray(0);
      return;
    }

    if (arguments.length >= 16 && arguments[3] != null) {
      this.v = new FloatArray(16); // Data order is column major
      let m = arguments;
      if (_isColumnMajor === true) {
        this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
        this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
        this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
        this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
      } else {
        // arguments[0-15] must be row major values if isColumnMajor is false
        this.v[0] = m[0]; this.v[4] = m[1]; this.v[8] = m[2]; this.v[12] = m[3];
        this.v[1] = m[4]; this.v[5] = m[5]; this.v[9] = m[6]; this.v[13] = m[7];
        this.v[2] = m[8]; this.v[6] = m[9]; this.v[10] = m[10]; this.v[14] = m[11];
        this.v[3] = m[12]; this.v[7] = m[13]; this.v[11] = m[14]; this.v[15] = m[15];
      }
    } else if (Array.isArray(m as Array<number>)) {
      this.v = new FloatArray(16);
      if (_isColumnMajor === true) {
        this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
        this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
        this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
        this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
      } else {
        // 'm' must be row major values if isColumnMajor is false
        this.v[0] = m[0]; this.v[4] = m[1]; this.v[8] = m[2]; this.v[12] = m[3];
        this.v[1] = m[4]; this.v[5] = m[5]; this.v[9] = m[6]; this.v[13] = m[7];
        this.v[2] = m[8]; this.v[6] = m[9]; this.v[10] = m[10]; this.v[14] = m[11];
        this.v[3] = m[12]; this.v[7] = m[13]; this.v[11] = m[14]; this.v[15] = m[15];
      }
    } else if (m instanceof FloatArray) {
      if (_notCopyFloatArray) {
        this.v = m;
      } else {
        this.v = new FloatArray(16);
        if (_isColumnMajor === true) {
          this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
          this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
          this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
          this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
        } else {
          // 'm' must be row major values if isColumnMajor is false
          this.v[0] = m[0]; this.v[4] = m[1]; this.v[8] = m[2]; this.v[12] = m[3];
          this.v[1] = m[4]; this.v[5] = m[5]; this.v[9] = m[6]; this.v[13] = m[7];
          this.v[2] = m[8]; this.v[6] = m[9]; this.v[10] = m[10]; this.v[14] = m[11];
          this.v[3] = m[12]; this.v[7] = m[13]; this.v[11] = m[14]; this.v[15] = m[15];
        }
      }
    } else if (!!m && typeof m.v[15] !== 'undefined' && typeof m.v[10] !== 'undefined') {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new FloatArray(16);
        const v: FloatArray = (m as any).v;
        this.v[0] = v[0]; this.v[4] = v[4]; this.v[8] = v[8]; this.v[12] = v[12];
        this.v[1] = v[1]; this.v[5] = v[5]; this.v[9] = v[9]; this.v[13] = v[13];
        this.v[2] = v[2]; this.v[6] = v[6]; this.v[10] = v[10]; this.v[14] = v[14];
        this.v[3] = v[3]; this.v[7] = v[7]; this.v[11] = v[11]; this.v[15] = v[15];
      }
    } else if (!!m && typeof m.v[15] === 'undefined' && typeof m.v[10] !== 'undefined') {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new FloatArray(16);
        const v: FloatArray = (m as any).v;
        this.v[0] = v[0]; this.v[4] = v[3]; this.v[8] = v[6]; this.v[12] = 0;
        this.v[1] = v[1]; this.v[5] = v[4]; this.v[9] = v[7]; this.v[13] = 0;
        this.v[2] = v[2]; this.v[6] = v[5]; this.v[10] = v[8]; this.v[14] = 0;
        this.v[3] = 0; this.v[7] = 0; this.v[11] = 0; this.v[15] = 1;
      }
    } else if (!!m && typeof m.className !== 'undefined' && m instanceof Quaternion) {
      this.v = new FloatArray(16);

      const sx = m.v[0] * m.v[0];
      const sy = m.v[1] * m.v[1];
      const sz = m.v[2] * m.v[2];
      const cx = m.v[1] * m.v[2];
      const cy = m.v[0] * m.v[2];
      const cz = m.v[0] * m.v[1];
      const wx = m.v[3] * m.v[0];
      const wy = m.v[3] * m.v[1];
      const wz = m.v[3] * m.v[2];

      this.v[0] = 1.0 - 2.0 * (sy + sz); this.v[4] = 2.0 * (cz - wz); this.v[8] = 2.0 * (cy + wy); this.v[12] = 0;
      this.v[1] = 2.0 * (cz + wz); this.v[5] = 1.0 - 2.0 * (sx + sz); this.v[9] = 2.0 * (cx - wx); this.v[13] = 0;
      this.v[2] = 2.0 * (cy - wy); this.v[6] = 2.0 * (cx + wx); this.v[10] = 1.0 - 2.0 * (sx + sy); this.v[14] = 0;
      this.v[3] = 0; this.v[7] = 0; this.v[11] = 0; this.v[15] = 1;

    } else {
      this.v = new FloatArray(16);
      this.v[0] = 1; this.v[4] = 0; this.v[8] = 0; this.v[12] = 0;
      this.v[1] = 0; this.v[5] = 1; this.v[9] = 0; this.v[13] = 0;
      this.v[2] = 0; this.v[6] = 0; this.v[10] = 1; this.v[14] = 0;
      this.v[3] = 0; this.v[7] = 0; this.v[11] = 0; this.v[15] = 1;
    }
  }

  public get m00() {
    return this.v[0];
  }

  public get m10() {
    return this.v[1];
  }

  public get m20() {
    return this.v[2];
  }

  public get m30() {
    return this.v[3];
  }

  public get m01() {
    return this.v[4];
  }

  public get m11() {
    return this.v[5];
  }

  public get m21() {
    return this.v[6];
  }

  public get m31() {
    return this.v[7];
  }

  public get m02() {
    return this.v[8];
  }

  public get m12() {
    return this.v[9];
  }

  public get m22() {
    return this.v[10];
  }

  public get m32() {
    return this.v[11];
  }

  public get m03() {
    return this.v[12];
  }

  public get m13() {
    return this.v[13];
  }

  public get m23() {
    return this.v[14];
  }

  public get m33() {
    return this.v[15];
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return new this(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new this(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  static dummy() {
    return new this(null);
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix44) {
    return new this(
      mat.v[0], mat.v[1], mat.v[2], mat.v[3],
      mat.v[4], mat.v[5], mat.v[6], mat.v[7],
      mat.v[8], mat.v[9], mat.v[10], mat.v[11],
      mat.v[12], mat.v[13], mat.v[14], mat.v[15]
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix44) {
    const n00 = mat.v[0] * mat.v[5] - mat.v[4] * mat.v[1];
    const n01 = mat.v[0] * mat.v[9] - mat.v[8] * mat.v[1];
    const n02 = mat.v[0] * mat.v[13] - mat.v[12] * mat.v[1];
    const n03 = mat.v[4] * mat.v[9] - mat.v[8] * mat.v[5];
    const n04 = mat.v[4] * mat.v[13] - mat.v[12] * mat.v[5];
    const n05 = mat.v[8] * mat.v[13] - mat.v[12] * mat.v[9];
    const n06 = mat.v[2] * mat.v[7] - mat.v[6] * mat.v[3];
    const n07 = mat.v[2] * mat.v[11] - mat.v[10] * mat.v[3];
    const n08 = mat.v[2] * mat.v[15] - mat.v[14] * mat.v[3];
    const n09 = mat.v[6] * mat.v[11] - mat.v[10] * mat.v[7];
    const n10 = mat.v[6] * mat.v[15] - mat.v[14] * mat.v[7];
    const n11 = mat.v[10] * mat.v[15] - mat.v[14] * mat.v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      console.error("the determinant is 0!");
    }

    const m00 = (mat.v[5] * n11 - mat.v[9] * n10 + mat.v[13] * n09) / det;
    const m01 = (mat.v[8] * n10 - mat.v[4] * n11 - mat.v[12] * n09) / det;
    const m02 = (mat.v[7] * n05 - mat.v[11] * n04 + mat.v[15] * n03) / det;
    const m03 = (mat.v[10] * n04 - mat.v[6] * n05 - mat.v[14] * n03) / det;
    const m10 = (mat.v[9] * n08 - mat.v[1] * n11 - mat.v[13] * n07) / det;
    const m11 = (mat.v[0] * n11 - mat.v[8] * n08 + mat.v[12] * n07) / det;
    const m12 = (mat.v[11] * n02 - mat.v[3] * n05 - mat.v[15] * n01) / det;
    const m13 = (mat.v[2] * n05 - mat.v[10] * n02 + mat.v[14] * n01) / det;
    const m20 = (mat.v[1] * n10 - mat.v[5] * n08 + mat.v[13] * n06) / det;
    const m21 = (mat.v[4] * n08 - mat.v[0] * n10 - mat.v[12] * n06) / det;
    const m22 = (mat.v[3] * n04 - mat.v[7] * n02 + mat.v[15] * n00) / det;
    const m23 = (mat.v[6] * n02 - mat.v[2] * n04 - mat.v[14] * n00) / det;
    const m30 = (mat.v[5] * n07 - mat.v[1] * n09 - mat.v[9] * n06) / det;
    const m31 = (mat.v[0] * n09 - mat.v[4] * n07 + mat.v[8] * n06) / det;
    const m32 = (mat.v[7] * n01 - mat.v[3] * n03 - mat.v[11] * n00) / det;
    const m33 = (mat.v[2] * n03 - mat.v[6] * n01 + mat.v[10] * n00) / det;

    return new this(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static invertTo(mat: Matrix44, outMat: MutableMatrix44) {
    const n00 = mat.v[0] * mat.v[5] - mat.v[4] * mat.v[1];
    const n01 = mat.v[0] * mat.v[9] - mat.v[8] * mat.v[1];
    const n02 = mat.v[0] * mat.v[13] - mat.v[12] * mat.v[1];
    const n03 = mat.v[4] * mat.v[9] - mat.v[8] * mat.v[5];
    const n04 = mat.v[4] * mat.v[13] - mat.v[12] * mat.v[5];
    const n05 = mat.v[8] * mat.v[13] - mat.v[12] * mat.v[9];
    const n06 = mat.v[2] * mat.v[7] - mat.v[6] * mat.v[3];
    const n07 = mat.v[2] * mat.v[11] - mat.v[10] * mat.v[3];
    const n08 = mat.v[2] * mat.v[15] - mat.v[14] * mat.v[3];
    const n09 = mat.v[6] * mat.v[11] - mat.v[10] * mat.v[7];
    const n10 = mat.v[6] * mat.v[15] - mat.v[14] * mat.v[7];
    const n11 = mat.v[10] * mat.v[15] - mat.v[14] * mat.v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      console.error("the determinant is 0!");
    }

    const m00 = (mat.v[5] * n11 - mat.v[9] * n10 + mat.v[13] * n09) / det;
    const m01 = (mat.v[8] * n10 - mat.v[4] * n11 - mat.v[12] * n09) / det;
    const m02 = (mat.v[7] * n05 - mat.v[11] * n04 + mat.v[15] * n03) / det;
    const m03 = (mat.v[10] * n04 - mat.v[6] * n05 - mat.v[14] * n03) / det;
    const m10 = (mat.v[9] * n08 - mat.v[1] * n11 - mat.v[13] * n07) / det;
    const m11 = (mat.v[0] * n11 - mat.v[8] * n08 + mat.v[12] * n07) / det;
    const m12 = (mat.v[11] * n02 - mat.v[3] * n05 - mat.v[15] * n01) / det;
    const m13 = (mat.v[2] * n05 - mat.v[10] * n02 + mat.v[14] * n01) / det;
    const m20 = (mat.v[1] * n10 - mat.v[5] * n08 + mat.v[13] * n06) / det;
    const m21 = (mat.v[4] * n08 - mat.v[0] * n10 - mat.v[12] * n06) / det;
    const m22 = (mat.v[3] * n04 - mat.v[7] * n02 + mat.v[15] * n00) / det;
    const m23 = (mat.v[6] * n02 - mat.v[2] * n04 - mat.v[14] * n00) / det;
    const m30 = (mat.v[5] * n07 - mat.v[1] * n09 - mat.v[9] * n06) / det;
    const m31 = (mat.v[0] * n09 - mat.v[4] * n07 + mat.v[8] * n06) / det;
    const m32 = (mat.v[7] * n01 - mat.v[3] * n03 - mat.v[11] * n00) / det;
    const m33 = (mat.v[2] * n03 - mat.v[6] * n01 + mat.v[10] * n00) / det;

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  /**
   * Create translation Matrix
   */
  static translate(vec: Vector3) {
    return new this(
      1, 0, 0, vec.v[0],
      0, 1, 0, vec.v[1],
      0, 0, 1, vec.v[2],
      0, 0, 0, 1
    );
  }

  /**
   * Create X oriented Rotation Matrix
   */
  static rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    );
  }


  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  static rotateXYZ(x: number, y: number, z: number) {
    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const cosZ = Math.cos(z);
    const sinZ = Math.sin(z);

    // const x00 = 1;
    // const x01 = 0;
    // const x02 = 0;
    // const x10 = 0;
    const x11 = cosX;
    const x12 = -sinX;
    // const x20 = 0;
    const x21 = sinX;
    const x22 = cosX;

    const y00 = cosY;
    // const y01 = 0;
    const y02 = sinY;
    // const y10 = 0;
    // const y11 = 1;
    // const y12 = 0;
    const y20 = -sinY;
    // const y21 = 0;
    const y22 = cosY;

    const z00 = cosZ;
    const z01 = -sinZ;
    // const z02 = 0;
    const z10 = sinZ;
    const z11 = cosZ;
    // const z12 = 0;
    // const z20 = 0;
    // const z21 = 0;
    // const z22 = 1;

    // Y * X
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    //const yx10 = 0;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;

    // Z * Y * X
    const m00 = z00 * yx00;
    const m01 = z00 * yx01 + z01 * yx11;
    const m02 = z00 * yx02 + z01 * yx12;
    const m10 = z10 * yx00;
    const m11 = z10 * yx01 + z11 * yx11;
    const m12 = z10 * yx02 + z11 * yx12;
    const m20 = yx20;
    const m21 = yx21;
    const m22 = yx22;

    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return new this(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static rotate(vec: Vector3) {
    return this.rotateXYZ(vec.v[0], vec.v[1], vec.v[2]);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return new this(
      vec.v[0], 0, 0, 0,
      0, vec.v[1], 0, 0,
      0, 0, vec.v[2], 0,
      0, 0, 0, 1
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix44, r_mat: Matrix44) {
    const m00 = l_mat.v[0] * r_mat.v[0] + l_mat.v[4] * r_mat.v[1] + l_mat.v[8] * r_mat.v[2] + l_mat.v[12] * r_mat.v[3];
    const m10 = l_mat.v[1] * r_mat.v[0] + l_mat.v[5] * r_mat.v[1] + l_mat.v[9] * r_mat.v[2] + l_mat.v[13] * r_mat.v[3];
    const m20 = l_mat.v[2] * r_mat.v[0] + l_mat.v[6] * r_mat.v[1] + l_mat.v[10] * r_mat.v[2] + l_mat.v[14] * r_mat.v[3];
    const m30 = l_mat.v[3] * r_mat.v[0] + l_mat.v[7] * r_mat.v[1] + l_mat.v[11] * r_mat.v[2] + l_mat.v[15] * r_mat.v[3];

    const m01 = l_mat.v[0] * r_mat.v[4] + l_mat.v[4] * r_mat.v[5] + l_mat.v[8] * r_mat.v[6] + l_mat.v[12] * r_mat.v[7];
    const m11 = l_mat.v[1] * r_mat.v[4] + l_mat.v[5] * r_mat.v[5] + l_mat.v[9] * r_mat.v[6] + l_mat.v[13] * r_mat.v[7];
    const m21 = l_mat.v[2] * r_mat.v[4] + l_mat.v[6] * r_mat.v[5] + l_mat.v[10] * r_mat.v[6] + l_mat.v[14] * r_mat.v[7];
    const m31 = l_mat.v[3] * r_mat.v[4] + l_mat.v[7] * r_mat.v[5] + l_mat.v[11] * r_mat.v[6] + l_mat.v[15] * r_mat.v[7];

    const m02 = l_mat.v[0] * r_mat.v[8] + l_mat.v[4] * r_mat.v[9] + l_mat.v[8] * r_mat.v[10] + l_mat.v[12] * r_mat.v[11];
    const m12 = l_mat.v[1] * r_mat.v[8] + l_mat.v[5] * r_mat.v[9] + l_mat.v[9] * r_mat.v[10] + l_mat.v[13] * r_mat.v[11];
    const m22 = l_mat.v[2] * r_mat.v[8] + l_mat.v[6] * r_mat.v[9] + l_mat.v[10] * r_mat.v[10] + l_mat.v[14] * r_mat.v[11];
    const m32 = l_mat.v[3] * r_mat.v[8] + l_mat.v[7] * r_mat.v[9] + l_mat.v[11] * r_mat.v[10] + l_mat.v[15] * r_mat.v[11];

    const m03 = l_mat.v[0] * r_mat.v[12] + l_mat.v[4] * r_mat.v[13] + l_mat.v[8] * r_mat.v[14] + l_mat.v[12] * r_mat.v[15];
    const m13 = l_mat.v[1] * r_mat.v[12] + l_mat.v[5] * r_mat.v[13] + l_mat.v[9] * r_mat.v[14] + l_mat.v[13] * r_mat.v[15];
    const m23 = l_mat.v[2] * r_mat.v[12] + l_mat.v[6] * r_mat.v[13] + l_mat.v[10] * r_mat.v[14] + l_mat.v[14] * r_mat.v[15];
    const m33 = l_mat.v[3] * r_mat.v[12] + l_mat.v[7] * r_mat.v[13] + l_mat.v[11] * r_mat.v[14] + l_mat.v[15] * r_mat.v[15];

    return new this(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_mat: Matrix44, r_mat: Matrix44, outMat: MutableMatrix44) {
    const m00 = l_mat.v[0] * r_mat.v[0] + l_mat.v[4] * r_mat.v[1] + l_mat.v[8] * r_mat.v[2] + l_mat.v[12] * r_mat.v[3];
    const m10 = l_mat.v[1] * r_mat.v[0] + l_mat.v[5] * r_mat.v[1] + l_mat.v[9] * r_mat.v[2] + l_mat.v[13] * r_mat.v[3];
    const m20 = l_mat.v[2] * r_mat.v[0] + l_mat.v[6] * r_mat.v[1] + l_mat.v[10] * r_mat.v[2] + l_mat.v[14] * r_mat.v[3];
    const m30 = l_mat.v[3] * r_mat.v[0] + l_mat.v[7] * r_mat.v[1] + l_mat.v[11] * r_mat.v[2] + l_mat.v[15] * r_mat.v[3];

    const m01 = l_mat.v[0] * r_mat.v[4] + l_mat.v[4] * r_mat.v[5] + l_mat.v[8] * r_mat.v[6] + l_mat.v[12] * r_mat.v[7];
    const m11 = l_mat.v[1] * r_mat.v[4] + l_mat.v[5] * r_mat.v[5] + l_mat.v[9] * r_mat.v[6] + l_mat.v[13] * r_mat.v[7];
    const m21 = l_mat.v[2] * r_mat.v[4] + l_mat.v[6] * r_mat.v[5] + l_mat.v[10] * r_mat.v[6] + l_mat.v[14] * r_mat.v[7];
    const m31 = l_mat.v[3] * r_mat.v[4] + l_mat.v[7] * r_mat.v[5] + l_mat.v[11] * r_mat.v[6] + l_mat.v[15] * r_mat.v[7];

    const m02 = l_mat.v[0] * r_mat.v[8] + l_mat.v[4] * r_mat.v[9] + l_mat.v[8] * r_mat.v[10] + l_mat.v[12] * r_mat.v[11];
    const m12 = l_mat.v[1] * r_mat.v[8] + l_mat.v[5] * r_mat.v[9] + l_mat.v[9] * r_mat.v[10] + l_mat.v[13] * r_mat.v[11];
    const m22 = l_mat.v[2] * r_mat.v[8] + l_mat.v[6] * r_mat.v[9] + l_mat.v[10] * r_mat.v[10] + l_mat.v[14] * r_mat.v[11];
    const m32 = l_mat.v[3] * r_mat.v[8] + l_mat.v[7] * r_mat.v[9] + l_mat.v[11] * r_mat.v[10] + l_mat.v[15] * r_mat.v[11];

    const m03 = l_mat.v[0] * r_mat.v[12] + l_mat.v[4] * r_mat.v[13] + l_mat.v[8] * r_mat.v[14] + l_mat.v[12] * r_mat.v[15];
    const m13 = l_mat.v[1] * r_mat.v[12] + l_mat.v[5] * r_mat.v[13] + l_mat.v[9] * r_mat.v[14] + l_mat.v[13] * r_mat.v[15];
    const m23 = l_mat.v[2] * r_mat.v[12] + l_mat.v[6] * r_mat.v[13] + l_mat.v[10] * r_mat.v[14] + l_mat.v[14] * r_mat.v[15];
    const m33 = l_mat.v[3] * r_mat.v[12] + l_mat.v[7] * r_mat.v[13] + l_mat.v[11] * r_mat.v[14] + l_mat.v[15] * r_mat.v[15];

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static fromQuaternionTo(quat: Quaternion, outMat: MutableMatrix44) {
    const sx = quat.v[0] * quat.v[0];
    const sy = quat.v[1] * quat.v[1];
    const sz = quat.v[2] * quat.v[2];
    const cx = quat.v[1] * quat.v[2];
    const cy = quat.v[0] * quat.v[2];
    const cz = quat.v[0] * quat.v[1];
    const wx = quat.v[3] * quat.v[0];
    const wy = quat.v[3] * quat.v[1];
    const wz = quat.v[3] * quat.v[2];

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    const m03 = 0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    const m13 = 0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  toString() {
    return this.v[0] + ' ' + this.v[4] + ' ' + this.v[8] + ' ' + this.v[12] + ' \n' +
      this.v[1] + ' ' + this.v[5] + ' ' + this.v[9] + ' ' + this.v[13] + ' \n' +
      this.v[2] + ' ' + this.v[6] + ' ' + this.v[10] + ' ' + this.v[14] + ' \n' +
      this.v[3] + ' ' + this.v[7] + ' ' + this.v[11] + ' ' + this.v[15] + ' \n';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + ' ' + MathUtil.nearZeroToZero(this.v[4]) + ' ' + MathUtil.nearZeroToZero(this.v[8]) + ' ' + MathUtil.nearZeroToZero(this.v[12]) + ' \n' +
      MathUtil.nearZeroToZero(this.v[1]) + ' ' + MathUtil.nearZeroToZero(this.v[5]) + ' ' + MathUtil.nearZeroToZero(this.v[9]) + ' ' + MathUtil.nearZeroToZero(this.v[13]) + ' \n' +
      MathUtil.nearZeroToZero(this.v[2]) + ' ' + MathUtil.nearZeroToZero(this.v[6]) + ' ' + MathUtil.nearZeroToZero(this.v[10]) + ' ' + MathUtil.nearZeroToZero(this.v[14]) + ' \n' +
      MathUtil.nearZeroToZero(this.v[3]) + ' ' + MathUtil.nearZeroToZero(this.v[7]) + ' ' + MathUtil.nearZeroToZero(this.v[11]) + ' ' + MathUtil.nearZeroToZero(this.v[15]) + ' \n';
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2], this.v[3],
    this.v[4], this.v[5], this.v[6], this.v[7],
    this.v[8], this.v[9], this.v[10], this.v[11],
    this.v[12], this.v[13], this.v[14], this.v[15]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix44, delta: number = Number.EPSILON) {
    if (Math.abs(mat.v[0] - this.v[0]) < delta &&
      Math.abs(mat.v[1] - this.v[1]) < delta &&
      Math.abs(mat.v[2] - this.v[2]) < delta &&
      Math.abs(mat.v[3] - this.v[3]) < delta &&
      Math.abs(mat.v[4] - this.v[4]) < delta &&
      Math.abs(mat.v[5] - this.v[5]) < delta &&
      Math.abs(mat.v[6] - this.v[6]) < delta &&
      Math.abs(mat.v[7] - this.v[7]) < delta &&
      Math.abs(mat.v[8] - this.v[8]) < delta &&
      Math.abs(mat.v[9] - this.v[9]) < delta &&
      Math.abs(mat.v[10] - this.v[10]) < delta &&
      Math.abs(mat.v[11] - this.v[11]) < delta &&
      Math.abs(mat.v[12] - this.v[12]) < delta &&
      Math.abs(mat.v[13] - this.v[13]) < delta &&
      Math.abs(mat.v[14] - this.v[14]) < delta &&
      Math.abs(mat.v[15] - this.v[15]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix44) {
    if (
      mat.v[0] === this.v[0] && mat.v[1] === this.v[1] && mat.v[2] === this.v[2] && mat.v[3] === this.v[3] &&
      mat.v[4] === this.v[4] && mat.v[5] === this.v[5] && mat.v[6] === this.v[6] && mat.v[7] === this.v[7] &&
      mat.v[8] === this.v[8] && mat.v[9] === this.v[9] && mat.v[10] === this.v[10] && mat.v[11] === this.v[11] &&
      mat.v[12] === this.v[12] && mat.v[13] === this.v[13] && mat.v[14] === this.v[14] && mat.v[15] === this.v[15]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this.v[row_i + column_i * 4];
  }

  determinant() {
    return this.v[0] * this.v[5] * this.v[10] * this.v[15] + this.v[0] * this.v[9] * this.v[14] * this.v[7] + this.v[0] * this.v[13] * this.v[6] * this.v[11] +
      this.v[4] * this.v[1] * this.v[14] * this.v[11] + this.v[4] * this.v[9] * this.v[2] * this.v[15] + this.v[4] * this.v[13] * this.v[10] * this.v[3] +
      this.v[8] * this.v[1] * this.v[6] * this.v[15] + this.v[8] * this.v[5] * this.v[14] * this.v[3] + this.v[8] * this.v[13] * this.v[2] * this.v[7] +
      this.v[12] * this.v[1] * this.v[10] * this.v[7] + this.v[12] * this.v[5] * this.v[2] * this.v[11] + this.v[12] * this.v[9] * this.v[6] * this.v[3] -

      this.v[0] * this.v[5] * this.v[14] * this.v[11] - this.v[0] * this.v[9] * this.v[6] * this.v[15] - this.v[0] * this.v[13] * this.v[10] * this.v[7] -
      this.v[4] * this.v[1] * this.v[10] * this.v[15] - this.v[4] * this.v[9] * this.v[14] * this.v[3] - this.v[4] * this.v[13] * this.v[2] * this.v[11] -
      this.v[8] * this.v[1] * this.v[14] * this.v[7] - this.v[8] * this.v[5] * this.v[2] * this.v[15] - this.v[8] * this.v[13] * this.v[6] * this.v[3] -
      this.v[12] * this.v[1] * this.v[6] * this.v[11] - this.v[12] * this.v[5] * this.v[10] * this.v[3] - this.v[12] * this.v[9] * this.v[2] * this.v[7];
  }

  multiplyVector(vec: Vector4) {
    const x = this.v[0] * vec.v[0] + this.v[4] * vec.v[1] + this.v[8] * vec.v[2] + this.v[12] * vec.v[3];
    const y = this.v[1] * vec.v[0] + this.v[5] * vec.v[1] + this.v[9] * vec.v[2] + this.v[13] * vec.v[3];
    const z = this.v[2] * vec.v[0] + this.v[6] * vec.v[1] + this.v[10] * vec.v[2] + this.v[14] * vec.v[3];
    const w = this.v[3] * vec.v[0] + this.v[7] * vec.v[1] + this.v[11] * vec.v[2] + this.v[15] * vec.v[3];

    return new Vector4(x, y, z, w);
  }

  multiplyVectorTo(vec: Vector4, outVec: MutableVector4) {
    const x = this.v[0] * vec.v[0] + this.v[4] * vec.v[1] + this.v[8] * vec.v[2] + this.v[12] * vec.v[3];
    const y = this.v[1] * vec.v[0] + this.v[5] * vec.v[1] + this.v[9] * vec.v[2] + this.v[13] * vec.v[3];
    const z = this.v[2] * vec.v[0] + this.v[6] * vec.v[1] + this.v[10] * vec.v[2] + this.v[14] * vec.v[3];
    const w = this.v[3] * vec.v[0] + this.v[7] * vec.v[1] + this.v[11] * vec.v[2] + this.v[15] * vec.v[3];
    outVec.v[0] = x;
    outVec.v[1] = y;
    outVec.v[2] = z;
    outVec.v[3] = w;

    return outVec;
  }

  multiplyVectorToVec3(vec: Vector4, outVec: MutableVector3) {
    const x = this.v[0] * vec.v[0] + this.v[4] * vec.v[1] + this.v[8] * vec.v[2] + this.v[12] * vec.v[3];
    const y = this.v[1] * vec.v[0] + this.v[5] * vec.v[1] + this.v[9] * vec.v[2] + this.v[13] * vec.v[3];
    const z = this.v[2] * vec.v[0] + this.v[6] * vec.v[1] + this.v[10] * vec.v[2] + this.v[14] * vec.v[3];
    outVec.v[0] = x;
    outVec.v[1] = y;
    outVec.v[2] = z;

    return outVec;
  }

  multiplyVector3(vec: Vector3) {
    const x = this.v[0] * vec.v[0] + this.v[4] * vec.v[1] + this.v[8] * vec.v[2] + this.v[12]; // regards vec.w(vec.v[3]) as 1
    const y = this.v[1] * vec.v[0] + this.v[5] * vec.v[1] + this.v[9] * vec.v[2] + this.v[13];
    const z = this.v[2] * vec.v[0] + this.v[6] * vec.v[1] + this.v[10] * vec.v[2] + this.v[14];

    return new Vector3(x, y, z);
  }

  multiplyVector3To(vec: IVector3, outVec: MutableVector3) {
    const x = this.v[0] * vec.v[0] + this.v[4] * vec.v[1] + this.v[8] * vec.v[2] + this.v[12]; // regards vec.w(vec.v[3]) as 1
    const y = this.v[1] * vec.v[0] + this.v[5] * vec.v[1] + this.v[9] * vec.v[2] + this.v[13];
    const z = this.v[2] * vec.v[0] + this.v[6] * vec.v[1] + this.v[10] * vec.v[2] + this.v[14];
    outVec.v[0] = x;
    outVec.v[1] = y;
    outVec.v[2] = z;

    return outVec;
  }

  getTranslate() {
    return new Vector3(this.v[12], this.v[13], this.v[14]);
  }

  /**
   * get translate vector from this matrix
   */
  getTranslateTo(outVec: MutableVector3) {
    outVec.v[0] = this.v[12];
    outVec.v[1] = this.v[13];
    outVec.v[2] = this.v[14];
    return outVec;
  }

  getScale() {
    return new Vector3(
      Math.hypot(this.v[0], this.v[4], this.v[8]),
      Math.hypot(this.v[1], this.v[5], this.v[9]),
      Math.hypot(this.v[2], this.v[6], this.v[10])
    );
  }

  /**
   * get scale vector from this matrix
   */
  getScaleTo(outVec: MutableVector3) {
    outVec.v[0] = Math.hypot(this.v[0], this.v[4], this.v[8]);
    outVec.v[1] = Math.hypot(this.v[1], this.v[5], this.v[9]);
    outVec.v[2] = Math.hypot(this.v[2], this.v[6], this.v[10]);
    return outVec;
  }

  /**
   * @return Euler Angles Rotation (x, y, z)
   */
  toEulerAngles() {
    let rotate = null;
    if (Math.abs(this.v[2]) != 1.0) {
      let y = -Math.asin(this.v[2]);
      let x = Math.atan2(this.v[6] / Math.cos(y), this.v[10] / Math.cos(y));
      let z = Math.atan2(this.v[1] / Math.cos(y), this.v[0] / Math.cos(y));
      rotate = new Vector3(x, y, z);
    } else if (this.v[2] === -1.0) {
      rotate = new Vector3(Math.atan2(this.v[4], this.v[8]), Math.PI / 2.0, 0.0);
    } else {
      rotate = new Vector3(Math.atan2(-this.v[4], -this.v[8]), -Math.PI / 2.0, 0.0);
    }

    return rotate;
  }

  toEulerAnglesTo(outVec3: MutableVector3) {
    if (Math.abs(this.v[2]) != 1.0) {
      let y = -Math.asin(this.v[2]);
      let x = Math.atan2(this.v[6] / Math.cos(y), this.v[10] / Math.cos(y));
      let z = Math.atan2(this.v[1] / Math.cos(y), this.v[0] / Math.cos(y));
      outVec3.v[0] = x;
      outVec3.v[1] = y;
      outVec3.v[2] = z;
    } else if (this.v[2] === -1.0) {
      outVec3.v[0] = Math.atan2(this.v[4], this.v[8])
      outVec3.v[1] = Math.PI / 2.0;
      outVec3.v[2] = 0.0;
    } else {
      outVec3.v[0] = Math.atan2(-this.v[4], -this.v[8])
      outVec3.v[1] = -Math.PI / 2.0;
      outVec3.v[2] = 0.0;
    }

    return outVec3;
  }

  clone() {
    return new (this.constructor as any)(
      this.v[0], this.v[4], this.v[8], this.v[12],
      this.v[1], this.v[5], this.v[9], this.v[13],
      this.v[2], this.v[6], this.v[10], this.v[14],
      this.v[3], this.v[7], this.v[11], this.v[15]
    ) as Matrix44;
  }

  getRotate() {
    const quat = Quaternion.fromMatrix(this);
    const rotateMat = new (this.constructor as any)(quat) as Matrix44;
    return rotateMat;
  }
}
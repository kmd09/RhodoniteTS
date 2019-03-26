import Vector2 from './Vector2';
import Vector3 from './Vector3';
import Vector4 from './Vector4';
import Quaternion from './Quaternion';
import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import { CompositionTypeEnum } from '../main';
import { CompositionType } from '../definitions/CompositionType';
import MutableMatrix44 from './MutableMatrix44';
import MutableMatrix33 from './MutableMatrix33';
import MutableVector4 from './MutableVector4';
import MutableVector3 from './MutableVector3';

export default class MathClassUtil {
  constructor() {

  }


  static arrayToVector(element:Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof(element[2]) !== 'undefined') {
        return new Vector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static arrayToVectorOrMatrix(element:Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[15]) !== 'undefined') {
        return new Matrix44(element);
      } else if(typeof(element[8]) !== 'undefined') {
        return new Matrix33(element);
      } else if(typeof(element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof(element[2]) !== 'undefined') {
        return new Vector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static getImmutableValueClass(compositionType: CompositionTypeEnum): Function|undefined {
    if (compositionType === CompositionType.Vec2) {
      return Vector2;
    } else if (compositionType === CompositionType.Vec3) {
      return Vector3;
    } else if (compositionType === CompositionType.Vec4) {
      return Vector4;
    } else if (compositionType === CompositionType.Mat3) {
      return Matrix33;
    } else if (compositionType === CompositionType.Mat4) {
      return Matrix44;
    }
  }

  static getMutableValueClass(compositionType: CompositionTypeEnum): Function|undefined {
    if (compositionType === CompositionType.Vec3) {
      return MutableVector3;
    } else if (compositionType === CompositionType.Vec4) {
      return MutableVector4;
    } else if (compositionType === CompositionType.Mat3) {
      return MutableMatrix33;
    } else if (compositionType === CompositionType.Mat4) {
      return MutableMatrix44;
    }
  }

  static cloneOfMathObjects(element:any) {
    if(element instanceof Matrix44) {
      return element.clone();
    } else if (element instanceof Matrix33) {
      return element.clone();
    } else if (element instanceof Vector4) {
      return element.clone();
    } else if (element instanceof Vector3) {
      return element.clone();
    } else if (element instanceof Vector2) {
      return element.clone();
    } else {
      return element;
    }

  }

  static isAcceptableArrayForQuaternion(element: Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[3]) !== 'undefined') {
        return true;
      }
    }
    return false;
  }

  static arrayToQuaternion(element:Array<number>) {
    return new Quaternion(element[0], element[1], element[2], element[3]);
  }

  static makeSubArray(array:Array<any>, componentN:number) {
    if (componentN === 4) {
      return [array[0], array[1], array[2], array[3]];
    } else if (componentN === 3) {
      return [array[0], array[1], array[2]];
    } else if (componentN === 2) {
      return [array[0], array[1]];
    } else {
      return array[0];
    }
  }

  static vectorToArray(element:Vector2|Vector3|Vector4|Quaternion) {
    if(element instanceof Vector2) {
      return [element.x, element.y];
    } else if (element instanceof Vector3) {
      return [element.x, element.y, element.z];
    } else if (element instanceof Vector4 || element instanceof Quaternion) {
      return [element.x, element.y, element.z, element.w];
    } else {
      return element;
    }
  }

  /**
   * discriminate which Vector instance 
   * @param element any Vector instance  
   * @return number of Vector instance
   */
  static compomentNumberOfVector(element: Vector2 | Vector3 |  Vector4 | Quaternion | Array<any>): number {
    if(element instanceof Vector2) {
      return 2;
    } else if (element instanceof Vector3) {
      return 3;
    } else if (element instanceof Vector4 || element instanceof Quaternion) {
      return 4;
    } else if (Array.isArray(element)) {
      return element.length;
    } else {
      return 0;
    }
  }

  // values range must be [-1, 1]
  static packNormalizedVec4ToVec2(x:number, y:number, z:number, w:number, criteria:number) {
    let v0 = 0.0;
    let v1 = 0.0;
    
    x = (x + 1)/2.0;
    y = (y + 1)/2.0;
    z = (z + 1)/2.0;
    w = (w + 1)/2.0;

    let ir = Math.floor(x*(criteria-1.0));
    let ig = Math.floor(y*(criteria-1.0));
    let irg = ir*criteria + ig;
    v0 = irg / criteria; 

    let ib =  Math.floor(z*(criteria-1.0));
    let ia =  Math.floor(w*(criteria-1.0));
    let iba = ib*criteria + ia;
    v1 =iba / criteria; 
    
    return [v0, v1];
  }

  static unProject(windowPosVec3:Vector3, inversePVMat44:Matrix44, viewportVec4:Vector4, zNear:number, zFar:number) {
    const input = new Vector4(
      (windowPosVec3.x - viewportVec4.x) / viewportVec4.z * 2 - 1.0,
      (windowPosVec3.y - viewportVec4.y) / viewportVec4.w * 2 - 1.0,
//      (windowPosVec3.z - zNear) / (zFar - zNear),
      2 * windowPosVec3.z - 1.0,
      1.0
    );

    const PVMat44 = inversePVMat44;//Matrix44.transpose(inversePVMat44);

    const out = PVMat44.multiplyVector(input);
//    const a = input.x * PVMat44.m03 + input.y * PVMat44.m13 + input.z * PVMat44.m23 + PVMat44.m33;
//    const a = input.x * PVMat44.m30 + input.y * PVMat44.m31 + input.z * PVMat44.m32 + PVMat44.m33;

    if (out.w === 0) {
      console.warn("Zero division!");
    }

    const output = new Vector3(Vector4.multiply(out, 1/out.w));

    return output;
  }

  static add(lhs:any, rhs:any) {
    if (isFinite(lhs)) { // number?
      return lhs + rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.add(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.add(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.add(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.add(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i=0; i<lhs.length; i++) {
        arr[i] = lhs[i] + rhs[i];
      }
      return arr;
    } else {
      console.error('Non supported type!');
    }
  }

  static subtract(lhs:any, rhs:any) {
    if (isFinite(lhs)) { // number?
      return lhs - rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.subtract(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.subtract(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.subtract(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.subtract(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i=0; i<lhs.length; i++) {
        arr[i] = lhs[i] - rhs[i];
      }
      return arr;
    } else {
      console.error('Non supported type!');
    }
  }

  static multiplyNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) { // number?
      return lhs * rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i=0; i<lhs.length; i++) {
        arr[i] = lhs[i] * rhs;
      }
      return arr;
    } else {
      console.error('Non supported type!');
    }
  }
  static divideNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) { // number?
      return lhs / rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, 1/rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, 1/rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, 1/rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, 1/rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i=0; i<lhs.length; i++) {
        arr[i] = lhs[i] / rhs;
      }
      return arr;
    } else {
      console.error('Non supported type!');
    }
  }

  static init(objForDetectType: any, val: number) {
    if (isFinite(objForDetectType)) { // number?
      return val;
    } else if (objForDetectType instanceof Vector2) {
      return new Vector2(val, val);
    } else if (objForDetectType instanceof Vector3) {
      return new Vector3(val, val, val);
    } else if (objForDetectType instanceof Vector4) {
      return new Vector4(val, val, val, val);
    } else if (objForDetectType instanceof Quaternion) {
      return new Quaternion(0, 0, 0, 1);
    } else if (Array.isArray(objForDetectType)) {
      const arr: number[] = [];
      for (let i=0; i<objForDetectType.length; i++) {
        arr[i] = val;
      }
      return arr;
    } else {
      console.error('Non supported type!');
    }
  }
}

//GLBoost["MathClassUtil"] = MathClassUtil;

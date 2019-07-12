import RnObject from "../core/RnObject";
import Buffer from "../memory/Buffer";
import Accessor from "./AccessorBase";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum, ComponentType } from "../definitions/ComponentType";
import { access } from "fs-extra";
import AccessorBase from "./AccessorBase";
import FlexibleAccessor from "./FlexibleAccessor";


export default class BufferView extends RnObject {
  private __buffer: Buffer;
  private __byteOffset: Byte;
  private __byteLength: Byte;
  private __byteStride: Byte = 0;
  private __target: Index = 0;
  private __takenByteIndex: Byte = 0;
  private __takenByteOffsetOfFirstElement = 0;
  private __raw: Uint8Array;
  private __isAoS: boolean;
  private __accessors: Array<Accessor> = [];

  constructor({buffer, byteOffset, byteLength, raw, isAoS} :
    {buffer: Buffer, byteOffset: Byte, byteLength: Byte, raw: Uint8Array, isAoS: boolean})
  {
    super();
    this.__buffer = buffer;
    this.__byteOffset = byteOffset;
    this.__byteLength = byteLength;
    this.__raw = raw;
    this.__isAoS = isAoS;
  }

  set byteStride(stride: Byte) {
    this.__byteStride = stride;
  }

  get byteStride() {
    return this.__byteStride;
  }

  get byteLength() {
    return this.__byteLength;
  }

  get byteOffset() {
    return this.__byteOffset;
  }

  get buffer() {
    return this.__buffer;
  }

  get isSoA() {
    return !this.__isAoS;
  }

  recheckIsSoA() {
    if (this.__accessors.length <= 1) {
      return true;
    }

    let firstStrideBytes = this.__accessors[0].byteStride;
    let secondStrideBytes = this.__accessors[1].byteStride;
    let firstElementSizeInBytes = this.__accessors[0].elementSizeInBytes;
    let secondElementSizeInBytes = this.__accessors[1].elementSizeInBytes;

    if (firstStrideBytes === secondStrideBytes &&
      (firstElementSizeInBytes + secondElementSizeInBytes) < firstElementSizeInBytes) {
      return true;
    } else {
      return false;
    }
  }

  get isAoS() {
    return this.__isAoS;
  }

  getUint8Array() {
    return this.__raw;
  }

  takeAccessor({compositionType, componentType, count, max, min, byteAlign = 4}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, max?: number, min?: number, byteAlign?: Byte}): Accessor {
    const byteStride = this.byteStride;

    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: Accessor, max: max, min: min, byteAlign});

    return accessor;
  }

  takeFlexibleAccessor({compositionType, componentType, count, byteStride, max, min, byteAlign = 4}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, max?: number, min?: number, byteAlign?: Byte}): FlexibleAccessor {

    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: FlexibleAccessor, max: max, min: min, byteAlign});

    return accessor;

  }

  takeAccessorWithByteOffset({compositionType, componentType, count, byteOffset, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteOffset: Byte, max?: number, min?: number}): Accessor {
    const byteStride = this.byteStride;

    const accessor = this.__takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass: Accessor, max, min});

    return accessor;
  }

  takeFlexibleAccessorWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, byteOffset: Byte, max?: number, min?: number}): FlexibleAccessor {
    const accessor = this.__takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass: FlexibleAccessor, max, min});

    return accessor;

  }

  private __takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass, max, min, byteAlign}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, accessorClass:any, max?: number, min?: number, byteAlign: Byte}): AccessorBase {
    let byteOffset = 0;
    if (this.isSoA) {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;
    } else {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
    }

    if (byteOffset % byteAlign !== 0) {
      console.info('Padding bytes added because byteOffset is not 4byte aligned.');
      byteOffset += byteAlign - byteOffset % byteAlign;
    }

    if (this.__byteOffset % byteAlign !== 0) {
      console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
      this.__byteOffset += byteAlign - this.__byteOffset % byteAlign;
      this.buffer._addTakenByteIndex(byteAlign - this.__byteOffset % byteAlign);
    }


    const accessor = new accessorClass({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw, max: max, min: min
    });

    this.__accessors.push(accessor);

    return accessor;

  }

  private __takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, byteOffset: Byte, accessorClass:any, max?: number, min?: number}): AccessorBase {

    // if (byteOffset % 4 !== 0) {
    //   console.info('Padding bytes added because byteOffset is not 4byte aligned.');
    //   byteOffset += 4 - byteOffset % 4;
    // }

    // if (this.__byteOffset % 4 !== 0) {
    //   console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
    //   this.__byteOffset += 4 - this.__byteOffset % 4;
    // this.buffer._addTakenByteIndex(4 - this.__byteOffset % 4);
    // }

    const accessor = new accessorClass({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw, max: max, min: min
    });

    this.__accessors.push(accessor);

    return accessor;

  }
}

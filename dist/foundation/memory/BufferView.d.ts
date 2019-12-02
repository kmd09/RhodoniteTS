import RnObject from "../core/RnObject";
import Buffer from "../memory/Buffer";
import Accessor from "./Accessor";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum } from "../definitions/ComponentType";
import FlexibleAccessor from "./FlexibleAccessor";
import { Byte, Count, Size } from "../../types/CommonTypes";
export default class BufferView extends RnObject {
    private __buffer;
    private __byteOffsetInRawArrayBufferOfBuffer;
    private __byteLength;
    private __byteStride;
    private __target;
    private __takenByteIndex;
    private __takenByteOffsetOfFirstElement;
    private __raw;
    private __isAoS;
    private __accessors;
    constructor({ buffer, byteOffset, byteLength, raw, isAoS }: {
        buffer: Buffer;
        byteOffset: Byte;
        byteLength: Byte;
        raw: ArrayBuffer;
        isAoS: boolean;
    });
    set byteStride(stride: Byte);
    get byteStride(): Byte;
    get byteLength(): number;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInBuffer(): number;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get buffer(): Buffer;
    get isSoA(): boolean;
    recheckIsSoA(): boolean;
    get isAoS(): boolean;
    getUint8Array(): Uint8Array;
    takeAccessor({ compositionType, componentType, count, max, min, byteAlign, arrayLength }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        max?: number;
        min?: number;
        byteAlign?: Byte;
        arrayLength?: Size;
    }): Accessor;
    takeFlexibleAccessor({ compositionType, componentType, count, byteStride, max, min, byteAlign, arrayLength }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
        max?: number;
        min?: number;
        byteAlign?: Byte;
        arrayLength?: Size;
    }): FlexibleAccessor;
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffset, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteOffset: Byte;
        max?: number;
        min?: number;
    }): Accessor;
    takeFlexibleAccessorWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
        byteOffset: Byte;
        max?: number;
        min?: number;
    }): FlexibleAccessor;
    private __takeAccessorInner;
    private __takeAccessorInnerWithByteOffset;
}
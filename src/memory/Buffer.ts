import RnObject from "../core/Object";
import BufferView from "./BufferView";

export default class Buffer extends RnObject {
  private __byteLength: Size = 0;
  private __raw: ArrayBuffer;
  private __name: string = '';
  private __takenBytesIndex: Byte = 0;

  constructor({byteLength, arrayBuffer, name} : {byteLength: Size, arrayBuffer: ArrayBuffer, name: string}) {
    super();
    this.__name = name;
    this.__byteLength = byteLength;
    this.__raw = arrayBuffer;
  }

  set name(str) {
    this.__name = str;
  }

  get name() {
    return this.__name;
  }

  getArrayBuffer() {
    return this.__raw;
  }

  takeBufferView({byteLengthToNeed, byteStride, isAoS} : {byteLengthToNeed: Byte, byteStride: Byte, isAoS: boolean}) {
    if (byteLengthToNeed % 4 !== 0) {
      throw new Error('Because of memory alignment constraints, byteLengthToNeed must be a multiple of 4.');
      return null;
    }
    if (byteStride % 4 !== 0) {
      throw new Error('Because of memory alignment constraints, byteStride must be a multiple of 4.');
      return null;
    }
    const array = new Uint8Array(this.__raw, this.__takenBytesIndex, byteLengthToNeed);

    const bufferView = new BufferView({buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS});
    bufferView.byteStride = byteStride;
    this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;

    return bufferView;
  }
}

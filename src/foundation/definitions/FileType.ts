import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface FileTypeEnum extends EnumIO {
}

class FileTypeClass extends EnumClass implements FileTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Unknown: FileTypeEnum = new FileTypeClass({index:-1, str:'unknown'});
const Gltf: FileTypeEnum = new FileTypeClass({index:0, str:'gltf'});
const GltfBinary: FileTypeEnum = new FileTypeClass({index:1, str:'glb'});
const VRM: FileTypeEnum = new FileTypeClass({index:2, str:'vrm'});
const Draco: FileTypeEnum = new FileTypeClass({index:3, str:'drc'});
const EffekseerEffect: FileTypeEnum = new FileTypeClass({index:4, str:'efk'});

const typeList = [Unknown, Gltf, GltfBinary, VRM, Draco, EffekseerEffect];

function from( index : number ): FileTypeEnum {
  return _from({typeList, index}) as FileTypeEnum;
}

function fromString( str: string ): FileTypeEnum {
  const filetype =  _fromString({typeList, str}) as FileTypeEnum;
  if (filetype != null) {
    return filetype;
  } else {
    return Unknown;
  }
}

function isGltfOrGlb(file: FileTypeEnum) {
  if (file === Gltf || file === GltfBinary) {
    return true;
  } else {
    return false;
  }
}

export const FileType = Object.freeze({ Unknown, Gltf, GltfBinary, VRM, Draco, EffekseerEffect, from, fromString, isGltfOrGlb });
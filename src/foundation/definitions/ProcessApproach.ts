import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ProcessApproachEnum extends EnumIO {

}

class ProcessApproachClass extends EnumClass implements ProcessApproachEnum {
  constructor({ index, str }: { index: number, str: string }) {
    super({ index, str });
  }
}

const None: ProcessApproachEnum = new ProcessApproachClass({ index: 0, str: 'NONE' });
const UniformWebGL1: ProcessApproachEnum = new ProcessApproachClass({ index: 1, str: 'UNIFORM_WEBGL1' });
const UniformWebGL2: ProcessApproachEnum = new ProcessApproachClass({ index: 2, str: 'UNIFORM_WEBGL2' });
const DataTextureWebGL1: ProcessApproachEnum = new ProcessApproachClass({ index: 3, str: 'DATA_TEXTURE_WEBGL1' });
const DataTextureWebGL2: ProcessApproachEnum = new ProcessApproachClass({ index: 4, str: 'DATA_TEXTURE_WEBGL2' });
const UBOWebGL2: ProcessApproachEnum = new ProcessApproachClass({ index: 5, str: 'UBO_WEBGL2' });
const TransformFeedbackWebGL2: ProcessApproachEnum = new ProcessApproachClass({ index: 6, str: 'TRANSFORM_FEEDBACK_WEBGL2' });
const FastestWebGL1: ProcessApproachEnum = new ProcessApproachClass({ index: 7, str: 'FASTEST_WEBGL1' });
const FastestWebGL2: ProcessApproachEnum = new ProcessApproachClass({ index: 8, str: 'FASTEST_WEBGL2' });

const typeList = [None, UniformWebGL1, UniformWebGL2, DataTextureWebGL1, DataTextureWebGL2, UBOWebGL2, TransformFeedbackWebGL2, FastestWebGL1, FastestWebGL2];

function from(index: number): ProcessApproachEnum|undefined {
  return _from({ typeList, index });
}

const isFastestApproach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case FastestWebGL1:
    case FastestWebGL2:
      return true;
    default: return false;
  }
}

const isUniformApproach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case UniformWebGL1:
    case UniformWebGL2:
      return true;
    default: return false;
  }
}


const isWebGL2Approach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case UniformWebGL2:
    case FastestWebGL2:
      return true;
    default: return false;
  }
}


export const ProcessApproach = Object.freeze({
  isFastestApproach,
  isUniformApproach,
  None,
  UniformWebGL1,
  UniformWebGL2,
  DataTextureWebGL1,
  DataTextureWebGL2,
  UBOWebGL2,
  TransformFeedbackWebGL2,
  FastestWebGL1,
  FastestWebGL2,
});

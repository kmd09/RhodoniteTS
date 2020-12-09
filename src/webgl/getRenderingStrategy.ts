import { ProcessApproach, ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
import WebGLStrategy from "./WebGLStrategy";
import WebGLStrategyUniform from "./WebGLStrategyUniform";
import WebGLStrategyFastest from "./WebGLStrategyFastest";

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (processApproach.index === ProcessApproach.FastestWebGL1.index || 
      processApproach.index === ProcessApproach.FastestWebGL2.index
    ) {
    return WebGLStrategyFastest.getInstance();
  } else if (processApproach.index === ProcessApproach.UniformWebGL1.index ||
    processApproach.index === ProcessApproach.UniformWebGL2.index) {
    return WebGLStrategyUniform.getInstance();
  }
  return WebGLStrategyUniform.getInstance();
}

export default getRenderingStrategy;

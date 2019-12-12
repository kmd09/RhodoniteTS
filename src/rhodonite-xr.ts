import WebVRSystem from "./xr/WebVRSystem";
import WebXRSystem from "./xr/WebXRSystem";

const XR = Object.freeze({
  WebVRSystem,
  WebXRSystem
});
export default XR;

if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = XR;
}

export type RnXR = typeof XR;
(0, eval)('this').RnXR = XR;

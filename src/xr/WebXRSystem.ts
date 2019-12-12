
declare const XRSession: any;

declare global {
  interface Navigator {
    xr: any;
  }
}

export default class WebXRSystem {
  private static __instance: WebXRSystem;
  private __device: any;

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebXRSystem();
    }

    return this.__instance;
  }

  async readyForWebXR(requestButtonDom: HTMLElement) {
    if (navigator.xr && XRSession.prototype.requestHitTest) {
      try {
        this.__device = await navigator.xr.requestDevice();
      } catch (e) {
        console.error('No WebXR devices found.');
        return;
      }
    } else {
      console.error('WebXR is not supported in this environment.');
      return;
    }
  }
}

import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";

declare const XRSession: any;
declare const XRWebGLLayer: any;
const WebXRPolyfill:any = require('webxr-polyfill').default;

declare global {
  interface Navigator {
    xr: any;
  }

  interface Window {
    __webxrPolyfill: any
  }
}

export default class WebXRSystem {
  private static __instance: WebXRSystem;
  private __device: any;
  private __session: any;
  private __gl: any;
  private __frameOfRef: any;

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      window.__webxrPolyfill = new WebXRPolyfill();
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

      if (requestButtonDom) {
        requestButtonDom.style.display = "block";
      } else {
        const paragrach = document.createElement("p");
        const anchor = document.createElement("a");
        anchor.setAttribute("id", "enter-vr");
        const enterVr = document.createTextNode("Enter VR");

        anchor.appendChild(enterVr);
        paragrach.appendChild(anchor);

        // const canvas = glw.canvas;
        // canvas.parentNode!.insertBefore(paragrach, canvas);
        // window.addEventListener("click", this.enterWebVR.bind(this) as any);
      }
    } else {
      console.error('WebXR is not supported in this environment.');
      return;
    }
  }

  async enterWebAR() {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('xrpresent');

    try {
      const session = await this.__device.requestSession({
        outputContext: ctx,
        environmentIntegration: true
      });
      document.body.appendChild(outputCanvas);
      this.sessionStarted(session);
    } catch (e) {
      console.error('No WebAR Devices:' +  e);
    }
  }

  async sessionStarted(session: any) {
    this.__session = session;

    document.body.classList.add('ar');

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webglResourceRepository.currentWebGLContextWrapper;

    this.__gl = glw!.getRawContext();

    await this.__gl.setCompatibleXRDevice(this.__session.device);

    this.__session.baseLayer = new XRWebGLLayer(this.__session, this.__gl);

    this.__frameOfRef = await this.__session.requestFrameOfReference('eye-level');
    // this.__session.requestAnimationFrame(this.onXRFrame);
  }

}

export default class WebXRSystem {
  private static __instance: WebXRSystem;

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebXRSystem();
    }

    return this.__instance;
  }
}


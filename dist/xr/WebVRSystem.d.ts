import Vector3 from "../foundation/math/Vector3";
import MutableMatrix44 from "../foundation/math/MutableMatrix44";
import { Index } from "../commontypes/CommonTypes";
import Vector4 from "../foundation/math/Vector4";
export default class WebVRSystem {
    private static __instance;
    private __isWebVRMode;
    private __webvrFrameData?;
    private __webvrDisplay?;
    private __requestedToEnterWebVR;
    private __isReadyForWebVR;
    private __vrDisplay?;
    private __defaultUserSittingPositionInVR;
    private __invertSittingToStandingTransform;
    private __minRenderWidthFromUser;
    private __minRenderHeightFromUser;
    private __canvasWidthBackup;
    private __canvasHeightBackup;
    private __leftViewMatrix;
    private __rightViewMatrix;
    private __leftCameraEntity;
    private __rightCameraEntity;
    private constructor();
    static getInstance(): WebVRSystem;
    getFrameData(): void;
    enterWebVR(initialUserSittingPositionIfStageParametersDoNotExist?: Vector3, minRenderWidth?: number, minRenderHeight?: number): Promise<unknown>;
    readyForWebVR(requestButtonDom: HTMLElement): Promise<unknown>;
    exitWebVR(): Promise<void>;
    disableWebVR(): Promise<void>;
    get isWebVRMode(): boolean;
    get isReadyForWebVR(): boolean;
    webVrSubmitFrame(): void;
    get webVrFrameData(): VRFrameData | undefined;
    get leftViewMatrix(): MutableMatrix44;
    get rightViewMatrix(): MutableMatrix44;
    get leftProjectionMatrix(): MutableMatrix44;
    get rightProjectionMatrix(): MutableMatrix44;
    getLeftViewport(originalViewport: Vector4): Vector4;
    getRightViewport(originalViewport: Vector4): Vector4;
    getViewMatrixAt(index: Index): MutableMatrix44;
    getProjectMatrixAt(index: Index): MutableMatrix44;
    getViewportAt(viewport: Vector4, index: Index): Vector4;
    get vrDisplay(): VRDisplay | undefined;
    setValuesToGlobalDataRepository(): void;
    getCameraComponentSIDAt(index: Index): number;
    get requestedToEnterWebVR(): boolean;
    _setIsWebVRMode(): void;
}

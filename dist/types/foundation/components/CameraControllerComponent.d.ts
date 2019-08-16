import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import Vector3 from "../math/Vector3";
import MutableVector3 from "../math/MutableVector3";
import CameraComponent from "./CameraComponent";
import Entity from "../core/Entity";
import { ComponentTID, ComponentSID, EntityUID } from "../../types/CommonTypes";
export default class CameraControllerComponent extends Component {
    private __isKeyUp;
    private __movedMouseYOnCanvas;
    private __movedMouseXOnCanvas;
    private __clickedMouseYOnCanvas;
    private __clickedMouseXOnCanvas;
    private __mouse_translate_y;
    private __mouse_translate_x;
    private __efficiency;
    private __lengthOfCenterToEye;
    private __foyvBias;
    private __scaleOfTraslation;
    private __mouseTranslateVec;
    private __newEyeToCenterVec;
    private __newUpVec;
    private __newTangentVec;
    private __verticalAngleThrethold;
    private __verticalAngleOfVectors;
    private __isForceGrab;
    private __isSymmetryMode;
    eventTargetDom?: HTMLElement;
    private __doResetWhenCameraSettingChanged;
    private __rot_bgn_x;
    private __rot_bgn_y;
    private __rot_x;
    private __rot_y;
    private __dolly;
    private __eyeVec;
    private __centerVec;
    private __upVec;
    private __shiftCameraTo;
    private __lengthCenterToCorner;
    private __cameraComponent?;
    private __targetEntity?;
    private __lengthCameraToObject;
    private __scaleOfLengthCameraToCenter;
    private __zFarAdjustingFactorBasedOnAABB;
    private __scaleOfZNearAndZFar;
    private __doPreventDefault;
    moveSpeed: number;
    private __pinchInOutInitDistance?;
    private static returnVector3Eye;
    private static returnVector3Center;
    private static returnVector3Up;
    private __maximum_y?;
    private __minimum_y?;
    private __initX;
    private __initY;
    private __originalTranslate;
    private __totalTranslate;
    private __resetDollyTouchTime;
    private __controllerTranslate;
    private __mouseDownFunc;
    private __mouseUpFunc;
    private __mouseMoveFunc;
    private __pinchInOutFunc;
    private __pinchInOutEndFunc;
    private __mouseWheelFunc;
    private __mouseDblClickFunc;
    private __contextMenuFunc;
    private __touchParalleltranslationStartFunc;
    private __touchParalleltranslationFunc;
    private __touchParalleltranslationEndFunc;
    private __resetDollyAndPositionFunc;
    private __mouseParalleltranslationStartFunc;
    private __mouseParalleltranslationFunc;
    private __mouseParalleltranslationEndFunc;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    zFarAdjustingFactorBasedOnAABB: number;
    setTarget(targetEntity: Entity): void;
    getTarget(): Entity | undefined;
    doPreventDefault: boolean;
    $create(): void;
    __mouseUp(evt: any): void;
    __mouseDown(evt: any): boolean;
    __mouseMove(evt: any): void;
    maximumY: number;
    minimumY: number;
    private __tryToPreventDefault;
    __mouseWheel(evt: WheelEvent): void;
    __contextMenu(evt: Event): void;
    __mouseDblClick(evt: MouseEvent): void;
    resetDolly(): void;
    dolly: any;
    __getTouchesDistance(event: TouchEvent): number;
    __pinchInOutEnd(event: TouchEvent): void;
    __pinchInOut(event: TouchEvent): void;
    __touchParalleltranslationStart(e: TouchEvent): void;
    __touchParalleltranslation(e: TouchEvent): void;
    __touchParalleltranslationEnd(e: TouchEvent): void;
    __mouseParalleltranslationStart(e: MouseEvent): void;
    __mouseParalleltranslation(e: MouseEvent): void;
    __mouseParalleltranslationEnd(e: MouseEvent): void;
    __resetDollyAndPosition(e: TouchEvent): void;
    registerEventListeners(eventTargetDom?: Document): void;
    unregisterEventListeners(eventTargetDom?: Document): void;
    __getFovyFromCamera(camera: CameraComponent): number;
    $logic(): void;
    __convert(camera: CameraComponent, eye: Vector3, center: Vector3, up: Vector3): {
        newEyeVec: any;
        newCenterVec: MutableVector3;
        newUpVec: any;
        newZNear: number;
        newZFar: number;
        newLeft: number;
        newRight: number;
        newTop: number;
        newBottom: number;
        fovy: number;
    };
    __getTargetAABB(): import("../math/AABB").default;
    __updateTargeting(camera: CameraComponent): {
        newEyeVec: any;
        newCenterVec: Vector3;
        newUpVec: any;
    };
    scaleOfZNearAndZFar: number;
    static readonly componentTID: ComponentTID;
}

import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import { MiscUtil } from "../misc/MiscUtil";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import ComponentRepository from "../core/ComponentRepository";
import Vector3 from "../math/Vector3";
import MutableVector4 from "../math/MutableVector4";
import MutableVector3 from "../math/MutableVector3";
import { MathUtil } from "../math/MathUtil";
import Matrix33 from "../math/Matrix33";
import CameraComponent from "./CameraComponent";
import MutableMatrix33 from "../math/MutableMatrix33";
import TransformComponent from "./TransformComponent";
import { ProcessStage } from "../definitions/ProcessStage";
import Entity from "../core/Entity";
import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";

declare var window: any;

export default class CameraControllerComponent extends Component {
  private __isKeyUp = false;
  private __movedMouseYOnCanvas = -1;
  private __movedMouseXOnCanvas = -1;
  private __clickedMouseYOnCanvas = -1;
  private __clickedMouseXOnCanvas = -1;
  private __mouse_translate_y = 0;
  private __mouse_translate_x = 0;
  private __efficiency = 1;
  private __lengthOfCenterToEye = 1;
  private __foyvBias = 1.0;
  private __scaleOfTraslation = 5.0;
  private __mouseTranslateVec = MutableVector3.zero();
  private __newEyeToCenterVec = MutableVector3.zero();
  private __newUpVec = MutableVector3.zero();
  private __newTangentVec = MutableVector3.zero();
  private __verticalAngleThrethold = 0;
  private __verticalAngleOfVectors = 0;
  private __isForceGrab = false;
  private __isSymmetryMode = false;
  public eventTargetDom?: HTMLElement;
  private __doResetWhenCameraSettingChanged = false;
  private __rot_bgn_x = 0;
  private __rot_bgn_y = 0;
  private __rot_x = 0;
  private __rot_y = 0;
  private __wheel_y = 1;
  private __eyeVec = MutableVector3.zero();
  private __centerVec = MutableVector3.zero();
  private __upVec = MutableVector3.zero();
  private __shiftCameraTo = MutableVector3.zero();
  private __lengthCenterToCorner = 0.5;
  private __cameraComponent?: CameraComponent;
  private __targetEntity?:Entity;
  private __lengthCameraToObject = 1;
  private __scaleOfLengthCameraToCenter = 1;
  private __zFarAdjustingFactorBasedOnAABB = 2.0;
  private __scaleOfZNearAndZFar = 5000;
  private __doPreventDefault = false;

  private __pinchInOutInitDistance? = null;
  private __pinchInOutFinalDistance? = null;
  private __pinchInOutStarted = false

  private static returnVector3Eye = MutableVector3.zero();
  private static returnVector3Center = MutableVector3.zero();
  private static returnVector3Up = MutableVector3.zero();

  private __maximum_y?: number;
  private __minimum_y?: number;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.registerEventListeners();
  }

  set zFarAdjustingFactorBasedOnAABB(value: number) {
    this.__zFarAdjustingFactorBasedOnAABB = value;
  }

  get zFarAdjustingFactorBasedOnAABB() {
    return this.__zFarAdjustingFactorBasedOnAABB;
  }

  setTarget(targetEntity: Entity) {
    this.__targetEntity = targetEntity;
  }

  getTarget(): Entity|undefined {
    return this.__targetEntity;
  }

  set doPreventDefault(flag: boolean) {
    this.__doPreventDefault = flag;
  }

  get doPreventDefault() {
    return this.__doPreventDefault;
  }

  $create() {
    this.__cameraComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, CameraComponent) as CameraComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  __mouseUp(evt: any) {
    this.__isKeyUp = true;
    this.__movedMouseYOnCanvas = -1;
    this.__movedMouseXOnCanvas = -1;
  }

  __mouseDown(evt: any) {
    //this.__tryToPreventDefault(evt);
//    evt.stopPropagation();

    let rect = evt.target!.getBoundingClientRect();
    let clientX = null;
    let clientY = null;
    if (evt.clientX) {
      clientX = evt.clientX;
      clientY = evt.clientY;
    } else {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    }
    this.__clickedMouseXOnCanvas = clientX - rect.left;
    this.__clickedMouseYOnCanvas = clientY - rect.top;
    this.__movedMouseYOnCanvas = -1;
    this.__movedMouseXOnCanvas = -1;
    this.__rot_bgn_x = this.__rot_x;
    this.__rot_bgn_y = this.__rot_y;

    this.__isKeyUp = false;

    if (typeof evt.buttons !== "undefined") {
//      this.updateCamera();
    }
    return false;
  }

  __mouseMove(evt: any) {
    //this.__tryToPreventDefault(evt);
    //evt.stopPropagation();

    if (this.__isKeyUp) {
      return;
    }

    let rect = evt.target.getBoundingClientRect();
    let clientX = null;
    let clientY = null;
    if (evt.clientX) {
      clientX = evt.clientX;
      clientY = evt.clientY;
    } else {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    }
    this.__movedMouseXOnCanvas = clientX - rect.left;
    this.__movedMouseYOnCanvas = clientY - rect.top;

    if (typeof evt.buttons !== "undefined") {
      let data = evt.buttons;
      let button_l = data & 0x0001 ? true : false;
      let button_c = data & 0x0004 ? true : false;
      if (button_c) {
        this.__mouse_translate_y =
          ((this.__movedMouseYOnCanvas - this.__clickedMouseYOnCanvas) / 1000) *
          this.__efficiency;
        this.__mouse_translate_x =
          ((this.__movedMouseXOnCanvas - this.__clickedMouseXOnCanvas) / 1000) *
          this.__efficiency;

        let scale =
          this.__lengthOfCenterToEye *
          this.__foyvBias *
          this.__scaleOfTraslation;
        if (evt.shiftKey) {
          this.__mouseTranslateVec = Vector3.add(
            this.__mouseTranslateVec,
            MutableVector3.normalize(this.__newEyeToCenterVec)
              .multiply(-this.__mouse_translate_y)
              .multiply(scale)
          );
        } else {
          this.__mouseTranslateVec = Vector3.add(
            this.__mouseTranslateVec,
            MutableVector3.normalize(this.__newUpVec)
              .multiply(this.__mouse_translate_y)
              .multiply(scale)
          );
        }
        this.__mouseTranslateVec = Vector3.add(
          this.__mouseTranslateVec,
          MutableVector3.normalize(this.__newTangentVec)
            .multiply(this.__mouse_translate_x)
            .multiply(scale)
        );

        this.__clickedMouseYOnCanvas = this.__movedMouseYOnCanvas;
        this.__clickedMouseXOnCanvas = this.__movedMouseXOnCanvas;
      }

//      this.updateCamera();

      if (!button_l) {
        return;
      }
    }

    // calc rotation angle
    let delta_y =
      (this.__movedMouseYOnCanvas - this.__clickedMouseYOnCanvas) *
      this.__efficiency;
    let delta_x =
      (this.__movedMouseXOnCanvas - this.__clickedMouseXOnCanvas) *
      this.__efficiency;
    this.__rot_y = this.__rot_bgn_y - delta_y;
    this.__rot_x = this.__rot_bgn_x - delta_x;

    // check if rotation angle is within range
    if (
      this.__verticalAngleThrethold - this.__verticalAngleOfVectors <
      this.__rot_y
    ) {
      //        this._rot_y -= this._rot_y - (this._verticalAngleThrethold - this._verticalAngleOfVectors);
    }

    if (
      this.__rot_y <
      -this.__verticalAngleThrethold + this.__verticalAngleOfVectors
    ) {
      //       this._rot_y += this._rot_y - (this._verticalAngleThrethold - this._verticalAngleOfVectors);
    }
    if(this.__maximum_y != null && this.__rot_y > this.__maximum_y){
      this.__rot_y = this.__maximum_y
    }
    if(this.__minimum_y != null && this.__rot_y < this.__minimum_y){
      this.__rot_y = this.__minimum_y
    }
//    this.updateCamera();
  };

  set maximumY(maximum_y: number) {
    this.__maximum_y = maximum_y;
  }
  set minimumY(minimum_y: number) {
    this.__minimum_y = minimum_y;
  }

  private __tryToPreventDefault(evt:Event) {
    if (this.__doPreventDefault) {
      evt.preventDefault();
    }
  }

  __mouseWheel(evt: WheelEvent) {
    this.__tryToPreventDefault(evt);

    this.dolly += evt.deltaY / 600;
  };

  __contexMenu(evt: Event) {
    if (evt.preventDefault) {
      this.__tryToPreventDefault(evt);
    } else {
      evt.returnValue = false;
    }
  };

  __mouseDblClick(evt: MouseEvent) {
    if (evt.shiftKey) {
      this.__mouseTranslateVec = new MutableVector3(0, 0, 0);
    } else if (evt.ctrlKey) {
      this.__rot_y = 0;
      this.__rot_x = 0;
      this.__rot_bgn_y = 0;
      this.__rot_bgn_x = 0;
    }
  };

  resetDolly() {
    this.dolly = 1;
  }

  set dolly(value) {
    this.__wheel_y = value;
    this.__wheel_y = Math.min(this.__wheel_y, 3);
    this.__wheel_y = Math.max(this.__wheel_y, 0.01);

  }

  get dolly() {
    return this.__wheel_y;
  }

  private getDistance (event){
    const touches = event.changedTouches ;

    const x1 = touches[0].pageX
    const y1 = touches[0].pageY
    const x2 = touches[1].pageX
    const y2 = touches[1].pageY

    return Math.sqrt(Math.pow(x2 - x1 , 2) + Math.pow(y2 - y1 , 2))
  }

  __pinchInOutStart(event){
    this.__pinchInOutStarted = true
  }


  d = []
  __pinchInOut(event){
    const touches = event.changedTouches ;
    if (!this.__pinchInOutStarted || touches.length < 2 ) {
      return 
    }
    if(!this.__pinchInOutInitDistance){
        this.__pinchInOutInitDistance  = this.getDistance(event)
    }

    this.d.push(this.getDistance(event))
    this.__pinchInOutFinalDistance = this.getDistance(event)
  }

  __pinchInOutEnd(event){
    if(!this.__pinchInOutFinalDistance || !this.__pinchInOutInitDistance ){
      return
    }
    if(this.d.length == 0){
      return
    }
    const pinchInOutFinalDistance = this.__pinchInOutFinalDistance 
    const pinchInOutInitDistance  = this.__pinchInOutInitDistance 
    
    let max = 0
    let min = 1000000000000000000000000
    let maxIndex = 0
    let minIndex = 0
    this.d.forEach((d , i)=>{
        if(d < min){
            min = d
            minIndex = i
        }
        if(d > max){
            max = d
            maxIndex = i
        }
    })
    const ratio = minIndex > maxIndex ? min / max : max / min

    this.dolly *= 1 / ratio
    this.d = []
  }

  registerEventListeners(eventTargetDom = document) {
    if (eventTargetDom) {
      if ("ontouchend" in document) {
        eventTargetDom.addEventListener("touchstart", this.__mouseDown.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("touchend", this.__mouseUp.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("touchmove", this.__mouseMove.bind(this), {passive: !this.__doPreventDefault});

        eventTargetDom.addEventListener("touchstart" , this.__pinchInOutStart.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("touchmove"  , this.__pinchInOut.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("touchend"   , this.__pinchInOutEnd.bind(this), {passive: !this.__doPreventDefault});
      }
      if ("onmouseup" in document) {
        eventTargetDom.addEventListener("mousedown", this.__mouseDown.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("mouseup", this.__mouseUp.bind(this), {passive: !this.__doPreventDefault});
        eventTargetDom.addEventListener("mousemove", this.__mouseMove.bind(this), {passive: !this.__doPreventDefault});
      }

      if (window.WheelEvent) {
        eventTargetDom.addEventListener("wheel", this.__mouseWheel.bind(this), {passive: !this.__doPreventDefault});
      }

      eventTargetDom.addEventListener("contextmenu", this.__contexMenu.bind(this), {passive: !this.__doPreventDefault});
      eventTargetDom.addEventListener("dblclick", this.__mouseDblClick.bind(this), {passive: !this.__doPreventDefault});
    }
  }

  unregisterEventListeners(eventTargetDom = document) {
    if (eventTargetDom) {
      if ("ontouchend" in document) {
        eventTargetDom.removeEventListener("touchstart", this.__mouseDown.bind(this));
        eventTargetDom.removeEventListener("touchend", this.__mouseUp.bind(this));
        (eventTargetDom as any).removeEventListener("touchmove", this.__mouseMove.bind(this));
      }
      if ("onmouseup" in document) {
        eventTargetDom.removeEventListener("mousedown", this.__mouseDown.bind(this));
        eventTargetDom.removeEventListener("mouseup", this.__mouseUp.bind(this));
        (eventTargetDom as any).removeEventListener("mousemove", this.__mouseMove.bind(this));
      }
      if (window.WheelEvent) {
        eventTargetDom.removeEventListener("wheel", this.__mouseWheel.bind(this));
      }
      eventTargetDom.removeEventListener(
        "contextmenu",
        this.__contexMenu.bind(this),
        false
      );
      eventTargetDom.removeEventListener("dblclick", this.__mouseDblClick.bind(this));
    }
  }

  __getFovyFromCamera(camera: CameraComponent) {
    if (camera.fovy) {
      return camera.fovy;
    } else {
      return MathUtil.radianToDegree(
        2 * Math.atan(Math.abs(camera.top - camera.bottom) / (2 * camera.zNear))
      );
    }
  }

  $logic() {
    const data0 = this.__updateTargeting(this.__cameraComponent!);
    const eye = data0.newEyeVec;
    const center = data0.newCenterVec;
    const up = data0.newUpVec;


    const data = this.__convert(this.__cameraComponent!, eye, center, up);
    const cc = this.__cameraComponent!;
    cc.eyeInner = data.newEyeVec;
    cc.directionInner = data.newCenterVec;
    cc.upInner = data.newUpVec;
    cc.zNearInner = data.newZNear;
    cc.zFarInner = data.newZFar;
    cc.leftInner = data.newLeft;
    cc.rightInner = data.newRight;
    cc.topInner = data.newTop;
    cc.bottomInner = data.newBottom;

    cc.fovyInner = data.fovy;
  }

  __convert(camera: CameraComponent, eye: Vector3, center: Vector3, up: Vector3) {
    let newEyeVec = null;
    let newCenterVec: MutableVector3;
    let newUpVec = null;

    if (this.__isKeyUp || !this.__isForceGrab) {
      this.__eyeVec = Vector3.add(eye, this.__shiftCameraTo);
      this.__centerVec = Vector3.add(center, this.__shiftCameraTo);
      this.__upVec = new MutableVector3(up);
    }

    let fovy = this.__getFovyFromCamera(camera);

    let centerToEyeVec = Vector3.subtract(
      this.__eyeVec,
      this.__centerVec
    );
    centerToEyeVec = Vector3.multiply(centerToEyeVec,
      (this.__wheel_y * 1.0) / Math.tan(MathUtil.degreeToRadian(fovy / 2.0))
    );
    this.__lengthOfCenterToEye = centerToEyeVec.length();
    if (this.__isSymmetryMode) {
      let horizontalAngleOfVectors = Vector3.angleOfVectors(
        new Vector3(centerToEyeVec.x, 0, centerToEyeVec.z),
        new Vector3(0, 0, 1)
      );
      let horizontalSign = Vector3.cross(
        new Vector3(centerToEyeVec.x, 0, centerToEyeVec.z),
        new Vector3(0, 0, 1)
      ).y;
      if (horizontalSign >= 0) {
        horizontalSign = 1;
      } else {
        horizontalSign = -1;
      }
      horizontalAngleOfVectors *= horizontalSign;
      let rotateM_Reset = MutableMatrix33.rotateY(MathUtil.degreeToRadian(horizontalAngleOfVectors));
      let rotateM_X = MutableMatrix33.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      let rotateM_Y = MutableMatrix33.rotateY(MathUtil.degreeToRadian(this.__rot_x));
      let rotateM_Revert = MutableMatrix33.rotateY(MathUtil.degreeToRadian(-horizontalAngleOfVectors));
      let rotateM = MutableMatrix33.multiply(
        rotateM_Revert,
        MutableMatrix33.multiply(
          rotateM_Y,
          MutableMatrix33.multiply(rotateM_X, rotateM_Reset)
        )
      );

      newUpVec = rotateM.multiplyVector(this.__upVec);
      this.__newUpVec = newUpVec;
      newEyeVec = rotateM.multiplyVector(centerToEyeVec).add(this.__centerVec);
      newCenterVec = this.__centerVec.clone();
      this.__newEyeToCenterVec = Vector3.subtract(newCenterVec, newEyeVec);
      this.__newTangentVec = Vector3.cross(
        this.__newUpVec,
        this.__newEyeToCenterVec
      );

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);

      let horizonResetVec = rotateM_Reset.multiplyVector(centerToEyeVec);
      this.__verticalAngleOfVectors = Vector3.angleOfVectors(
        horizonResetVec,
        new Vector3(0, 0, 1)
      );
      let verticalSign = Vector3.cross(horizonResetVec, new Vector3(0, 0, 1)).x;
      if (verticalSign >= 0) {
        verticalSign = 1;
      } else {
        verticalSign = -1;
      }
      //this._verticalAngleOfVectors *= verticalSign;
    } else {
      let rotateM_X = Matrix33.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      let rotateM_Y = Matrix33.rotateY(MathUtil.degreeToRadian(this.__rot_x));
      let rotateM = Matrix33.multiply(rotateM_Y, rotateM_X);

      newUpVec = rotateM.multiplyVector(this.__upVec);
      this.__newUpVec = newUpVec;
      newEyeVec = Vector3.add(rotateM.multiplyVector(centerToEyeVec), this.__centerVec);
      newCenterVec = this.__centerVec.clone();
      this.__newEyeToCenterVec = Vector3.subtract(newCenterVec, newEyeVec);
      this.__newTangentVec = Vector3.cross(
        this.__newUpVec,
        this.__newEyeToCenterVec
      );

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);
    }
    const newCenterToEyeLength = Vector3.lengthBtw(newEyeVec, newCenterVec);

    let newLeft = camera.left;
    let newRight = camera.right;
    let newTop = camera.top;
    let newBottom = camera.bottom;
    let newZNear = camera.zNear;
    let newZFar = camera.zFar;
    let ratio = 1;

    if (this.__targetEntity) {
      newZFar =
        camera.zNear + Vector3.subtract(newCenterVec, newEyeVec).length();
      newZFar +=
        this.__getTargetAABB().lengthCenterToCorner *
        this.__zFarAdjustingFactorBasedOnAABB;
    }

    if (typeof newLeft !== "undefined") {
      if (typeof this.__lengthCenterToCorner !== "undefined") {
        //let aabb = this.__getTargetAABB();
        ratio = newZFar / camera.zNear;

        const minRatio = this.__scaleOfZNearAndZFar;
        ratio /= minRatio;

        let scale = ratio;
        newLeft *= scale;
        newRight *= scale;
        newTop *= scale;
        newBottom *= scale;
//        newZFar *= scale;
        newZNear *= scale;
      }
    }

    this.__foyvBias = Math.tan(MathUtil.degreeToRadian(fovy / 2.0));

    return {
      newEyeVec,
      newCenterVec,
      newUpVec,
      newZNear,
      newZFar,
      newLeft,
      newRight,
      newTop,
      newBottom,
      fovy
    };
  }

  __getTargetAABB() {
    return this.__targetEntity!.getSceneGraph().worldAABB;
  }

  __updateTargeting(camera: CameraComponent) {

    const eyeVec = camera.eye;
    const centerVec = camera.direction;
    const upVec = (camera as any)._up;
    const fovy = camera.fovy;

    if (this.__targetEntity == null) {
      return {newEyeVec: eyeVec, newCenterVec: centerVec, newUpVec: upVec};
    }

    let targetAABB = this.__getTargetAABB()

    const cameraZNearPlaneHeight = camera.top - camera.bottom;
    this.__lengthCenterToCorner = targetAABB.lengthCenterToCorner;
    this.__lengthCameraToObject =
      (targetAABB.lengthCenterToCorner / Math.sin((fovy * Math.PI) / 180 / 2)) *
      this.__scaleOfLengthCameraToCenter;

    let newCenterVec = targetAABB.centerPoint;

    let centerToCameraVec = Vector3.subtract(eyeVec, centerVec);
    let centerToCameraVecNormalized = Vector3.normalize(centerToCameraVec);

    let newEyeVec = Vector3.add(Vector3.multiply(
      centerToCameraVecNormalized,
      this.__lengthCameraToObject
    ), newCenterVec);

    let newUpVec = null;
    if (camera.entity.getSceneGraph()) {
      const sg = camera.entity.getSceneGraph();
      let mat = Matrix44.invert(sg.worldMatrixInner);

      mat.multiplyVector3To(
        newEyeVec, CameraControllerComponent.returnVector3Eye
      );
      newEyeVec = CameraControllerComponent.returnVector3Eye as Vector3;

      mat.multiplyVector3To(
        newCenterVec, CameraControllerComponent.returnVector3Center
      );
      newCenterVec = CameraControllerComponent.returnVector3Center as Vector3;

      mat.multiplyVector3To(
        upVec, CameraControllerComponent.returnVector3Up
      );
      newUpVec = CameraControllerComponent.returnVector3Up as Vector3;

    } else {
      newUpVec = upVec;
    }

    return {newEyeVec, newCenterVec, newUpVec};
  }

  set scaleOfZNearAndZFar(value: number) {
    this.__scaleOfZNearAndZFar = value;
  }

  get scaleOfZNearAndZFar() {
    return this.__scaleOfZNearAndZFar;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }
}
ComponentRepository.registerComponentClass(CameraControllerComponent);

import CameraComponent from "../components/CameraComponent";
import AABB from "../math/AABB";
import Vector3 from "../math/Vector3";

export default abstract class AbstractCameraController {
  public zNearLimitFactor = 10; // must be more than 0
  public zFarScalingFactor = 10000;
  public autoCalculateZNearAndZFar = true;

  constructor() {
  }

  protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3, targetAABB: AABB) {
    if (this.autoCalculateZNearAndZFar) {
      const lengthOfCenterToEye = Vector3.lengthBtw(eyePosition, targetAABB.centerPoint);
      const sizeMin = Math.min(targetAABB.sizeX, targetAABB.sizeY, targetAABB.sizeZ);

      // avoid minLimit equals to 0
      const halfSizeMinNon0 = sizeMin > 0 ? sizeMin / 2 :
        Math.min(
          targetAABB.sizeX > 0 ? targetAABB.sizeX : Infinity,
          targetAABB.sizeY > 0 ? targetAABB.sizeY : Infinity,
          targetAABB.sizeZ > 0 ? targetAABB.sizeZ : Infinity
        ) / 2;

      const minLimit = halfSizeMinNon0 / this.zNearLimitFactor;

      if (lengthOfCenterToEye - targetAABB.lengthCenterToCorner < minLimit) {
        camera.zNearInner = minLimit
        return;
      }

      // calc cos between eyeToTarget and eye direction
      const eyeToTargetDirectionX = targetAABB.centerPoint.v[0] - eyePosition.v[0];
      const eyeToTargetDirectionY = targetAABB.centerPoint.v[1] - eyePosition.v[1];
      const eyeToTargetDirectionZ = targetAABB.centerPoint.v[2] - eyePosition.v[2];
      const cos = (eyeToTargetDirectionX * eyeDirection.v[0] + eyeToTargetDirectionY * eyeDirection.v[1] + eyeToTargetDirectionZ * eyeDirection.v[2])
        / (Math.hypot(eyeToTargetDirectionX, eyeToTargetDirectionY, eyeToTargetDirectionZ) * eyeDirection.length());

      camera.zNearInner = Math.max(lengthOfCenterToEye * cos - targetAABB.lengthCenterToCorner, minLimit);
    } else {
      camera.zNearInner = camera.zNear;
    }
  }

  protected _calcZFarInner(camera: CameraComponent) {
    if (this.autoCalculateZNearAndZFar) {
      camera.zFarInner = camera.zNearInner * this.zFarScalingFactor;
    } else {
      camera.zNearInner = camera.zFar;
    }
  }
}

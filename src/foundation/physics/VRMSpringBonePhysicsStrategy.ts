import Vector3 from "../math/Vector3";
import TransformComponent from "../components/TransformComponent";
import MutableVector3 from "../math/MutableVector3";
import SceneGraphComponent from "../components/SceneGraphComponent";
import Quaternion from "../math/Quaternion";
import { thisExpression } from "@babel/types";
import SphereCollider from "./SphereCollider";
import Matrix44 from "../math/Matrix44";
import PhysicsComponent from "../components/PhysicsComponent";
import Time from "../misc/Time";
import Entity from "../core/Entity";
import VRMSpringBoneGroup from "./VRMSpringBoneGroup";
import VRMColliderGroup from "./VRMColliderGroup";
import { Index } from "../../types/CommonTypes";

export default class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();
  private static __boneGroups: VRMSpringBoneGroup[] = [];
  private static __colliderGroups: Map<Index, VRMColliderGroup> = new Map();

  // for bone
  private __transform?: SceneGraphComponent;
  private __boneAxis = Vector3.zero();
  private __length = 0;
  private __currentTail = Vector3.zero();
  private __prevTail = Vector3.zero();
  private __localDir = Vector3.zero();
  private __localRotation = new Quaternion(0, 0, 0, 1);
  private __radius = 0;
  private __initalized = false;
  private __localChildPosition = Vector3.zero();

  constructor() {
  }

  initialize(transform: SceneGraphComponent, localChildPosition: Vector3, center?: SceneGraphComponent) {
    this.__transform = transform;
    const worldChildPosition = transform.getWorldPositionOf(localChildPosition);
    this.__currentTail = (center != null) ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
    this.__prevTail = this.__currentTail;
    this.__localRotation = transform.entity.getTransform().quaternion;
    this.__boneAxis = Vector3.normalize(localChildPosition);
    // this.__boneAxis = Vector3.normalize(Vector3.subtract(this.__currentTail, transform.worldPosition));
    this.__length = localChildPosition.length();
    this.__localChildPosition = localChildPosition;

    this.__initalized = true;
  }



  get isInitialized() {
    return this.__initalized;
  }

  get head(): SceneGraphComponent {
    return this.__transform!;
  }

  get tail(): Vector3 {
    Vector3.multiplyTo(this.__boneAxis, this.__length, VRMSpringBonePhysicsStrategy.__tmp_vec3);
    this.__transform!.worldMatrixInner.multiplyVector3To(VRMSpringBonePhysicsStrategy.__tmp_vec3, VRMSpringBonePhysicsStrategy.__tmp_vec3_2);

    return VRMSpringBonePhysicsStrategy.__tmp_vec3_2;
  }

  get parentRotation() {
    // return (this.__transform!.parent != null) ? this.__transform!.parent!.entity.getTransform().quaternion : new Quaternion(0, 0, 0, 1);
    return (this.__transform!.parent != null) ? Quaternion.fromMatrix(this.__transform!.parent!.worldMatrixInner): new Quaternion(0, 0, 0, 1);
  }


  static update() {
    for (let boneGroup of this.__boneGroups) {
      this.updateInner(boneGroup.rootBones, boneGroup);
    }
  }

  static updateInner(sceneGraphs: SceneGraphComponent[], boneGroup: VRMSpringBoneGroup) {
    const dragForce = boneGroup.dragForce;
    const stiffnessForce = boneGroup.stiffnessForce * Time.lastTickTimeInterval * 1;
    const external = Vector3.multiply(boneGroup.gravityDir, boneGroup.gravityPower * Time.lastTickTimeInterval * 1);
    let center: SceneGraphComponent|undefined = void 0;

    const collisionGroups = VRMSpringBonePhysicsStrategy.getColliderGroups(boneGroup.colliderGroupIndices);

    for (let sg of sceneGraphs) {
      const physicsComponent = sg.entity.getPhysics();
      if (physicsComponent) {
        const strategy = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
        strategy.update(stiffnessForce, dragForce, external, collisionGroups, center);
        const children = sg.children;
        if (children) {
          this.updateInner(children, boneGroup);
        }
      }
    }
  }

  static initialize(sceneGraph: SceneGraphComponent) {
    const children = sceneGraph.children;

    const physicsComponent = sceneGraph.entity.getPhysics();
    const vrmSpringBone = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
    if (children.length > 0) {
      const transform = children[0].entity.getTransform();
      vrmSpringBone.initialize(sceneGraph,
        //   new Vector3(
        //   transform.translate.x * transform.scale.x,
        //   transform.translate.y * transform.scale.y,
        //   transform.translate.z * transform.scale.z
        // ),
        Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(children[0].worldPosition),
        void 0);
    } else {
      const delta = Vector3.subtract(sceneGraph.worldPosition, sceneGraph.parent!.worldPosition);
      let childPosition = new Vector3(1, 1, 1);
      if (delta.lengthSquared() > 0) {
        childPosition = Vector3.add(sceneGraph.worldPosition, Vector3.multiply(Vector3.normalize(delta), 0.07));
      }
      vrmSpringBone.initialize(sceneGraph,
        Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(childPosition),
        void 0);
    }
  }

  calcParentDeltaRecursivle(sceneGraph: SceneGraphComponent) {
    const delta = Vector3.subtract(sceneGraph.worldPosition, sceneGraph.parent!.worldPosition);

  }

  update(stiffnessForce: number, dragForce: number, external: Vector3, collisionGroups: VRMColliderGroup[], center?: SceneGraphComponent) {

    const currentTail = (center != null) ? center!.getWorldPositionOf(this.__currentTail) : this.__currentTail;
    const prevTail = (center != null) ? center!.getWorldPositionOf(this.__prevTail) : this.__prevTail;

    const delta = MutableVector3.multiply(Vector3.subtract(currentTail, prevTail), 1.0 - dragForce);
    const dist = Vector3.multiply((Quaternion.multiply(this.parentRotation, this.__localRotation)).multiplyVector3(this.__boneAxis), stiffnessForce);
    // const dist = Vector3.multiply((this.__localRotation).multiplyVector3(this.__boneAxis), stiffnessForce);
    // const dist = Vector3.zero();
    let nextTail = Vector3.add(Vector3.add(Vector3.add(currentTail, delta), (dist as any as Vector3)), external);

    const tmp = Vector3.subtract(nextTail, this.__transform!.worldPosition);
    nextTail = Vector3.add(this.__transform!.worldPosition, Vector3.multiply(Vector3.normalize(tmp), this.__length));

    nextTail = this.collision(collisionGroups, nextTail);

    this.__prevTail = (center != null) ? center!.getLocalPositionOf(currentTail) : currentTail;
    this.__currentTail = (center != null) ? center!.getLocalPositionOf(nextTail) : nextTail;

    // const resultRotation = this.applyRotation(nextTail);
    // this.head.entity.getTransform().quaternion = resultRotation;
    // this.head.entity.getTransform().matrix = Matrix44.identity();
    // this.head.entity.getTransform().translate = this.__transform!.getLocalPositionOf(currentTail);
    if (this.head.children.length > 0) {
      // this.head.children[0].entity.getTransform().matrix = Matrix44.identity();
      this.head.children[0].entity.getTransform().translate = this.__transform!.getLocalPositionOf(nextTail);
  //   // this.head.children[0].entity.getTransform().quaternion = resultRotation;
    }

    // VRMSpringBonePhysicsStrategy.initialize(this.__transform!);
  }

  applyRotation(nextTail: Vector3) {
    const rotation = Quaternion.multiply(this.parentRotation, this.__localRotation);
    // const rotation = this.__localRotation;
    const result = Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), Vector3.subtract(nextTail, this.__transform!.worldPosition)), rotation);
    // const result = Quaternion.lookFromTo(this.__boneAxis, Vector3.subtract(nextTail, this.__transform!.worldPosition));
    const delta = Vector3.subtract(nextTail, this.__transform!.worldPosition);
    const boneAxis = this.__boneAxis;
    // const result = Quaternion.lookForward(Vector3.subtract(nextTail, this.__transform!.worldPosition));
    // const result = Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), Vector3.normalize(delta)), this.__localRotation);
    // const result = new Quaternion(0,0,0,1);
    return result;
  }

  collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3) {
    for (let collisoinGroup of collisionGroups) {
      for (let collider of collisoinGroup.colliders) {
        const r = this.__radius + collider.radius;
        if (Vector3.lengthSquared(Vector3.subtract(nextTail, collider.position)) <= (r * r)) {
          var normal = Vector3.subtract(nextTail, collider.position).normalize();
          var posFromCollider = Vector3.multiply(Vector3.add(collider.position, normal), this.__radius + collider.radius);
          nextTail = Vector3.add(this.__transform!.worldPosition, Vector3.multiply(Vector3.subtract(posFromCollider, this.__transform!.worldPosition).normalize(), this.__length));
        }
      }
    }


    return nextTail;
  }

  static setBoneGroups(sgs: VRMSpringBoneGroup[]) {
    this.__boneGroups = sgs;
  }

  static addColliderGroup(index: Index, group: VRMColliderGroup) {
    this.__colliderGroups.set(index, group);
  }

  static getColliderGroups(indices: Index[]) {
    const colliderGroups: VRMColliderGroup[] = [];
    for (let index of indices) {
      colliderGroups.push(this.__colliderGroups.get(index)!);
    }
    return colliderGroups;
  }
}

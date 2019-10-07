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
import PhysicsStrategy from "./PhysicsStrategy";
import MutableQuaternion from "../math/MutableQuaterion";

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
  private __localRotation = new Quaternion(0, 0, 0, 1);
  private __initalized = false;

  constructor() {
  }

  initialize(transform: SceneGraphComponent, localChildPosition: Vector3, center?: SceneGraphComponent) {
    this.__transform = transform;
    const worldChildPosition = transform.getWorldPositionOf(localChildPosition);
    this.__currentTail = (center != null) ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
    this.__prevTail = this.__currentTail;
    this.__localRotation = transform.entity.getTransform().quaternion;
    if (Vector3.lengthSquared(localChildPosition) != 0.0) {
      this.__boneAxis = Vector3.normalize(localChildPosition);
    } else {
      this.__boneAxis = new Vector3(1.0, 0.0, 0.0);
    }
    this.__length = localChildPosition.length();

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
    return (this.__transform != null && this.__transform.parent != null) ? Quaternion.fromMatrix(this.__transform.parent.worldMatrixInner) : new Quaternion(0, 0, 0, 1);
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
    let center: SceneGraphComponent | undefined = void 0;

    const collisionGroups = VRMSpringBonePhysicsStrategy.getColliderGroups(boneGroup.colliderGroupIndices);

    for (let sg of sceneGraphs) {
      const physicsComponent = sg.entity.getPhysics();
      if (physicsComponent) {
        const strategy = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
        strategy.update(stiffnessForce, dragForce, external, collisionGroups, boneGroup.hitRadius, center);
        const children = sg.children;
        if (children) {
          this.updateInner(children, boneGroup);
        }
      }
    }
  }

  static initialize(sceneGraph: SceneGraphComponent) {


    //   if (parent.childCount == 0) {
    //     var delta = parent.position - parent.parent.position;
    //     var childPosition = parent.position + delta.normalized * 0.07f;
    //     m_verlet.Add (new VRMSpringBoneLogic (center, parent, parent.worldToLocalMatrix.MultiplyPoint (childPosition)));
    // } else {
    //     var firstChild = GetChildren (parent).First ();
    //     var localPosition = firstChild.localPosition;
    //     var scale = firstChild.lossyScale;
    //     m_verlet.Add (new VRMSpringBoneLogic (center, parent,
    //         new Vector3 (
    //             localPosition.x * scale.x,
    //             localPosition.y * scale.y,
    //             localPosition.z * scale.z
    //         )));
    // }

    // foreach (Transform child in parent) {
    //     SetupRecursive (center, child);
    // }

    const children = sceneGraph.children;

    const physicsComponent = sceneGraph.entity.getPhysics();
    const vrmSpringBone = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
    if (children.length > 0) {
      const transform = children[0].entity.getTransform();
      const localPosition = transform.translate;
      const absoluteScale = transform.absoluteScale;


      console.log("local:" + localPosition.x * absoluteScale.x, localPosition.y * absoluteScale.y, localPosition.z * absoluteScale.z);

      vrmSpringBone.initialize(sceneGraph,
        new Vector3(
          localPosition.x * absoluteScale.x,
          localPosition.y * absoluteScale.y,
          localPosition.z * absoluteScale.z
        ),
        void 0);
    } else {
      const childPosition = MutableVector3.zero();
      childPosition.copyComponents(sceneGraph.worldPosition).subtract(sceneGraph.parent!.worldPosition);
      console.log("sceneGraph.worldPosition:" + sceneGraph.worldPosition);
      console.log("sceneGraph.parent!.worldPosition:" + sceneGraph.parent!.worldPosition);

      console.log("sceneGraph.localPosition:" + Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(sceneGraph.worldPosition));
      console.log("sceneGraph.parent!.localPosition:" + Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(sceneGraph.parent!.worldPosition));


      if (childPosition.lengthSquared() != 0.0) {
        childPosition.normalize().multiply(0.07);
      }
      childPosition.add(sceneGraph.worldPosition);


      console.log("childPosition:" + childPosition);
      console.log("childLocalPosition:" + Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(childPosition));

      vrmSpringBone.initialize(sceneGraph,
        Matrix44.invert(sceneGraph.worldMatrixInner).multiplyVector3(childPosition),
        // sceneGraph.entity.getTransform().translate,
        void 0);
    }
  }

  update(stiffnessForce: number, dragForce: number, external: Vector3, collisionGroups: VRMColliderGroup[], boneHitRadius: number, center?: SceneGraphComponent) {
    const currentTail = (center != null) ? center.getWorldPositionOf(this.__currentTail) : this.__currentTail;
    const prevTail = (center != null) ? center.getWorldPositionOf(this.__prevTail) : this.__prevTail;

    let nextTail = MutableVector3.zero();
    // const tmpMutableVector = MutableVector3.zero();

    // // verlet integral
    // const deltaCP = tmpMutableVector.copyComponents(currentTail).subtract(prevTail).multiply(1.0 - dragForce);
    // nextTail.add(currentTail).add(deltaCP);
    // const dist = tmpMutableVector.copyComponents((Quaternion.multiply(this.parentRotation, this.__localRotation)).multiplyVector3(this.__boneAxis));
    // dist.multiply(stiffnessForce);
    // nextTail.add(dist).add(external);

    // // enforce length
    const worldPosition = this.__transform!.worldPosition;
    // const movement = tmpMutableVector.copyComponents(nextTail).subtract(worldPosition);
    // if (movement.lengthSquared() === 0.0) {
    //   movement.zero();
    // } else {
    //   movement.normalize();
    //   movement.multiply(this.__length);
    // }
    // nextTail.copyComponents(worldPosition).add(movement);

    // // collision
    // nextTail.copyComponents(this.collision(collisionGroups, nextTail, boneHitRadius));


    nextTail.copyComponents(currentTail);
    this.__transform!.rotation = this.applyRotation(nextTail, worldPosition);

    this.__prevTail = (center != null) ? center.getLocalPositionOf(currentTail) : currentTail;
    this.__currentTail = (center != null) ? center.getLocalPositionOf(nextTail) : nextTail;

    this.head.entity.getTransform().quaternion = this.__transform!.rotation;

    // this.head.entity.getTransform().quaternion = resultRotation;
    // this.head.entity.getTransform().translate = this.__transform!.getLocalPositionOf(currentTail);
    if (this.head.children.length > 0) {
      // this.head.children[0].entity.getTransform().matrix = Matrix44.identity();


      // this.head.children[0].entity.getTransform().quaternion = this.__transform!.rotation;




      // this.head.children[0].entity.getTransform().translate = this.__transform!.getLocalPositionOf(nextTail);
      // this.head.children[0].entity.getTransform().translate = new Vector3(1, 0, 0);
      // this.head.children[0].entity.getTransform().quaternion = resultRotation;
    }

    // VRMSpringBonePhysicsStrategy.initialize(this.__transform!);
  }

  applyRotation(nextTail: Vector3, worldPosition: Vector3) {
    const delta = Vector3.subtract(nextTail, worldPosition);
    if (Vector3.lengthSquared(delta) === 0.0) {
      return new Quaternion(0.0, 0.0, 0.0, 1.0);
    }
    const rotation = Quaternion.multiply(this.parentRotation, this.__localRotation);

    const result = Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), delta), rotation);
    return result;



    // const rotation = Quaternion.multiply(this.parentRotation, this.__localRotation);
    // const rotation = this.__localRotation;
    // const result = Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), Vector3.subtract(nextTail, this.__transform!.worldPosition)), rotation);
    // const result = Quaternion.multiply(Quaternion.lookFromTo(this.__boneAxis, this.__transform!.getLocalPositionOf(nextTail)), rotation);
    // const result = Quaternion.lookFromTo(this.__boneAxis, Vector3.subtract(nextTail, this.__transform!.worldPosition));
    // const result = Quaternion.lookFromTo(this.__boneAxis, this.__transform!.getLocalPositionOf(nextTail));
    // const delta = Vector3.subtract(nextTail, this.__transform!.worldPosition);
    // const result = Quaternion.lookForward(Vector3.subtract(nextTail, this.__transform!.worldPosition));
    // const result = Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), Vector3.normalize(delta)), this.__localRotation);
    // const result = new Quaternion(0,0,0,1);
    return result;
  }

  collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number) {

    const posFromCollider = new MutableVector3(0, 0, 0);
    const delta = new MutableVector3(0, 0, 0);

    for (let collisionGroup of collisionGroups) {
      for (let collider of collisionGroup.colliders) {
        const r = boneHitRadius + collider.radius;
        const worldColiderPos = collisionGroup.baseSceneGraph!.getWorldPositionOf(collider.position);

        delta.copyComponents(nextTail);
        delta.subtract(worldColiderPos);

        if (r * r - delta.length() >= 0) {
          const normal = delta.normalize();

          posFromCollider.copyComponents(worldColiderPos);
          posFromCollider.add(normal.multiply(r));

          nextTail = Vector3.add(worldColiderPos, posFromCollider.subtract(worldColiderPos).normalize().multiply(this.__length));

          //     // ヒット。Colliderの半径方向に押し出す
          //     var normal = (nextTail - collider.Position).normalized;
          //     var posFromCollider = collider.Position + normal * (Radius + collider.Radius);
          //     // 長さをboneLengthに強制
          //     nextTail = m_transform.position + (posFromCollider - m_transform.position).normalized * m_length;

          // var resilienceVec = Vector3.multiply(Vector3.add(worldColiderPos, normal), deltaScalar);
          // nextTail = Vector3.add(nextTail, resilienceVec);

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

import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import FrameBuffer from "./FrameBuffer";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Vector4 from "../math/Vector4";
import ColorRgb from "../math/ColorRgb";
import CameraComponent from "../components/CameraComponent";

export default class RenderPass extends RnObject {
  private __entities: Entity[] = [];
  private __meshComponents?: MeshComponent[];
  private __frameBuffer?: FrameBuffer;
  private __viewport?: Vector4;
  public toClearColorBuffer = false;
  public toClearDepthBuffer = true;
  public toClearStencilBuffer = false;
  public clearColor = new Vector4(1, 1, 1, 1);
  public clearDepth = 1;
  public clearStencil = 0;
  public cameraComponent?: CameraComponent;

  constructor() {
    super();
  }

  addEntities(entities: Entity[]) {
    for (let entity of entities) {
      const sceneGraphComponent = entity.getSceneGraph();
      const collectedSgComponents = SceneGraphComponent.flattenHierarchy(sceneGraphComponent, false);
      const collectedEntities: Entity[] = collectedSgComponents.map((sg: SceneGraphComponent)=>{return sg.entity});

      // Eliminate duplicates
      const map: Map<EntityUID, Entity> = this.__entities.concat(collectedEntities).reduce((map: Map<EntityUID, Entity>, entity:Entity)=>{
        map.set(entity.entityUID, entity);
        return map;
      }, new Map());

      this.__entities = Array.from(map.values());
    }

    this.__meshComponents = void 0;
    this.__collectMeshComponents();
  }

  get entities(): Entity[] {
    return this.__entities;
  }

  clearEntities() {
    this.__meshComponents = void 0;
    this.__entities = [];
  }

  private __collectMeshComponents() {
    if (this.__meshComponents == null) {
      this.__meshComponents = [];
      this.__entities.filter((entity)=>{
        const meshComponent = entity.getComponent(MeshComponent) as MeshComponent;
        if (meshComponent) {
          this.__meshComponents!.push(meshComponent);
        }
      });
    }
  }

  get meshComponents() {
    this.__collectMeshComponents();
    return this.__meshComponents;
  }

  setFramebuffer(framebuffer: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    this.setViewport(new Vector4(0, 0, framebuffer.width, framebuffer.height));
  }

  getFramebuffer(): FrameBuffer|undefined {
    return this.__frameBuffer;
  }

  setViewport(vec: Vector4) {
    this.__viewport = vec;
  }

  getViewport() {
    return this.__viewport;
  }

}
import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
import RnObject from './RnObject';
/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entity can acquire those functions by having components on themselves.
 */
export default class Entity extends RnObject {
    private __entity_uid;
    static readonly invalidEntityUID = -1;
    private __isAlive;
    private static __instance;
    private __entityRepository;
    private __transformComponent?;
    private __sceneGraphComponent?;
    /**
     * The constructor of the Entity class.
     * When creating an Entity, use the createEntity method of the EntityRepository class
     * instead of directly calling this constructor.
     * @param entityUID The unique ID of the entity
     * @param isAlive Whether this entity alive or not
     * @param entityComponent The instance of EntityComponent (Dependency Injection)
     */
    constructor(entityUID: EntityUID, isAlive: Boolean, entityComponent: EntityRepository);
    /**
     * Get Unique ID of the entity.
     */
    readonly entityUID: number;
    /**
     * Get the component of the specified type that the entity has
     * @param componentType
     */
    getComponent(componentType: typeof Component): Component | null;
    /**
     * Get the TransformComponent of the entity.
     * It's a shortcut method of getComponent(TransformComponent).
     */
    getTransform(): TransformComponent;
    /**
     * Get the SceneGraphComponent of the entity.
     * It's a shortcut method of getComponent(SceneGraphComponent).
     */
    getSceneGraph(): SceneGraphComponent;
}

import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/TransformComponent';
import Vector3 from '../math/Vector3';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from '../components/SceneGraphComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent, SceneGraphComponent]);
  return entity;
}

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  const firstEntity = generateEntity();
  const entityRepository = EntityRepository.getInstance();
  const sceneGraphComponent = entityRepository.getComponentOfEntity(firstEntity.entityUID, SceneGraphComponent.componentTID);
  
  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});

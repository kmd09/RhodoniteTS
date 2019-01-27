import Component from "../core/Component";
import ComponentRepository from "../core/ComponentRepository";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { AnimationEnum, Animation } from "../definitions/Animation";
import { CompositionTypeEnum, CompositionType } from "../definitions/CompositionType";
import Quaternion from "../math/Quaternion";
import TransformComponent from "./TransformComponent";
import { ProcessStage } from "../definitions/ProcessStage";


type AnimationLine = {
    input: number[]
    output: any[],
    outputAttributeName: string,
    outputCompositionType: CompositionTypeEnum
    interpolationMethod: AnimationEnum
  }

export default class AnimationComponent extends Component {
  private __animationLine: {[s:string]: AnimationLine} = {};
  private __backupDefaultValues: {[s:string]: any} = {};
  public static globalTime: number = 0;
  public static isAnimating = true;
  private __transformComponent?: TransformComponent;
  private static __startInputValueOfAllComponent: number = Number.MAX_VALUE;
  private static __endInputValueOfAllComponent: number = - Number.MAX_VALUE;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.__currentProcessStage = ProcessStage.Create;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  setAnimation(animationAttributeName: string, animationInputArray: number[], animationOutputArray: any[], interpolation: AnimationEnum) {
//    console.log(animationAttributeName, animationInputArray, animationOutputArray);

    const line: AnimationLine = {
      input: animationInputArray,
      output: animationOutputArray,
      outputAttributeName: animationAttributeName,
      outputCompositionType: animationOutputArray[0].compositionType,
      interpolationMethod: interpolation
    };

    this.__animationLine[animationAttributeName] = line;
  }

  static lerp(start: any, end: any, ratio: number, compositionType: CompositionTypeEnum) {
    if (compositionType === CompositionType.Scalar) {
      return start * (1 - ratio) + end * ratio;
    } else {
      if (start instanceof Quaternion) {
        return Quaternion.qlerp(start, end, ratio);
      } else {
        const objectClass = start.constructor;
        return objectClass.add(objectClass.multiply(start, (1 - ratio)), objectClass.multiply(end, ratio));
      }
    }
  }

  static interpolate(inputArray: any[], outputArray: any[], input: number, compositionType: CompositionTypeEnum, method = Animation.Linear) {
    if (input < inputArray[0]) {
      return outputArray[0].clone(); // out of range!
    }
    if (inputArray[inputArray.length-1] <= input) {
      return outputArray[outputArray.length-1].clone(); // out of range!
    }

    if (method === Animation.Linear) {
      for (let i = 0; i<inputArray.length; i++) {
        if (typeof inputArray[i+1] === "undefined") {
          break;
        }
        if (inputArray[i] <= input && input < inputArray[i+1]) {
          let ratio = (input - inputArray[i]) / (inputArray[i+1] - inputArray[i]);
          let resultValue = this.lerp(outputArray[i].clone(), outputArray[i+1].clone(), ratio, compositionType);
          return resultValue;
        }
      }
    } else if (method === Animation.Step) {
      for (let i = 0; i<inputArray.length; i++) {
        if (typeof inputArray[i+1] === "undefined") {
          break;
        }
        if (inputArray[i] <= input && input < inputArray[i+1]) {
          return outputArray[i].clone();
        }
      }
    }
    return outputArray[0].clone(); // out of range!
  }

  getStartInputValueOfAnimation() {
    let latestInputValue = Number.MAX_VALUE;
    for (let attributeName in this.__animationLine) {
      let inputValueArray = this.__animationLine[attributeName].input;
      let inputLatestValueAtThisAttribute = inputValueArray[0];
      if (inputLatestValueAtThisAttribute < latestInputValue) {
        latestInputValue = inputLatestValueAtThisAttribute;
        if (latestInputValue < AnimationComponent.__startInputValueOfAllComponent) {
          AnimationComponent.__startInputValueOfAllComponent = latestInputValue;
        }
      }
    }
    return latestInputValue;
  }

  getEndInputValueOfAnimation() {
    let latestInputValue = - Number.MAX_VALUE;

    for (let attributeName in this.__animationLine) {
      let inputValueArray = this.__animationLine[attributeName].input;
      let inputLatestValueAtThisAttribute = inputValueArray[inputValueArray.length - 1];
      if (inputLatestValueAtThisAttribute > latestInputValue) {
        latestInputValue = inputLatestValueAtThisAttribute;
        if (latestInputValue > AnimationComponent.__endInputValueOfAllComponent) {
          AnimationComponent.__endInputValueOfAllComponent = latestInputValue;
        }
      }
    }
    return latestInputValue;
  }

  static get startInputValue() {
    const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent.componentTID) as AnimationComponent[];
    components!.forEach(component => {
      component.getStartInputValueOfAnimation();
    });
    return AnimationComponent.__startInputValueOfAllComponent;
  }

  static get endInputValue() {
    const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent.componentTID) as AnimationComponent[];
    components!.forEach(component => {
      component.getEndInputValueOfAnimation();
    });
    return AnimationComponent.__endInputValueOfAllComponent;
  }

  $create() {
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, TransformComponent.componentTID) as TransformComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    for (let attributeName in this.__animationLine) {
      if (this.__backupDefaultValues[attributeName] == null) {
        this.__backupDefaultValues[attributeName] = (this.__transformComponent! as any)[attributeName];
      }
      if (AnimationComponent.isAnimating) {
        const line = this.__animationLine[attributeName];
        let value = AnimationComponent.interpolate(line.input, line.output, AnimationComponent.globalTime, line.outputCompositionType, line.interpolationMethod);
        (this.__transformComponent! as any)[attributeName] = value;
      } else {
        (this.__transformComponent! as any)[attributeName] = this.__backupDefaultValues[attributeName];
      }
    }
  }
}
ComponentRepository.registerComponentClass(AnimationComponent.componentTID, AnimationComponent);
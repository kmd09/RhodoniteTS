import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import { AnimationEnum } from "../definitions/Animation";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import Quaternion from "../math/Quaternion";
import MutableVector3 from "../math/MutableVector3";
import MutableQuaternion from "../math/MutableQuaterion";
import { ComponentTID, ComponentSID, EntityUID } from "../../types/CommonTypes";
declare type AnimationLine = {
    input: number[];
    output: any[];
    inTangent: number[];
    outTangent: number[];
    outputAttributeName: string;
    outputCompositionType: CompositionTypeEnum;
    interpolationMethod: AnimationEnum;
    targetEntityUid?: EntityUID;
};
export default class AnimationComponent extends Component {
    private __animationLine;
    private __backupDefaultValues;
    static globalTime: number;
    static isAnimating: boolean;
    private __transformComponent?;
    private __meshComponent?;
    private static __startInputValueOfAllComponent;
    private static __endInputValueOfAllComponent;
    private static returnVector3;
    private static returnQuaternion;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    setAnimation(animationAttributeName: string, animationInputArray: number[], animationOutputArray: any[], interpolation: AnimationEnum): void;
    static lerp(start: any, end: any, ratio: number, compositionType: CompositionTypeEnum): number | number[] | Quaternion | MutableVector3;
    static cubicSpline(start: any, end: any, inTangent: any, outTangent: any, ratio: number, deltaInput: number, compositionType: CompositionTypeEnum): number | number[] | MutableVector3 | MutableQuaternion;
    private static __isClamped;
    static binarySearch(inputArray: number[], input: number): number;
    static interpolationSearch(inputArray: number[], value: number): number;
    static interpolate(line: AnimationLine, input: number): any;
    getStartInputValueOfAnimation(): number;
    getEndInputValueOfAnimation(): number;
    static readonly startInputValue: number;
    static readonly endInputValue: number;
    $create(): void;
    $logic(): void;
}
export {};

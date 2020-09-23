import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import { CameraTypeEnum } from '../definitions/CameraType';
import Matrix44 from '../math/Matrix44';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableVector3 from '../math/MutableVector3';
import Frustum from '../geometry/Frustum';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
import RenderPass from '../renderer/RenderPass';
export default class CameraComponent extends Component {
    private static readonly _eye;
    private _eyeInner;
    private _direction;
    private _directionInner;
    private _up;
    private _upInner;
    private _filmWidth;
    private _filmHeight;
    private _focalLength;
    private _corner;
    private _cornerInner;
    private _parameters;
    private _parametersInner;
    private __type;
    private __sceneGraphComponent?;
    private _projectionMatrix;
    private __isProjectionMatrixUpToDate;
    private _viewMatrix;
    private __isViewMatrixUpToDate;
    private static __main;
    private static returnVector3;
    private static __globalDataRepository;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpMatrix44_0;
    private __frustum;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static set main(componentSID: ComponentSID);
    static get main(): ComponentSID;
    set type(type: CameraTypeEnum);
    get type(): CameraTypeEnum;
    get eye(): Vector3;
    get eyeInner(): Vector3;
    set eyeInner(vec: Vector3);
    set upInner(vec: Vector3);
    set up(vec: Vector3);
    get up(): Vector3;
    get upInner(): Vector3;
    set direction(vec: Vector3);
    set directionInner(vec: Vector3);
    get direction(): Vector3;
    get directionInner(): Vector3;
    set corner(vec: Vector4);
    get corner(): Vector4;
    set left(value: number);
    set leftInner(value: number);
    get left(): number;
    set right(value: number);
    set rightInner(value: number);
    get right(): number;
    set top(value: number);
    set topInner(value: number);
    get top(): number;
    set bottom(value: number);
    set bottomInner(value: number);
    get bottom(): number;
    set cornerInner(vec: Vector4);
    get cornerInner(): Vector4;
    set parametersInner(vec: Vector4);
    get parametersInner(): Vector4;
    get parameters(): Vector4;
    set zNear(val: number);
    set zNearInner(val: number);
    get zNearInner(): number;
    get zNear(): number;
    set focalLength(val: number);
    get focalLength(): number;
    set zFar(val: number);
    set zFarInner(val: number);
    get zFarInner(): number;
    get zFar(): number;
    setFovyAndChangeFilmSize(degree: number): void;
    setFovyAndChangeFocalLength(degree: number): void;
    get fovy(): number;
    set fovyInner(val: number);
    set aspect(val: number);
    get aspect(): number;
    set xMag(val: number);
    get xMag(): number;
    set yMag(val: number);
    get yMag(): number;
    static get componentTID(): ComponentTID;
    calcProjectionMatrix(): MutableMatrix44;
    get projectionMatrix(): Matrix44;
    calcViewMatrix(): MutableMatrix44;
    get viewMatrix(): Matrix44;
    set viewMatrix(viewMatrix: Matrix44);
    set projectionMatrix(projectionMatrix: Matrix44);
    get viewProjectionMatrix(): MutableMatrix44;
    setValuesToGlobalDataRepository(): void;
    get worldPosition(): MutableVector3;
    updateFrustum(): void;
    get frustum(): Frustum;
    $create(): void;
    $logic({ renderPass }: {
        renderPass: RenderPass;
    }): void;
}

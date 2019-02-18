(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["effekseer"],{

/***/ "./src/effekseer/EffekseerComponent.ts":
/*!*********************************************!*\
  !*** ./src/effekseer/EffekseerComponent.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return EffekseerComponent; });\n/* harmony import */ var _foundation_core_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../foundation/core/Component */ \"./src/foundation/core/Component.ts\");\n/* harmony import */ var _foundation_components_SceneGraphComponent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../foundation/components/SceneGraphComponent */ \"./src/foundation/components/SceneGraphComponent.ts\");\n/* harmony import */ var _foundation_definitions_ProcessStage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../foundation/definitions/ProcessStage */ \"./src/foundation/definitions/ProcessStage.ts\");\n/* harmony import */ var _foundation_math_Matrix44__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../foundation/math/Matrix44 */ \"./src/foundation/math/Matrix44.ts\");\n/* harmony import */ var _foundation_components_TransformComponent__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../foundation/components/TransformComponent */ \"./src/foundation/components/TransformComponent.ts\");\n/* harmony import */ var _foundation_components_CameraComponent__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../foundation/components/CameraComponent */ \"./src/foundation/components/CameraComponent.ts\");\n/* harmony import */ var _foundation_core_ComponentRepository__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../foundation/core/ComponentRepository */ \"./src/foundation/core/ComponentRepository.ts\");\n/* harmony import */ var _foundation_system_ModuleManager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../foundation/system/ModuleManager */ \"./src/foundation/system/ModuleManager.ts\");\n/* harmony import */ var _foundation_components_WellKnownComponentTIDs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../foundation/components/WellKnownComponentTIDs */ \"./src/foundation/components/WellKnownComponentTIDs.ts\");\n\n\n\n\n\n\n\n\n\nclass EffekseerComponent extends _foundation_core_Component__WEBPACK_IMPORTED_MODULE_0__[\"default\"] {\n    constructor(entityUid, componentSid, entityRepository) {\n        super(entityUid, componentSid, entityRepository);\n        this.__speed = 1;\n        this.playJustAfterLoaded = false;\n        this.isLoop = false;\n    }\n    $create() {\n        this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, _foundation_components_SceneGraphComponent__WEBPACK_IMPORTED_MODULE_1__[\"default\"]);\n        this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, _foundation_components_TransformComponent__WEBPACK_IMPORTED_MODULE_4__[\"default\"]);\n        this.moveStageTo(_foundation_definitions_ProcessStage__WEBPACK_IMPORTED_MODULE_2__[\"ProcessStage\"].Load);\n    }\n    static get componentTID() {\n        return _foundation_components_WellKnownComponentTIDs__WEBPACK_IMPORTED_MODULE_8__[\"WellKnownComponentTIDs\"].EffekseerComponentTID;\n    }\n    static common_$load() {\n        if (EffekseerComponent.__isInitialized) {\n            return;\n        }\n        const moduleManager = _foundation_system_ModuleManager__WEBPACK_IMPORTED_MODULE_7__[\"default\"].getInstance();\n        const moduleName = 'webgl';\n        const webglModule = moduleManager.getModule(moduleName);\n        const glw = webglModule.WebGLResourceRepository.getInstance().currentWebGLContextWrapper;\n        if (glw) {\n            effekseer.init(glw.getRawContext());\n            EffekseerComponent.__isInitialized = true;\n        }\n    }\n    $load() {\n        if (this.__effect == null) {\n            this.__effect = effekseer.loadEffect(this.uri, () => {\n                if (this.playJustAfterLoaded) {\n                    if (this.isLoop) {\n                        this.__timer = setInterval(() => { this.play(); }, 500);\n                    }\n                    else {\n                        this.play();\n                    }\n                }\n            });\n        }\n        this.moveStageTo(_foundation_definitions_ProcessStage__WEBPACK_IMPORTED_MODULE_2__[\"ProcessStage\"].PreRender);\n    }\n    cancelLoop() {\n        clearInterval(this.__timer);\n    }\n    play() {\n        const __play = () => {\n            // Play the loaded effect\n            this.__handle = effekseer.play(this.__effect);\n        };\n        if (this.isLoop) {\n            this.__timer = setInterval(__play, 200);\n        }\n        else {\n            __play();\n        }\n    }\n    static common_$logic() {\n        effekseer.update();\n    }\n    $prerender() {\n        if (this.__handle != null) {\n            const worldMatrix = new _foundation_math_Matrix44__WEBPACK_IMPORTED_MODULE_3__[\"default\"](this.__sceneGraphComponent.worldMatrixInner);\n            this.__handle.setMatrix(worldMatrix.v);\n            this.__handle.setSpeed(this.__speed);\n        }\n    }\n    static common_$render() {\n        const cameraComponent = _foundation_core_ComponentRepository__WEBPACK_IMPORTED_MODULE_6__[\"default\"].getInstance().getComponent(_foundation_components_CameraComponent__WEBPACK_IMPORTED_MODULE_5__[\"default\"], _foundation_components_CameraComponent__WEBPACK_IMPORTED_MODULE_5__[\"default\"].main);\n        let viewMatrix = EffekseerComponent.__tmp_indentityMatrix;\n        let projectionMatrix = EffekseerComponent.__tmp_indentityMatrix;\n        if (cameraComponent) {\n            viewMatrix = cameraComponent.viewMatrix;\n            projectionMatrix = cameraComponent.projectionMatrix;\n        }\n        effekseer.setProjectionMatrix(projectionMatrix.v);\n        effekseer.setCameraMatrix(viewMatrix.v);\n        effekseer.draw();\n    }\n    set playSpeed(val) {\n        if (this.__handle) {\n            this.__handle.setSpeed(val);\n        }\n        this.__speed = val;\n    }\n    get playSpeed() {\n        return this.__speed;\n    }\n    set translate(vec) {\n        if (this.__handle) {\n            this.__handle.setLocation(vec.x, vec.y, vec.z);\n        }\n        this.__transformComponent.translate = vec;\n    }\n    get translate() {\n        return this.__transformComponent.translate;\n    }\n    set rotate(vec) {\n        if (this.__handle) {\n            this.__handle.setRotation(vec.x, vec.y, vec.z);\n        }\n        this.__transformComponent.rotate = vec;\n    }\n    get rotate() {\n        return this.__transformComponent.rotate;\n    }\n    set scale(vec) {\n        if (this.__handle) {\n            this.__handle.setScale(vec.x, vec.y, vec.z);\n        }\n        this.__transformComponent.scale = vec;\n    }\n    get scale() {\n        return this.__transformComponent.scale;\n    }\n}\nEffekseerComponent.__isInitialized = false;\nEffekseerComponent.__tmp_indentityMatrix = _foundation_math_Matrix44__WEBPACK_IMPORTED_MODULE_3__[\"default\"].identity();\n_foundation_core_ComponentRepository__WEBPACK_IMPORTED_MODULE_6__[\"default\"].registerComponentClass(EffekseerComponent);\n\n\n//# sourceURL=webpack:///./src/effekseer/EffekseerComponent.ts?");

/***/ }),

/***/ "./src/effekseer/main.ts":
/*!*******************************!*\
  !*** ./src/effekseer/main.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _EffekseerComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EffekseerComponent */ \"./src/effekseer/EffekseerComponent.ts\");\n/* harmony import */ var _foundation_core_EntityRepository__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../foundation/core/EntityRepository */ \"./src/foundation/core/EntityRepository.ts\");\n/* harmony import */ var _foundation_components_TransformComponent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../foundation/components/TransformComponent */ \"./src/foundation/components/TransformComponent.ts\");\n/* harmony import */ var _foundation_components_SceneGraphComponent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../foundation/components/SceneGraphComponent */ \"./src/foundation/components/SceneGraphComponent.ts\");\n\n\n\n\nconst createEffekseerEntity = function () {\n    const entityRepository = _foundation_core_EntityRepository__WEBPACK_IMPORTED_MODULE_1__[\"default\"].getInstance();\n    const entity = entityRepository.createEntity([_foundation_components_TransformComponent__WEBPACK_IMPORTED_MODULE_2__[\"default\"], _foundation_components_SceneGraphComponent__WEBPACK_IMPORTED_MODULE_3__[\"default\"], _EffekseerComponent__WEBPACK_IMPORTED_MODULE_0__[\"default\"]]);\n    return entity;\n};\nconst Effekseer = Object.freeze({\n    EffekseerComponent: _EffekseerComponent__WEBPACK_IMPORTED_MODULE_0__[\"default\"],\n    createEffekseerEntity\n});\n/* harmony default export */ __webpack_exports__[\"default\"] = (Effekseer);\n\n\n//# sourceURL=webpack:///./src/effekseer/main.ts?");

/***/ })

}]);
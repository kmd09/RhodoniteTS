(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const p = document.createElement('p');
    document.body.appendChild(p);
    (async () => {
        Rn.Config.boneDataType = Rn.BoneDataType.Mat4x4;
        Rn.Config.maxSkeletalBoneNumber = 2;
        await Rn.ModuleManager.getInstance().loadModule('webgl');
        await Rn.ModuleManager.getInstance().loadModule('pbr');
        const system = Rn.System.getInstance();
        system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
        // camera
        const entityRepository = Rn.EntityRepository.getInstance();
        const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
        const cameraComponent = cameraEntity.getCamera();
        cameraComponent.zNear = 0.1;
        cameraComponent.zFar = 1000.0;
        cameraComponent.setFovyAndChangeFocalLength(30.0);
        cameraComponent.aspect = 1.0;
        const cameraTransform = cameraEntity.getTransform();
        cameraTransform.translate = new Rn.Vector3(0, 1, 5);
        // gltf
        const gltfImporter = Rn.GltfImporter.getInstance();
        const expression = await gltfImporter.import('../../../assets/gltf/2.0/SimpleSkin/glTF-Embedded/SimpleSkin.gltf', {
            cameraComponent: cameraComponent,
        });
        let count = 0;
        let startTime = Date.now();
        Rn.AnimationComponent.globalTime = 0.03;
        const draw = function () {
            if (count > 0) {
                p.id = 'rendered';
                p.innerText = 'Rendered.';
            }
            if (window.isAnimating) {
                const date = new Date();
                const time = (date.getTime() - startTime) / 1000;
                Rn.AnimationComponent.globalTime = time;
                if (time > Rn.AnimationComponent.endInputValue) {
                    startTime = date.getTime();
                }
            }
            system.process([expression]);
            count++;
            requestAnimationFrame(draw);
        };
        draw();
    })();
});
//# sourceMappingURL=main.js.map
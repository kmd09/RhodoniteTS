import Material from "../materials/Material";
import { glTF2 } from "../../types/glTF";
export default interface ILoaderExtension {
    generateMaterial?(): void;
    isNeededToUseThisMaterial?(gltfJson: glTF2): boolean;
    setTextures?(gltfJson: glTF2, materialJson_: any): void;
    setupMaterial?(gltfJson: glTF2, materialJson: any, material: Material): void;
}

import DataUtil from "../misc/DataUtil";
import Accessor from "../memory/Accessor";
import BufferView from "../memory/BufferView";

export default class Gltf2Importer {
  private static __instance: Gltf2Importer;

  private constructor() {
  }

  async import(uri: string,  options: GltfLoadOption) {
    let defaultOptions: GltfLoadOption = {
      files: {
        //        "foo.gltf": content of file as ArrayBuffer,
        //        "foo.bin": content of file as ArrayBuffer,
        //        "boo.png": content of file as ArrayBuffer
      },
      loaderExtension: null,
      defaultShaderClass: null,
      statesOfElements: [
        {
          targets: [], //["name_foo", "name_boo"],
          states: {
            enable: [
                // 3042,  // BLEND
            ],
            functions: {
              //"blendFuncSeparate": [1, 0, 1, 0],
            }
          },
          isTransparent: true,
          opacity: 1.0,
          isTextureImageToLoadPreMultipliedAlpha: false,
        }
      ],
      extendedJson: void 0 //   URI string / JSON Object / ArrayBuffer
    };

    if (options && options.files) {
      for (let fileName in options.files) {
        const splitted = fileName.split('.');
        const fileExtension = splitted[splitted.length - 1];

        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          return await this.__loadFromArrayBuffer((options.files as any)[fileName], options, defaultOptions, void 0).catch((err)=>{
            console.log('this.__loadFromArrayBuffer error', err);
          });
        }
      }
    }

    let response: Response;
    try {
    response = await fetch(uri);
    } catch (err) {
      console.log('this.__loadFromArrayBuffer', err);
    };
    const arrayBuffer = await response!.arrayBuffer();

    return await this.__loadFromArrayBuffer(arrayBuffer, options, defaultOptions, uri).catch((err)=>{
      console.log('this.__loadFromArrayBuffer error', err);
    });;

  }

  private async __loadFromArrayBuffer(arrayBuffer: ArrayBuffer, options: {}, defaultOptions: GltfLoadOption, uri?: string) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    // Magic field
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546C67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      result = await this._loadAsTextJson(json, options as ImporterOpition, defaultOptions, uri).catch((err)=>{
        console.log('this.__loadAsTextJson error', err);
      });
    }
    else {
      result = await this._loadAsBinaryJson(dataView, isLittleEndian, arrayBuffer, options as ImporterOpition, defaultOptions, uri).catch((err)=>{
        console.log('this.__loadAsBinaryJson error', err);
      });
    }
    return result;
  }

  _getOptions(defaultOptions: any, json: glTF2, options: any): ImporterOpition {
    if (json.asset && json.asset.extras && json.asset.extras.loadOptions) {
      for (let optionName in json.asset.extras.loadOptions) {
        defaultOptions[optionName] = json.asset.extras.loadOptions[optionName];
      }
    }

    for (let optionName in options) {
      defaultOptions[optionName] = options[optionName];
    }

    return defaultOptions;
  }

  async _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: ImporterOpition, defaultOptions: GltfLoadOption, uri?: string) {
    let gltfVer = dataView.getUint32(4, isLittleEndian);
    if (gltfVer !== 2) {
      throw new Error('invalid version field in this binary glTF file.');
    }
    let lengthOfThisFile = dataView.getUint32(8, isLittleEndian);
    let lengthOfJSonChunkData = dataView.getUint32(12, isLittleEndian);
    let chunkType = dataView.getUint32(16, isLittleEndian);
    // 0x4E4F534A means JSON format (0x4E4F534A is 'JSON' in ASCII codes)
    if (chunkType !== 0x4E4F534A) {
      throw new Error('invalid chunkType of chunk0 in this binary glTF file.');
    }
    let arrayBufferJSonContent = arrayBuffer.slice(20, 20 + lengthOfJSonChunkData);
    let gotText = DataUtil.arrayBufferToString(arrayBufferJSonContent);
    let gltfJson = JSON.parse(gotText);
    options = this._getOptions(defaultOptions, gltfJson, options);
    let arrayBufferBinary = arrayBuffer.slice(20 + lengthOfJSonChunkData + 8);

    let basePath = null;
    if (uri) {
      //Set the location of glb file as basePath
      basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
    }

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: "glTF", version: "2"};
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath;

    let result: any;
    try {
      result  = await this._loadInner(arrayBufferBinary, basePath!, gltfJson, options);
    } catch (err) {
      console.log("this._loadInner error in _loadAsBinaryJson", err);
    }
    return (result[0] as any)[0];
  }

  async _loadAsTextJson(gltfJson: glTF2, options: ImporterOpition, defaultOptions: GltfLoadOption, uri?: string) {
    let basePath: string;
    if (uri) {
      //Set the location of gltf file as basePath
      basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
    }
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: "glTF", version: "2"};
    }

    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath!;

    let result: any;
    try {
      result = await this._loadInner(undefined, basePath!, gltfJson, options);
    } catch(err) {
      console.log('this._loadInner error in _loadAsTextJson', err);
    }
    return (result[0] as any)[0];
  }

  _loadInner(arrayBufferBinary: ArrayBuffer | undefined, basePath: string, gltfJson: glTF2, options: ImporterOpition) {
    let promises = [];

    let resources = {
      shaders: [],
      buffers: [],
      images: []
    };
    promises.push(this._loadResources(arrayBufferBinary!, basePath, gltfJson, options, resources));
    promises.push(new Promise((resolve, reject) => {
      this._loadJsonContent(gltfJson, options);
      resolve();
    }));

    return Promise.all(promises);
  }

  _loadJsonContent(gltfJson: glTF2, options: ImporterOpition) {

    // Scene
    this._loadDependenciesOfScenes(gltfJson);

    // Node
    this._loadDependenciesOfNodes(gltfJson);

    // Mesh
    this._loadDependenciesOfMeshes(gltfJson);

    // Material
    this._loadDependenciesOfMaterials(gltfJson);

    // Texture
    this._loadDependenciesOfTextures(gltfJson);

    // Joint
    this._loadDependenciesOfJoints(gltfJson);

    // Animation
    this._loadDependenciesOfAnimations(gltfJson);

    // Accessor
    this._loadDependenciesOfAccessors(gltfJson);

    // BufferView
    this._loadDependenciesOfBufferViews(gltfJson);

    if (gltfJson.asset === void 0) {
      gltfJson.asset = {};
    }
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = {};
    }

  }

  _loadDependenciesOfScenes(gltfJson: glTF2) {
    for (let scene of gltfJson.scenes) {
      scene.nodesIndices = scene.nodes.concat();
      for (let i in scene.nodesIndices) {
        scene.nodes[i] = gltfJson.nodes[scene.nodes[i]];
      }
    }
  }

  _loadDependenciesOfNodes(gltfJson: glTF2) {

    for (let node of gltfJson.nodes) {

      // Hierarchy
      if (node.children) {
        node.childrenIndices = node.children.concat();
        node.children = [];
        for (let i in node.childrenIndices) {
          node.children[i] = gltfJson.nodes[node.childrenIndices[i]];
        }
      }

      // Mesh
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshIndex = node.mesh;
        node.mesh = gltfJson.meshes[node.meshIndex];
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinIndex = node.skin;
        node.skin = gltfJson.skins[node.skinIndex];
        if (node.mesh.extras === void 0) {
          node.mesh.extras = {};
        }

        node.mesh.extras._skin = node.skin;
      }

      // Camera
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraIndex = node.camera;
        node.camera = gltfJson.cameras[node.cameraIndex];
      }

    }
  }

  _loadDependenciesOfMeshes(gltfJson: glTF2) {
    // Mesh
    for (let mesh of gltfJson.meshes) {
      for (let primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialIndex = primitive.material;
          primitive.material = gltfJson.materials[primitive.materialIndex];
        }

        primitive.attributesindex = Object.assign({}, primitive.attributes);
        for (let attributeName in primitive.attributesindex) {
          if (primitive.attributesindex[attributeName] >= 0) {
            let accessor = gltfJson.accessors[primitive.attributesindex[attributeName]];
            accessor.extras = {
              toGetAsTypedArray: true,
              attributeName: attributeName
            };
            primitive.attributes[attributeName] = accessor;
          } else {
            primitive.attributes[attributeName] = void 0;
          }
        }

        if (primitive.indices != null) {
          primitive.indicesIndex = primitive.indices;
          primitive.indices = gltfJson.accessors[primitive.indicesIndex];
        }

        if (primitive.targets != null) {
          primitive.targetIndices = primitive.targets;
          primitive.targets = [];
          for (let target of primitive.targetIndices) {
            const attributes = {};
            for (let attributeName in target) {
              if (target[attributeName] >= 0) {
                let accessor = gltfJson.accessors[target[attributeName]];
                accessor.extras = {
                  toGetAsTypedArray: true,
                  attributeName: attributeName
                };
                (attributes as any)[attributeName] = accessor;
              } else {
                (attributes as any)[attributeName] = void 0;
              }
            }
            primitive.targets.push(attributes);
          }
        }
      }
    }
  }

  _loadDependenciesOfMaterials(gltfJson: glTF2) {
    // Material
    if (gltfJson.materials) {
      for (let material of gltfJson.materials) {
        if (material.pbrMetallicRoughness) {
          let baseColorTexture = material.pbrMetallicRoughness.baseColorTexture;
          if (baseColorTexture !== void 0) {
            baseColorTexture.texture = gltfJson.textures[baseColorTexture.index];
          }
          let metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture;
          if (metallicRoughnessTexture !== void 0) {
            metallicRoughnessTexture.texture = gltfJson.textures[metallicRoughnessTexture.index];
          }
        }

        let normalTexture = material.normalTexture;
        if (normalTexture !== void 0) {
          normalTexture.texture = gltfJson.textures[normalTexture.index];
        }

        const occlusionTexture = material.occlusionTexture;
        if (occlusionTexture !== void 0) {
          occlusionTexture.texture = gltfJson.textures[occlusionTexture.index];
        }

        const emissiveTexture = material.emissiveTexture;
        if (emissiveTexture !== void 0) {
          emissiveTexture.texture = gltfJson.textures[emissiveTexture.index];
        }
      }
    }
  }

  _loadDependenciesOfTextures(gltfJson: glTF2) {
    // Texture
    if (gltfJson.textures) {
      for (let texture of gltfJson.textures) {
        if (texture.sampler !== void 0) {
          texture.samplerIndex = texture.sampler;
          texture.sampler = gltfJson.samplers[texture.samplerIndex];
        }
        if (texture.source !== void 0) {
          texture.sourceIndex = texture.source;
          texture.image = gltfJson.images[texture.sourceIndex];
        }
      }
    }
  }

  _loadDependenciesOfJoints(gltfJson: glTF2) {
    if (gltfJson.skins) {
      for (let skin of gltfJson.skins) {
        skin.skeletonIndex = skin.skeleton;
        skin.skeleton = gltfJson.nodes[skin.skeletonIndex];

        skin.inverseBindMatricesIndex = skin.inverseBindMatrices;
        skin.inverseBindMatrices = gltfJson.accessors[skin.inverseBindMatricesIndex];

        if (skin.skeleton == null) {
          skin.skeletonIndex = skin.joints[0];
          skin.skeleton = gltfJson.nodes[skin.skeletonIndex];
        }

        skin.jointsIndices = skin.joints;
        skin.joints = [];
        for (let jointIndex of skin.jointsIndices) {
          skin.joints.push(gltfJson.nodes[jointIndex]);
        }
      }

    }
  }


  _loadDependenciesOfAnimations(gltfJson: glTF2) {
    if (gltfJson.animations) {
      for (let animation of gltfJson.animations) {
        for (let channel of animation.channels) {
          channel.samplerIndex = channel.sampler;
          channel.sampler = animation.samplers[channel.samplerIndex];

          channel.target.nodeIndex = channel.target.node;
          channel.target.node = gltfJson.nodes[channel.target.nodeIndex];
        }
        for (let channel of animation.channels) {
          channel.sampler.inputIndex = channel.sampler.input;
          channel.sampler.outputIndex = channel.sampler.output;
          channel.sampler.input = gltfJson.accessors[channel.sampler.inputIndex];
          channel.sampler.output = gltfJson.accessors[channel.sampler.outputIndex];
          if (channel.sampler.output.extras === void 0) {
            channel.sampler.output.extras = {};
          }
          if (channel.target.path === 'rotation') {
            channel.sampler.output.extras.quaternionIfVec4 = true;
          }
          if (channel.target.path === 'weights') {
            const weightCount = channel.sampler.output.count / channel.sampler.input.count
            channel.sampler.output.extras.weightCount = weightCount;
          }
        }
      }
    }
  }

  _loadDependenciesOfAccessors(gltfJson: glTF2) {
    // Accessor
    for (let accessor of gltfJson.accessors) {
      if (accessor.bufferView == null) {
        accessor.bufferView = 0;
      }
      accessor.bufferViewIndex = accessor.bufferView;
      accessor.bufferView = gltfJson.bufferViews[accessor.bufferViewIndex];
    }
  }

  _loadDependenciesOfBufferViews(gltfJson: glTF2) {
    // BufferView
    for (let bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferIndex = bufferView.buffer;
        bufferView.buffer = gltfJson.buffers[bufferView.bufferIndex];
      }
    }
  }

  _mergeExtendedJson(gltfJson: glTF2, extendedData: any) {
    let extendedJson = null;
    if (extendedData instanceof ArrayBuffer) {
      const extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
      extendedJson = JSON.parse(extendedJsonStr);
    } else if (typeof extendedData === 'string') {
      extendedJson = JSON.parse(extendedData);
      extendedJson = extendedJson;
    } else if (typeof extendedData === 'object') {
      extendedJson = extendedData;
    } else {
    }

    Object.assign(gltfJson, extendedJson);
  }

  async _loadResources(arrayBufferBinary: ArrayBuffer, basePath: string, gltfJson: glTF2, options: ImporterOpition, resources: {
    shaders: any[],
    buffers: any[],
    images: any[]
  }) {
    let promisesToLoadResources = [];

    // Shaders Async load

    // for (let _i in gltfJson.shaders) {
    //   const i = _i as any as number;
    //   resources.shaders[i] = {};

    //   let shaderJson = gltfJson.shaders[i];
    //   let shaderType = shaderJson.type;
    //   if (typeof shaderJson.extensions !== 'undefined' && typeof shaderJson.extensions.KHR_binary_glTF !== 'undefined') {
    //     resources.shaders[i].shaderText = this._accessBinaryAsShader(shaderJson.extensions.KHR_binary_glTF.bufferView, gltfJson, arrayBufferBinary);
    //     resources.shaders[i].shaderType = shaderType;
    //     continue;
    //   }

    //   let shaderUri = shaderJson.uri;

    //   if (options.files) {
    //     const splitted = shaderUri.split('/');
    //     const filename = splitted[splitted.length - 1];
    //     if (options.files[filename]) {
    //       const arrayBuffer = options.files[filename];
    //       resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //       resources.shaders[i].shaderType = shaderType;
    //       continue;
    //     }
    //   }

    //   if (shaderUri.match(/^data:/)) {
    //     promisesToLoadResources.push(
    //       new Promise((resolve, rejected) => {
    //         let arrayBuffer = DataUtil.base64ToArrayBuffer(shaderUri);
    //         resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //         resources.shaders[i].shaderType = shaderType;
    //         resolve();
    //       })
    //     );
    //   } else {
    //     shaderUri = basePath + shaderUri;
    //     promisesToLoadResources.push(
    //       DataUtil.loadResourceAsync(shaderUri, false,
    //         (resolve:Function, response:any)=>{
    //           resources.shaders[i].shaderText = response;
    //           resources.shaders[i].shaderType = shaderType;
    //           resolve(gltfJson);
    //         },
    //         (reject:Function, error:any)=>{

    //         }
    //       )
    //     );
    //   }
    // }

    // Buffers Async load
    for (let i in gltfJson.buffers) {
      let bufferInfo = gltfJson.buffers[i];

      let splitted: string;
      let filename: string;
      if (bufferInfo.uri) {
        splitted = bufferInfo.uri.split('/');
        filename = splitted[splitted.length - 1];
      }
      if (typeof bufferInfo.uri === 'undefined') {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            resources.buffers[i] = arrayBufferBinary;
            bufferInfo.buffer = arrayBufferBinary;
            resolve(gltfJson);
          }
        ));
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            let arrayBuffer = DataUtil.base64ToArrayBuffer(bufferInfo.uri);
            resources.buffers[i] = arrayBuffer;
            bufferInfo.buffer = arrayBuffer;
            resolve(gltfJson);
          })
        );
      } else if (options.files && options.files[filename!]) {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            const arrayBuffer = options.files[filename];
            resources.buffers[i] = arrayBuffer;
            bufferInfo.buffer = arrayBuffer;
            resolve(gltfJson);
          }
        ));
      } else {
        promisesToLoadResources.push(
          DataUtil.loadResourceAsync(basePath + bufferInfo.uri, true,
            (resolve:Function, response: any)=>{
              resources.buffers[i] = response;
              bufferInfo.buffer = response;
              resolve(gltfJson);
            },
            (reject: Function, error: any)=>{

            }
          )
        );
      }
    }

    await Promise.all(promisesToLoadResources);

    // Textures Async load
    for (let _i in gltfJson.images) {
      const i = _i as any as number;
      let imageJson = gltfJson.images[i];
      //let imageJson = gltfJson.images[textureJson.source];
      //let samplerJson = gltfJson.samplers[textureJson.sampler];

      let imageUri: string;

      if (typeof imageJson.uri === 'undefined') {
        let arrayBuffer = arrayBufferBinary;
        if (arrayBufferBinary == null) {
          const bufferView = gltfJson.bufferViews[imageJson.bufferView];
          arrayBuffer = bufferView.buffer.buffer;
        }
        imageUri = this._accessBinaryAsImage(imageJson.bufferView, gltfJson, arrayBuffer, imageJson.mimeType);
      } else {
        let imageFileStr = imageJson.uri;
        const splitted = imageFileStr.split('/');
        const filename = splitted[splitted.length - 1];
        if (options.files && options.files[filename]) {
          const arrayBuffer = options.files[filename];
          const splitted = filename.split('.');
          const fileExtension = splitted[splitted.length - 1];
          imageUri = this._accessArrayBufferAsImage(arrayBuffer, fileExtension);
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }
      }

      // if (options.extensionLoader && options.extensionLoader.setUVTransformToTexture) {
      //   options.extensionLoader.setUVTransformToTexture(texture, samplerJson);
      // }

      promisesToLoadResources.push(new Promise((resolve, reject)=> {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUri;
        imageJson.image = img;
        if (imageUri.match(/^data:/)) {
          resolve(gltfJson);
        } else {

          const load = (img: HTMLImageElement, response: any)=> {

            var bytes = new Uint8Array(response);
            var binaryData = "";
            for (var i = 0, len = bytes.byteLength; i < len; i++) {
              binaryData += String.fromCharCode(bytes[i]);
            }
            const split = imageUri.split('.');
            let ext = split[split.length-1];
            img.src = this._getImageType(ext) + window.btoa(binaryData);
            img.name = (imageJson.name) ? imageJson.name : imageJson.uri;
            img.onload = ()=>{
              resolve(gltfJson);
            }
          }

          const loadBinaryImage = ()=> {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = (function(_img) {
              return function(){
                if (xhr.readyState == 4 && xhr.status == 200) {
                load(_img, xhr.response);
                }
            }
            })(img);
            xhr.open('GET', imageUri);
            xhr.responseType = 'arraybuffer';
            xhr.send();
          }
          loadBinaryImage();

        }

        resources.images[i] = img;
      }));
    }

    return Promise.all(promisesToLoadResources).then().catch((err)=>{
      console.log('Promise.all error', err);
    });
  }

  _accessBinaryAsImage(bufferViewStr: string, json: any, arrayBuffer: ArrayBuffer, mimeType: string) {
    let arrayBufferSliced = this._sliceBufferViewToArrayBuffer(json, bufferViewStr, arrayBuffer);
    return this._accessArrayBufferAsImage(arrayBufferSliced, mimeType);
  }

  _sliceBufferViewToArrayBuffer(json: any, bufferViewStr: string, arrayBuffer: ArrayBuffer) {
    let bufferViewJson = json.bufferViews[bufferViewStr];
    let byteOffset = (bufferViewJson.byteOffset != null) ? bufferViewJson.byteOffset : 0;
    let byteLength = bufferViewJson.byteLength;
    let arrayBufferSliced = arrayBuffer.slice(byteOffset, byteOffset + byteLength);
    return arrayBufferSliced;
  }

  _accessArrayBufferAsImage(arrayBuffer: ArrayBuffer, imageType: string) {
    let bytes = new Uint8Array(arrayBuffer);
    let binaryData = '';
    for (let i = 0, len = bytes.byteLength; i < len; i++) {
      binaryData += String.fromCharCode(bytes[i]);
    }
    let imgSrc = this._getImageType(imageType);
    let dataUrl = imgSrc + DataUtil.btoa(binaryData);
    return dataUrl;
  }

  _getImageType(imageType: string) {
    let imgSrc = null;
    if (imageType === 'image/jpeg' || imageType.toLowerCase() === 'jpg' || imageType.toLowerCase() === 'jpeg') {
      imgSrc = "data:image/jpeg;base64,";
    }
    else if (imageType == 'image/png' || imageType.toLowerCase() === 'png') {
      imgSrc = "data:image/png;base64,";
    }
    else if (imageType == 'image/gif' || imageType.toLowerCase() === 'gif') {
      imgSrc = "data:image/gif;base64,";
    }
    else if (imageType == 'image/bmp' || imageType.toLowerCase() === 'bmp') {
      imgSrc = "data:image/bmp;base64,";
    }
    else {
      imgSrc = "data:image/unknown;base64,";
    }
    return imgSrc;
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new Gltf2Importer();
    }
    return this.__instance;
  }
}

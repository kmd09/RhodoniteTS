import DataUtil from "../misc/DataUtil";

export default class Gltf1Importer {
  private static __instance: Gltf1Importer;

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
          return await this.__loadFromArrayBuffer((options.files as any)[fileName], options, defaultOptions, void 0);
        }
      }
    }



    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    return await this.__loadFromArrayBuffer(arrayBuffer, options, defaultOptions, uri);

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
      result = await this._loadAsTextJson(json, options as ImporterOpition, defaultOptions, uri);
    }
    else {
      result = await this._loadAsBinaryJson(dataView, isLittleEndian, arrayBuffer, options as ImporterOpition, defaultOptions, uri);
    }
    return result;
  }

  _getOptions(defaultOptions: any, json: glTF1, options: any): ImporterOpition {
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
      gltfJson.asset.extras = {};
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath;

    const result  = await this._loadInner(arrayBufferBinary, basePath!, gltfJson, options);

    return (result[0] as any)[0];
  }

  async _loadAsTextJson(gltfJson: glTF1, options: ImporterOpition, defaultOptions: GltfLoadOption, uri?: string) {
    let basePath: string;
    if (uri) {
      //Set the location of gltf file as basePath
      basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
    }
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {};
    }

    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath!;

    const result = await this._loadInner(undefined, basePath!, gltfJson, options);

    return (result[0] as any)[0];
  }

  _loadInner(arrayBufferBinary: ArrayBuffer | undefined, basePath: string, gltfJson: glTF1, options: ImporterOpition) {
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

  _loadJsonContent(gltfJson: glTF1, options: ImporterOpition) {

    this._convertToGltf2LikeStructure(gltfJson);

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

  private _convertToGltf2LikeStructure(gltfJson: glTF1) {
    gltfJson.bufferDic = gltfJson.buffers;
    gltfJson.buffers = [];
    for (let bufferName in gltfJson.bufferDic) {
      gltfJson.buffers.push((gltfJson.bufferDic as any)[bufferName]);
    }
    gltfJson.sceneDic = gltfJson.scenes;
    gltfJson.scenes = [];
    for (let sceneName in gltfJson.sceneDic) {
      gltfJson.scenes.push((gltfJson.sceneDic as any)[sceneName]);
    }

    gltfJson.meshDic = gltfJson.meshes;

    {
      let count = 0;
      gltfJson.nodeDic = gltfJson.nodes;
      gltfJson.nodes = [];
      gltfJson.nodesIndices = [];
      for (let nodeName in gltfJson.nodeDic) {
        gltfJson.nodesIndices.push(count);
        const node = (gltfJson.nodeDic as any)[nodeName];
        node._index = count++;
        gltfJson.nodes.push(node);
      }
    }

    gltfJson.skinDic = gltfJson.skins;
    gltfJson.skins = [];
    for (let skinName in gltfJson.skinDic) {
      gltfJson.skins.push((gltfJson.skinDic as any)[skinName]);
    }

    gltfJson.materialDic = gltfJson.materials;
    gltfJson.cameraDic = gltfJson.cameras;
    gltfJson.shaderDic = gltfJson.shaders;
    gltfJson.imageDic = gltfJson.images;
    gltfJson.animationDic = gltfJson.animations as any;
    gltfJson.animations = [];
    for (let animationName in gltfJson.animationDic) {
      gltfJson.animations.push((gltfJson.animationDic as any)[animationName]);
    }

    gltfJson.textureDic = gltfJson.textures;
    gltfJson.samplerDic = gltfJson.samplers;
    gltfJson.accessorDic = gltfJson.accessors;
    gltfJson.bufferViewDic = gltfJson.bufferViews;

  }

  _loadDependenciesOfScenes(gltfJson: glTF1) {
    for (let sceneName in gltfJson.sceneDic) {
      const scene = (gltfJson.sceneDic as any)[sceneName];
      scene.nodeNames = scene.nodes;
      scene.nodes = [];
      scene.nodesIndices = [];
      for (let name of scene.nodeNames) {
        scene.nodes.push((gltfJson.nodeDic as any)[name]);

        // calc index of 'name' in gltfJson.nodeDic enumerate
        let count = 0;
        for (let nodeName in gltfJson.nodeDic) {
          if (nodeName === name) {
            break;
          }
          count++;
        }
        scene.nodesIndices.push(count);
      }
    }
  }

  _loadDependenciesOfNodes(gltfJson: glTF1) {

    for (let nodeName in gltfJson.nodeDic) {
      const node = (gltfJson.nodeDic as any)[nodeName];
      // Hierarchy
      if (node.children) {
        node.childrenNames = node.children.concat();
        node.children = [];
        node.childrenIndices = [];
        for (let name of node.childrenNames) {
          node.children.push((gltfJson.nodeDic as any)[name]);

          // calc index of 'name' in gltfJson.nodeDic enumerate
          let count = 0;
          for (let nodeName in gltfJson.nodeDic) {
            if (nodeName === name) {
              break;
            }
            count++;
          }
          node.childrenIndices.push(count);
        }
      }

      // Mesh
      if (node.meshes !== void 0 && gltfJson.meshes !== void 0) {
        node.meshNames = node.meshes;
        node.meshes = [];
        for (let name of node.meshNames) {
          node.meshes.push((gltfJson.meshDic as any)[name]);
          node.mesh = (gltfJson.meshDic as any)[name];
        }
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinName = node.skin;
        node.skin = (gltfJson.skinDic as any)[node.skinName];
        // if (node.mesh.extras === void 0) {
        //   node.mesh.extras = {};
        // }

        //node.mesh.extras._skin = node.skin;
      }

      // Camera
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraName = node.camera;
        node.camera = (gltfJson.cameraDic as any)[node.CameraName];
      }

    }
  }

  _loadDependenciesOfMeshes(gltfJson: glTF1) {
    // Mesh
    for (let meshName in gltfJson.meshDic) {
      const mesh = (gltfJson.meshDic as any)[meshName];
      for (let primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialName = primitive.material;
          primitive.material = (gltfJson.materialDic as any)[primitive.materialName];
        }

        primitive.attributeNames = Object.assign({}, primitive.attributes);
        for (let attributeName in primitive.attributeNames) {
          if (primitive.attributeNames[attributeName] != null) {
            const accessorName = primitive.attributeNames[attributeName];
            let accessor = (gltfJson.accessorDic as any)[accessorName];
            accessor.extras = {
              toGetAsTypedArray: true,
              attributeName: attributeName
            };
            primitive.attributes[attributeName] = accessor;
          } else {
            primitive.attributes[attributeName] = void 0;
          }
        }

        if (primitive.indices !== void 0) {
          primitive.indicesName = primitive.indices;
          primitive.indices = (gltfJson.accessorDic as any)[primitive.indicesName];
        }
      }
    }
  }

  _isKHRMaterialsCommon(materialJson: any) {
    if (typeof materialJson.extensions !== 'undefined' && typeof materialJson.extensions.KHR_materials_common !== 'undefined') {
      return true;
    } else {
      return false;
    }
  }

  _loadDependenciesOfMaterials(gltfJson: glTF1) {
    // Material
    if (gltfJson.materials) {
      for (let materialStr in gltfJson.materials) {
        let material = gltfJson.materials[materialStr];

        if (this._isKHRMaterialsCommon(material)) {
          material = material.extensions.KHR_materials_common;
        }

        const setParameters = (values: any[], isParameter: boolean)=> {
          for (let valueName in values) {
            let value = null;
            if (isParameter) {
              value = values[valueName].value;
              if (typeof value === 'undefined') {
                continue;
              }
            } else {
              value = values[valueName];
            }

            if (typeof value === 'string') {
              let textureStr = value;
              let texturePurpose;
              if (valueName === 'diffuse' || (material.technique === "CONSTANT" && valueName === 'ambient')) {
                material.diffuseColorTexture = {};
                material.diffuseColorTexture.texture = (gltfJson.textures as any)[value];

              } else if (valueName === 'emission' && textureStr.match(/_normal$/)) {
                material.emissionTexure = {};
                material.emissionTexture.texture = (gltfJson.textures as any)[value];
              } else {
              }


            } else {
              if (valueName === 'diffuse') {
                material.diffuseColorFactor = value;
              }
            }
          }
        };
        setParameters(material.values, false);
        if (material.technique && gltfJson.techniques) {
          if (typeof gltfJson.techniques[material.technique] !== "undefined") {
            setParameters(gltfJson.techniques[material.technique].parameters, true);
          }
        }
      }
    }
  }

  _loadDependenciesOfTextures(gltfJson: glTF1) {
    // Texture
    if (gltfJson.textures) {
      for (let textureName in gltfJson.textureDic) {
        const texture = (gltfJson.textureDic as any)[textureName];
        if (texture.sampler !== void 0) {
          texture.samplerName = texture.sampler;
          texture.sampler = (gltfJson.samplerDic as any)[texture.samplerName];
        }
        if (texture.source !== void 0) {
          texture.sourceName = texture.source;
          texture.image = (gltfJson.imageDic as any)[texture.sourceName];
        }
      }
    }
  }

  _loadDependenciesOfJoints(gltfJson: glTF1) {
    if (gltfJson.skins) {
      for (let skinName in gltfJson.skinDic) {
        const skin = (gltfJson.skinDic as any)[skinName];
        skin.skeletonNames = skin.skeletons;
        skin.skeletons = [];
        for (let name of skin.skeletonNames) {
          skin.skeletons.push((gltfJson.nodeDic as any)[name]);
        }

        skin.inverseBindMatricesName = skin.inverseBindMatrices;
        skin.inverseBindMatrices = (gltfJson.accessorDic as any)[skin.inverseBindMatricesName];

        skin.jointsNames = skin.joints;
        skin.joints = [];
        for (let name of skin.jointsNames) {
          skin.joints.push((gltfJson.nodeDic as any)[name]);
        }

      }

    }
  }


  _loadDependenciesOfAnimations(gltfJson: glTF1) {
    if (gltfJson.animations) {
      for (let animationName in gltfJson.animationDic) {
        const animation = (gltfJson.animationDic as any)[animationName];
        animation.samplerDic = animation.samplers;
        animation.samplers = [];
        for (let channel of animation.channels) {
          channel.sampler = animation.samplerDic[channel.sampler];

          channel.target.node = (gltfJson.nodeDic as any)[channel.target.id];
          channel.target.nodeIndex = channel.target.node._index;

          channel.sampler.input = gltfJson.accessors[animation.parameters['TIME']];
          channel.sampler.output = gltfJson.accessors[animation.parameters[channel.target.path]];

          animation.samplers.push(channel.sampler);

          if (channel.target.path === 'rotation') {
            if (channel.sampler.output.extras === void 0) {
              channel.sampler.output.extras = {};
            }
            channel.sampler.output.extras.quaternionIfVec4 = true;
          }
        }
        animation.channelDic = animation.channels;
        animation.channels = [];
        for (let channel of animation.channelDic) {
          animation.channels.push(channel);
        }
      }
    }
  }

  _loadDependenciesOfAccessors(gltfJson: glTF1) {
    // Accessor
    for (let accessorName in gltfJson.accessorDic) {
      const accessor = (gltfJson.accessorDic as any)[accessorName];
      if (accessor.bufferView !== void 0) {
        accessor.bufferViewName = accessor.bufferView;
        accessor.bufferView = (gltfJson.bufferViewDic as any)[accessor.bufferViewName];
      }
    }
  }

  _loadDependenciesOfBufferViews(gltfJson: glTF1) {
    // BufferView
    for (let bufferViewName in gltfJson.bufferViewDic) {
      const bufferView = (gltfJson.bufferViewDic as any)[bufferViewName];
      if (bufferView.buffer !== void 0) {
        bufferView.bufferName = bufferView.buffer;
        bufferView.buffer = (gltfJson.bufferDic as any)[bufferView.bufferName];
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

  _loadResources(arrayBufferBinary: ArrayBuffer, basePath: string, gltfJson: glTF2, options: ImporterOpition, resources: {
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

    // Textures Async load
    for (let _i in gltfJson.images) {
      const i = _i as any as number;
      let imageJson = gltfJson.images[i];
      //let imageJson = gltfJson.images[textureJson.source];
      //let samplerJson = gltfJson.samplers[textureJson.sampler];

      let imageUri: string;

      if (typeof imageJson.uri === 'undefined') {
        imageUri = this._accessBinaryAsImage(imageJson.bufferView, gltfJson, arrayBufferBinary, imageJson.mimeType);
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

    return Promise.all(promisesToLoadResources);
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
      this.__instance = new Gltf1Importer();
    }
    return this.__instance;
  }
}

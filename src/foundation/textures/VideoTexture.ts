import AbstractTexture from "./AbstractTexture";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { TextureParameter } from "../definitions/TextureParameter";

export default class VideoTexture extends AbstractTexture {
  private __htmlVideoElement?: HTMLVideoElement;

  constructor() {
    super();
  }

  generateTextureFromVideo(video: HTMLVideoElement, {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge,
    generateMipmap = true,
    anisotropy = true
  } = {}) {
    this.__startedToLoad = true;
    this.__htmlVideoElement = video;

    this.__width = video.videoWidth;
    this.__height = video.videoHeight;

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let texture = webGLResourceRepository.createTexture(
      video, {
      level: level, internalFormat: internalFormat, width: this.__width, height: this.__height,
      border: 0, format: format, type: type, magFilter: magFilter, minFilter: minFilter,
      wrapS: wrapS, wrapT: wrapT, generateMipmap: generateMipmap, anisotropy: anisotropy
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    this.__uri = video.src;

    AbstractTexture.__textureMap.set(texture, this);
  }

  get htmlVideoElement() {
    return this.__htmlVideoElement;
  }
}

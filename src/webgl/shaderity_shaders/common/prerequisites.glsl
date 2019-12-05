uniform float u_materialSID;
uniform sampler2D u_dataTexture;

  /*
  * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
  * arg = vec2(1. / size.x, 1. / size.x / size.y);
  */
  // highp vec4 fetchElement(highp sampler2D tex, highp float index, highp vec2 arg)
  // {
  //   return texture2D( tex, arg * (index + 0.5) );
  // }

highp vec4 fetchElement(highp sampler2D tex, highp float index, highp vec2 invSize){
  highp float t = (index + 0.5) * invSize.x;
  highp float x = fract(t);
  highp float y = (floor(t) + 0.5) * invSize.y;
  return texture2D( tex, vec2(x, y) );
}

highp vec4 fetchVec4(highp sampler2D tex, highp float componentIdx, highp vec2 invSize){
  float modN = mod(componentIdx, 4.0);
  float index = 4.0 * floor(componentIdx / 4.0) / 4.0;
  if (modN == 0.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) );
  } else if (modN == 1.0) {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec4(texel0.yzw, texel1.x);
  } else if (modN == 2.0) {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec4(texel0.zw, texel1.xy);
  } else {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec4(texel0.w, texel1.xyz);
  }
}

highp vec3 fetchVec3(highp sampler2D tex, highp float componentIdx, highp vec2 invSize){
  float modN = mod(componentIdx, 4.0);
  float index = floor(componentIdx / 4.0);
  if (modN == 0.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).xyz;
  } else if (modN == 1.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).yzw;
  } else if (modN == 2.0) {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec3(texel0.zw, texel1.x);
  } else {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec3(texel0.w, texel1.xy);
  }
}

highp vec2 fetchVec2(highp sampler2D tex, highp float componentIdx, highp vec2 invSize){
  float modN = mod(componentIdx, 4.0);
  float index = floor(componentIdx / 4.0);
  if (modN == 0.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).xy;
  } else if (modN == 1.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).yz;
  } else if (modN == 2.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).zw;
  } else {
    highp float t0 = (index + 0.5) * invSize.x;
    highp float x0 = fract(t0);
    highp float y0 = (floor(t0) + 0.5) * invSize.y;
    vec4 texel0 = texture2D( tex, vec2(x0, y0) );
    highp float t1 = (index + 1.0 + 0.5) * invSize.x;
    highp float x1 = fract(t1);
    highp float y1 = (floor(t1) + 0.5) * invSize.y;
    vec4 texel1 = texture2D( tex, vec2(x1, y1) );
    return vec2(texel0.w, texel1.x);
  }
}

highp float fetchScalar(highp sampler2D tex, highp float componentIdx, highp vec2 invSize){
  float modN = mod(componentIdx, 4.0);
  float index = floor(componentIdx / 4.0);
  if (modN == 0.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).x;
  } else if (modN == 1.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).y;
  } else if (modN == 2.0) {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).z;
  } else {
    highp float t = (index + 0.5) * invSize.x;
    highp float x = fract(t);
    highp float y = (floor(t) + 0.5) * invSize.y;
    return texture2D( tex, vec2(x, y) ).w;
  }
}

float rand(const vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 descramble(vec3 v) {
  float seed = 0.0;
  v.x -= sin(fract(v.y*20.0));
  v.z -= cos(fract(-v.y*10.0));
  return v;
}


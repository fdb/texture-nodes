import { Node } from '../nodes.js';

const NOISE_VS = `
precision mediump float;
attribute vec2 a_position;
varying vec2 v_position;

void main() {
  v_position = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
const NOISE_FNS = `
precision mediump float;
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const NOISE_FS = `
precision mediump float;

${NOISE_FNS}

varying vec2 v_position;
uniform vec2 u_position;
uniform float u_scale;

void main() {
  float v = snoise((v_position + u_position) * u_scale);
  vec3 rgb = vec3(v, v, v);
  gl_FragColor = vec4(rgb, 1.0);
}
`;

export default class NoiseNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.offset = this.createFloat2Parameter('offset', 0, 0);
    this.scale = this.createFloatParameter('scale', 1);
  }

  init(network, gl) {
    this._init(gl, NOISE_VS, NOISE_FS);
  }

  render(network, gl, time) {
    const uniforms = {
      // u_position: [1.0 + time * 0.001, -time * 0.0005],
      u_position: this.offset.value,
      u_scale: this.scale.value,
    };

    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);
  }
}

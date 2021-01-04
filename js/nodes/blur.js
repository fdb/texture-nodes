import { Node } from '../nodes.js';

const BLUR_VS = `
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const BLUR_FS = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_direction;

varying vec2 v_texCoord;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

void main() {
  vec4 color = blur9(u_image, v_texCoord, u_resolution, u_direction);
  gl_FragColor = color;
}
`;

export default class BlurNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.imageIn = this.createInput('image');
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.size = this.createFloatParameter('size', 1.0);
  }

  init(network, gl) {
    this._init(gl, BLUR_VS, BLUR_FS);
    this.pingPongBuffer = this._createFramebuffer(gl);
    this.pingPongBuffer.name = `${this.name}_pingpong`;
  }

  render(network, gl) {
    const uniforms = {
      u_image: this.imageIn.framebuffer.attachments[0],
      u_resolution: [this.width.value, this.height.value],
      u_direction: [this.size.value, 0.0],
    };

    twgl.bindFramebufferInfo(gl, this.pingPongBuffer);
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);

    uniforms.u_image = this.pingPongBuffer.attachments[0];
    uniforms.u_direction = [0.0, this.size.value];
    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);
  }
}

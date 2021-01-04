import { Node } from '../nodes.js';

const BRIGHTNESS_CONTRAST_VS = `
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const BRIGHTNESS_CONTRAST_FS = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
  vec4 color = vec4(0.0);
  vec2 offset = vec2(1.0) / u_resolution;

  // color += texture2D(u_image, v_texCoord + offset * vec2(-1.0, -1.0)) *  0.0 * u_intensity;
  color += texture2D(u_image, v_texCoord + offset * vec2( 0.0, -1.0)) * -1.0 * u_intensity;
  // color += texture2D(u_image, v_texCoord + offset * vec2( 1.0, -1.0)) *  0.0 * u_intensity;

  color += texture2D(u_image, v_texCoord + offset * vec2(-1.0,  0.0)) * -1.0 * u_intensity;
  color += texture2D(u_image, v_texCoord + offset * vec2( 0.0,  0.0)) *  5.0 * u_intensity;
  color += texture2D(u_image, v_texCoord + offset * vec2( 1.0,  0.0)) * -1.0 * u_intensity;

  // color += texture2D(u_image, v_texCoord + offset * vec2(-1.0,  1.0)) *  0.0 * u_intensity;
  color += texture2D(u_image, v_texCoord + offset * vec2( 0.0,  1.0)) * -1.0 * u_intensity;
  // color += texture2D(u_image, v_texCoord + offset * vec2( 1.0,  1.0)) *  0.0 * u_intensity;

  gl_FragColor = vec4(color.rgb, texture2D(u_image, v_texCoord).a);
}
`;

export default class SharpenNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.imageIn = this.createInput('image');
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.intensity = this.createFloatParameter('intensity', 1.0);
  }

  init(network, gl) {
    this._init(gl, BRIGHTNESS_CONTRAST_VS, BRIGHTNESS_CONTRAST_FS);
  }

  render(network, gl) {
    const uniforms = {
      u_image: this.imageIn.framebuffer.attachments[0],
      u_resolution: [this.width.value, this.height.value],
      u_intensity: this.intensity.value,
    };

    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);

    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);
  }
}

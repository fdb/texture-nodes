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
uniform float u_brightness;
uniform float u_contrast;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  color.rgb += u_brightness;
  if (u_contrast > 0.0) {
    color.rgb = (color.rgb - 0.5) / (1.0 - u_contrast) + 0.5;
  } else {
    color.rgb = (color.rgb - 0.5) * (1.0 + u_contrast) + 0.5;
  }
  gl_FragColor = color;
}
`;

export default class BrightnessContrastNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.imageIn = this.createInput('image');
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.brightness = this.createFloatParameter('brightness', 0.0);
    this.contrast = this.createFloatParameter('contrast', 0.0);
  }

  init(gl) {
    this._init(gl, BRIGHTNESS_CONTRAST_VS, BRIGHTNESS_CONTRAST_FS);
  }

  render(gl) {
    const uniforms = {
      u_image: this.imageIn.framebuffer.attachments[0],
      u_brightness: this.brightness.value,
      u_contrast: this.contrast.value,
    };

    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);

    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);
  }
}

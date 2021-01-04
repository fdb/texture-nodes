import { Node } from '../nodes.js';

const IMAGE_VS = `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_position;

void main() {
  v_position = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
const IMAGE_FS = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;

varying vec2 v_position;

void main() {
  gl_FragColor = texture2D(u_image, v_position);
}
`;

export default class ImageNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.url = this.createStringParameter('url', '/img/road.jpg');
  }

  init(network, gl) {
    this._init(gl, IMAGE_VS, IMAGE_FS);
    this._imageTexture = twgl.createTexture(gl, { width: this.width.value, height: this.height.value });
    twgl.loadTextureFromUrl(gl, this._imageTexture, { src: this.url.value, wrap: gl.CLAMP_TO_EDGE });
  }

  render(network, gl, time) {
    const uniforms = {
      u_image: this._imageTexture,
    };

    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);
  }
}

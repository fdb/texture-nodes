import { Node } from '../nodes.js';

// const CONSTANT_VS = `
// precision mediump float;
// attribute vec2 a_position;

// void main() {
//   gl_Position = vec4(a_position, 0.0, 1.0);
// }
// `;

// const CONSTANT_FS = `
// precision mediump float;

// void main() {
//   gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
// }
// `;

export default class ConstantNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
  }

  init(gl) {
    this._initFramebufferOut(gl);
  }

  render(gl) {
    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    twgl.bindFramebufferInfo(gl, null);
  }
}

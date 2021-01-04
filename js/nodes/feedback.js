import { Node } from '../nodes.js';

const FEEDBACK_VS = `
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FEEDBACK_FS = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
  gl_FragColor = texture2D(u_image, v_texCoord);
}
`;

export default class FeedbackNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.imageIn = this.createInput('image');
    this.nodeName = this.createStringParameter('nodeName', '');
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.first = true;
  }

  init(network, gl) {
    this._init(gl, FEEDBACK_VS, FEEDBACK_FS);
    if (!this.nodeName.value) {
      throw new Error(`${this.name}: no feedbackNode has been set.`);
    } else {
      const node = network.nodes.find((node) => node.name === this.nodeName.value);
      if (!node) {
        throw new Error(`${this.name}: could not find feedbackNode ${this.nodeName.value}.`);
      }
    }
  }

  render(network, gl) {
    let framebuffer;
    if (this.first) {
      framebuffer = this.imageIn.framebuffer.attachments[0];
    } else {
      const node = network.nodes.find((node) => node.name === this.nodeName.value);
      if (!node) {
        throw new Error(`${this.name}: could not find feedbackNode ${this.nodeName.value}.`);
      }
      framebuffer = node.framebufferOut.attachments[0];
    }
    const uniforms = {
      u_image: framebuffer,
      u_resolution: [this.width.value, this.height.value],
    };

    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
    twgl.bindFramebufferInfo(gl, null);

    this.first = false;
  }
}

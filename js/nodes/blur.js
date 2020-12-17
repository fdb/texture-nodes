import { Node } from '../nodes.js';

const CONSTANT_VS = `
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const CONSTANT_FS = `
precision mediump float;

void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`;

export default class BlurNode extends Node {
  constructor(name, x, y) {
    super(name, x, y);
    this.width = this.createIntParameter('width', 512);
    this.height = this.createIntParameter('height', 512);
    this.imageIn = this.addInput('image');
  }

  init(gl) {
    this.programInfo = twgl.createProgramInfo(gl, [CONSTANT_VS, CONSTANT_FS]);
    const attachments = [
      {
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        min: gl.LINEAR,
        wrap: gl.CLAMP_TO_EDGE,
      },
    ];
    this.framebufferInfo = twgl.createFramebufferInfo(gl, attachments, this.width.value, this.height.value);
    this.framebufferInfo = twgl.createFramebufferInfo(gl);

    // this.planeBuffer = twgl.createPlaneBufferInfo(gl, 2, 2);
    this.quadBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 },
    });
  }

  render(gl) {
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.bindFramebufferInfo(gl, this.framebufferInfo);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
  }
}

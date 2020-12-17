import { Network } from './nodes.js';
import NoiseNode from './nodes/noise.js';
import ConstantNode from './nodes/constant.js';

// Initialize WebGL
const canvas = document.getElementById('c');
const gl = twgl.getContext(canvas, { depth: false, antialiasing: false });
twgl.setDefaults({ attribPrefix: 'a_' });

// Create the network
const network = new Network();
const noise1 = network.createNode(NoiseNode, 'noise1', 1, 1);
const constant1 = network.createNode(ConstantNode, 'constant1', 1, 1);
network.setRenderedNode(noise1);

// Initialize the network (create the shaders)
network.init(gl);

network.render(gl);

const vs = `
attribute vec4 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = a_position;
}
`;

const fs = `
precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_texCoord;
uniform vec2 resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = texture2D(u_texture, v_texCoord);
}

`;
const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

const quadBuffer = twgl.createBufferInfoFromArrays(gl, {
  position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 },
  texCoord: { data: [1, 0, 1, 1, 0, 1, 0, 0] },
});

// const texture = twgl.createTexture(gl, { src: "img/road.jpg" });

function render(time) {
  network.render(gl, time);
  const node = network.getNode(network.renderedNode);
  const fbo = node.framebufferOut.attachments[0];

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const uniforms = {
    time: time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
    u_texture: fbo,
  };
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, quadBuffer);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, quadBuffer, gl.TRIANGLE_FAN);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
render();

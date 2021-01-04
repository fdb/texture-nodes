import { Network } from './nodes.js';
import NoiseNode from './nodes/noise.js';
import ConstantNode from './nodes/constant.js';
import BrightnessContrastNode from './nodes/brightnessContrast.js';
import BlurNode from './nodes/blur.js';
import SharpenNode from './nodes/sharpen.js';
import FeedbackNode from './nodes/feedback.js';

// Initialize WebGL
const canvas = document.getElementById('c');
const gl = twgl.getContext(canvas, { depth: false, antialiasing: false });
twgl.setDefaults({ attribPrefix: 'a_' });

// Create the network
const network = new Network();
const noise1 = network.createNode(NoiseNode, 'noise1', 1, 1);
const feedback1 = network.createNode(FeedbackNode, 'feedback1', 2, 1);
feedback1.nodeName.value = 'sharpen1';

const blur1 = network.createNode(BlurNode, 'blur1', 3, 1);
blur1.size.value = 0.5;
const sharpen1 = network.createNode(SharpenNode, 'sharpen1', 4, 1);
sharpen1.intensity.value = 1.0;

network.setRenderedNode(sharpen1);
network.connect(noise1, feedback1, 'image');
network.connect(feedback1, blur1, 'image');
// network.connect(brightnessContrast1, blur1, 'image');
network.connect(blur1, sharpen1, 'image');
// Initialize the network (create the shaders)
network.init(gl);
window.network = network;

// network.render(gl);

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
// requestAnimationFrame(render);
render();

window.addEventListener('click', () => {
  feedback1.first = true;
});

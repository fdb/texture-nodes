const PARAMETER_TYPE_INT = 'int';
const PARAMETER_TYPE_FLOAT = 'float';

export class Parameter {
  constructor(name, type, value) {
    this.name = name;
    this.type = type;
    this.value = value;
  }
}

export class Node {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.parameters = [];
    this.framebufferOut = null;
  }

  createIntParameter(name, value) {
    const param = new Parameter(name, PARAMETER_TYPE_INT, value);
    this.parameters.push(param);
    return param;
  }

  _initFramebufferOut(gl) {
    const attachments = [
      {
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        min: gl.LINEAR,
        wrap: gl.CLAMP_TO_EDGE,
      },
    ];
    this.framebufferOut = twgl.createFramebufferInfo(gl, attachments, this.width.value, this.height.value);
  }

  _init(gl, vertexShader, fragmentShader) {
    this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    this._initFramebufferOut(gl);
    this.quadBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 },
    });
  }

  render(gl) {
    twgl.bindFramebufferInfo(gl, this.framebufferOut);
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBuffer);
    twgl.drawBufferInfo(gl, this.quadBuffer, gl.TRIANGLE_FAN);
  }
}

export class Network {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.renderedNode = null;
  }

  hasNode(nodeName) {
    return !!this.nodes.find((node) => node.name === nodeName);
  }

  getNode(nodeName) {
    return this.nodes.find((node) => node.name === nodeName);
  }

  createNode(nodeClass, name, x, y) {
    const newNode = new nodeClass(name, x, y);
    this.nodes.push(newNode);
    return newNode;
  }

  setRenderedNode(node) {
    if (node instanceof String) {
      console.assert(this.hasNode(node), `Node with name ${node} not found!`);
      this.renderedNode = node;
    } else if (node.name) {
      console.assert(this.hasNode(node.name), `Node with name ${node.name} not found!`);
      this.renderedNode = node.name;
    } else {
      throw new Error('Invalid argument to setRenderedNode.');
    }
  }

  init(gl) {
    for (const node of this.nodes) {
      node.init(gl);
    }
  }

  render(gl, time) {
    if (!this.renderedNode) return;
    const node = this.getNode(this.renderedNode);
    node.render(gl, time);
  }
}

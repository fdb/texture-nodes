const PARAMETER_TYPE_INT = 'int';
const PARAMETER_TYPE_FLOAT = 'float';

export class Port {
  constructor(name) {
    this.name = name;
    this.framebuffer = null;
  }
}

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
    this.inputs = [];
    this.parameters = [];
    this.framebufferOut = null;
  }

  createInput(name) {
    const port = new Port(name);
    this.inputs.push(port);
    return port;
  }

  createIntParameter(name, value) {
    const param = new Parameter(name, PARAMETER_TYPE_INT, value);
    this.parameters.push(param);
    return param;
  }

  createFloatParameter(name, value) {
    const param = new Parameter(name, PARAMETER_TYPE_FLOAT, value);
    this.parameters.push(param);
    return param;
  }

  _setInputFramebuffer(inputName, framebuffer) {
    const input = this.inputs.find((i) => i.name === inputName);
    console.assert(input);
    input.framebuffer = framebuffer;
  }

  _createFramebuffer(gl) {
    const attachments = [
      {
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        min: gl.LINEAR,
        wrap: gl.CLAMP_TO_EDGE,
      },
    ];
    const framebuffer = twgl.createFramebufferInfo(gl, attachments, this.width.value, this.height.value);
    return framebuffer;
  }

  _initFramebufferOut(gl) {
    this.framebufferOut = this._createFramebuffer(gl);
    this.framebufferOut.name = this.name;
  }

  _init(gl, vertexShader, fragmentShader) {
    this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    this._initFramebufferOut(gl);
    this.quadBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 },
      texCoord: { data: [1, 0, 1, 1, 0, 1, 0, 0] },
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

  connect(outputNode, inputNode, inputPort) {
    console.assert(typeof outputNode === 'object');
    console.assert(typeof inputNode === 'object');
    console.assert(typeof inputPort === 'string');
    this.connections.push({ output: outputNode.name, input: inputNode.name, port: inputPort });
  }

  init(gl) {
    for (const node of this.nodes) {
      node.init(gl);
    }
  }

  render(gl, time) {
    if (!this.renderedNode) return;
    const node = this.getNode(this.renderedNode);
    this._renderNode(node, gl, time);
  }

  _renderNode(node, gl, time) {
    // Check if node has inputs
    const dependencies = this.connections.filter((conn) => conn.input === node.name);
    for (const conn of dependencies) {
      const outputNode = this.getNode(conn.output);
      this._renderNode(outputNode, gl, time);
      node._setInputFramebuffer(conn.port, outputNode.framebufferOut);
    }
    node.render(gl, time);
  }
}

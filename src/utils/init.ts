import {uniq} from 'lodash-es';

import type {Scene, ShaderInfo, ShaderProgram} from '../utils/types';
import {simpleVertexShaderInfo} from '../shaders/simple.vertex';
import {simpleFragmentShaderInfo} from '../shaders/simple.fragment';

function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Shader cant be created');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Invalid shader');
  }

  return shader;
}

function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexShaderInfo: ShaderInfo,
  fragmentShaderInfo: ShaderInfo,
): ShaderProgram {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderInfo.source,
  );

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderInfo.source,
  );

  const program = gl.createProgram();

  if (!program) {
    throw new Error('Program cant be created');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Invalid program shaders');
  }

  const attributesList = uniq([
    ...vertexShaderInfo.attributes,
    ...fragmentShaderInfo.attributes,
  ]);

  const attributes: Record<string, number> = {};

  for (const attributeName of attributesList) {
    const location = gl.getAttribLocation(program, attributeName);

    if (location === -1) {
      throw new Error('Attribute is not found');
    }

    attributes[attributeName] = location;
  }

  function getAttributeLocation(attributeName: string): number {
    const location = attributes[attributeName];

    if (location === undefined) {
      throw new Error('Invalid attribute');
    }

    return location;
  }

  return {
    program,
    locations: {
      getAttributeLocation,
    },
  };
}

export function createBuffers(gl: WebGL2RenderingContext): {
  positionBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
} {
  const positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const x = 0;
  const y = 0;
  const width = 1;
  const height = 1;

  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      x1,
      y1, // vertex 0
      x2,
      y1, // vertex 1
      x1,
      y2, // vertex 2
      x2,
      y2, // vertex 3
    ]),
    gl.STATIC_DRAW,
  );

  // Index buffer initialization
  const indexBuffer = gl.createBuffer();

  if (!indexBuffer) {
    throw new Error('Cant created buffer');
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const indices = [0, 1, 2, 2, 1, 3];
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  return {
    positionBuffer,
    indexBuffer,
  };
}

export function createVao(
  gl: WebGL2RenderingContext,
  positionAttributeLocation: number,
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();

  if (!vao) {
    throw new Error('Cant create VAO');
  }

  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  const size = 2; // 2 components per iteration
  const type = gl.FLOAT; // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset,
  );

  return vao;
}

export function initialize(gl: WebGL2RenderingContext): Scene {
  const shaderProgram = createShaderProgram(
    gl,
    simpleVertexShaderInfo,
    simpleFragmentShaderInfo,
  );

  const {indexBuffer, positionBuffer} = createBuffers(gl);

  const vao = createVao(
    gl,
    shaderProgram.locations.getAttributeLocation('a_position'),
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);

  gl.useProgram(shaderProgram.program);

  return {
    shaderProgram,
    vao,
  };
}

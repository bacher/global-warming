import {uniq} from 'lodash-es';

import type {
  Scene,
  SceneObject,
  VertexShaderInfo,
  FragmentShaderInfo,
  ShaderProgram,
} from './types';
import type {ModelBufferData} from './binary';
import {matrixVertexShaderInfo} from '../shaders/matrix.vertex';
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
  vertexShaderInfo: VertexShaderInfo,
  fragmentShaderInfo: FragmentShaderInfo,
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
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Invalid program shaders');
  }

  const attributes: Record<string, number> = {};
  const uniforms: Record<string, WebGLUniformLocation | null> = {};

  const allUniforms = uniq([
    ...vertexShaderInfo.uniforms,
    ...fragmentShaderInfo.uniforms,
  ]);

  for (const attributeName of vertexShaderInfo.attributes) {
    const location = gl.getAttribLocation(program, attributeName);

    if (location === -1) {
      throw new Error('Attribute is not found');
    }

    attributes[attributeName] = location;
  }
  for (const uniformName of allUniforms) {
    const location = gl.getUniformLocation(program, uniformName);

    if (!location) {
      // throw new Error('Uniform is not found');
      console.warn(`Uniform "${uniformName} doesn't using`);
    }

    uniforms[uniformName] = location;
  }

  function getAttribute(attributeName: string): number {
    const location = attributes[attributeName];

    if (location === undefined) {
      throw new Error('Invalid attribute');
    }

    return location;
  }

  function getUniform(uniformName: string): WebGLUniformLocation | null {
    const location = uniforms[uniformName];

    if (location === undefined) {
      throw new Error('Invalid uniform');
    }

    return location;
  }

  return {
    program,
    locations: {
      getUniform,
      getAttribute,
    },
  };
}

export function createBuffers(
  gl: WebGL2RenderingContext,
  modelData: ModelBufferData,
  objects: SceneObject[],
): {
  positionBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
} {
  const positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  /*
  const floatArray = new Float32Array(earch.vertices.length * 3);

  for (let i = 0; i < earch.vertices.length; i++) {
    const vertex = earch.vertices[i];
    floatArray.set(vertex, i * 3);
  }
   */

  gl.bufferData(gl.ARRAY_BUFFER, modelData.positionData, gl.STATIC_DRAW);

  // Index buffer initialization
  const indexBuffer = gl.createBuffer();

  if (!indexBuffer) {
    throw new Error('Cant created buffer');
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  /*
  const indexArray = new Uint16Array(earch.faces.length * 3);

  for (let i = 0; i < earch.faces.length; i++) {
    const face = earch.faces[i];
    indexArray.set(
      face.map((point) => point.vertex),
      i * 3,
    );
  }
   */

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indexData, gl.STATIC_DRAW);

  console.log('a', modelData.indexData.length, modelData.facesCount * 3);

  objects.push({
    verticesCount: modelData.facesCount * 3,
  });

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

  const size = 3; // 3 components per iteration
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

export function initialize(
  gl: WebGL2RenderingContext,
  modelData: ModelBufferData,
): Scene {
  const shaderProgram = createShaderProgram(
    gl,
    matrixVertexShaderInfo,
    simpleFragmentShaderInfo,
  );

  const objects: SceneObject[] = [];

  const {indexBuffer, positionBuffer} = createBuffers(gl, modelData, objects);

  const vao = createVao(gl, shaderProgram.locations.getAttribute('a_position'));
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);

  gl.useProgram(shaderProgram.program);

  return {
    shaderProgram,
    vao,
    objects,
  };
}

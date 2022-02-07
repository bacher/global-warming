import {uniq} from 'lodash-es';

import type {
  FragmentShaderInfo,
  Scene,
  SceneObject,
  ShaderProgram,
  VertexShaderInfo,
} from './types';
import {RenderType} from './types';
import type {ModelData} from './binary';
import {matrixVertexShaderInfo} from '../shaders/matrix.vertex';
import {textureFragmentShaderInfo} from '../shaders/texture.fragment';
import type {Assets} from './loader';
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
  modelData: ModelData,
  objects: SceneObject[],
): {
  positionBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
} {
  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.positionData, gl.STATIC_DRAW);

  const uvBuffer = gl.createBuffer();
  if (!uvBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.uvData, gl.STATIC_DRAW);

  // Index buffer initialization
  const indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    throw new Error('Cant created buffer');
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indexData, gl.STATIC_DRAW);

  objects.push({
    renderType: RenderType.DRAW_ELEMENTS,
    renderMode: gl.TRIANGLES,
    indexType: gl.UNSIGNED_SHORT,
    elementsCount: modelData.facesCount * 3,
  });

  return {
    positionBuffer,
    uvBuffer,
    indexBuffer,
  };
}

function createLineBuffer(
  gl: WebGL2RenderingContext,
  data: BufferSource,
): WebGLBuffer {
  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return positionBuffer;
}

function createTexture(
  gl: WebGL2RenderingContext,
  textureImage: HTMLImageElement,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Cant create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureImage,
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  return texture;
}

type AttributesInfo = {
  location: number;
  buffer: WebGLBuffer;
};

export function createVao(
  gl: WebGL2RenderingContext,
  {
    position,
    uv,
  }: {
    position: AttributesInfo;
    uv?: AttributesInfo;
  },
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error('Cant create VAO');
  }

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, position.buffer);
  gl.enableVertexAttribArray(position.location);
  gl.vertexAttribPointer(position.location, 3, gl.FLOAT, false, 0, 0);

  if (uv) {
    gl.bindBuffer(gl.ARRAY_BUFFER, uv.buffer);
    gl.enableVertexAttribArray(uv.location);
    gl.vertexAttribPointer(uv.location, 2, gl.FLOAT, false, 0, 0);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vao;
}

export function initialize(
  gl: WebGL2RenderingContext,
  {modelData, textureImage}: Assets,
): Scene {
  const shaderProgram = createShaderProgram(
    gl,
    matrixVertexShaderInfo,
    textureFragmentShaderInfo,
  );

  const lineShaderProgram = createShaderProgram(
    gl,
    matrixVertexShaderInfo,
    simpleFragmentShaderInfo,
  );

  const objects: SceneObject[] = [];

  const {indexBuffer, positionBuffer, uvBuffer} = createBuffers(
    gl,
    modelData,
    objects,
  );

  const texture = createTexture(gl, textureImage);

  const vao = createVao(gl, {
    position: {
      location: shaderProgram.locations.getAttribute('a_position'),
      buffer: positionBuffer,
    },
    uv: {
      location: shaderProgram.locations.getAttribute('a_texcoord'),
      buffer: uvBuffer,
    },
  });
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const lineBuffer = createLineBuffer(
    gl,
    new Float32Array([10, 0, 0, -10, 0, 0]),
  );

  const linesVao = createVao(gl, {
    position: {
      location: lineShaderProgram.locations.getAttribute('a_position'),
      buffer: lineBuffer,
    },
  });

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  // gl.clearDepth(0);

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
  gl.enable(gl.DEPTH_TEST);

  objects.push({
    renderType: RenderType.DRAW_ARRAYS,
    renderMode: gl.LINES,
    elementsCount: 2,
  });

  return {
    shaderProgram,
    vao,
    lineShaderProgram,
    linesVao,
    objects,
  };
}

import {uniq} from 'lodash-es';

import type {
  FragmentShaderInfo,
  Scene,
  SceneObject,
  ShaderProgram,
  VaoObject,
  VertexShaderInfo,
} from './types';
import {
  CullFace,
  DrawArraysObject,
  ModelRenderInfo,
  ObjectType,
  SimpleModelRenderInfo,
} from './types';
import {BlendMode, ModelData, RenderMode, RenderType, SimpleMesh} from './modelTypes';
import {matrixVertexShaderInfo} from '../shaders/matrix.vertex';
import {textureMixFragmentShaderInfo} from '../shaders/textureMix.fragment';
import {simpleFragmentShaderInfo} from '../shaders/simple.fragment';
import {equatorVertexShaderInfo} from '../shaders/equator.vertex';
import {equatorFragmentShaderInfo} from '../shaders/equator.fragment';
import type {Assets} from './loader';
import {mat4} from 'gl-matrix';
import {TEXTURE_SIZE} from '../data/textures';
import {countriesVertexShaderInfo} from '../shaders/countries.vertex';
import {countriesFragmentShaderInfo} from '../shaders/countries.fragment';

const EARTH_TEXTURE_UNIT = 0;
const ATLAS_TEXTURE_UNIT = 1;
const COUNTRIES_TEXTURE_UNIT = 2;

function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
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
  let vertexShaderSource: string;
  let fragmentShaderSource: string;

  if (gl.isWebGL2) {
    vertexShaderSource = `#version 300 es\n${vertexShaderInfo.source}`;
    fragmentShaderSource = `#version 300 es\n${fragmentShaderInfo.source}`;
  } else {
    vertexShaderSource = vertexShaderInfo.source
      .replace(/\bin\b/g, 'attribute')
      .replace(/\bout\b/g, 'varying');
    fragmentShaderSource = fragmentShaderInfo.source
      .replace(/\bin\b/g, 'varying')
      .replace('out vec4 out_color;', '')
      .replace(/\bout_color\b/g, 'gl_FragColor')
      .replace(/\btexture\(/g, 'texture2D(');
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

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

  const allUniforms = uniq([...vertexShaderInfo.uniforms, ...fragmentShaderInfo.uniforms]);

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
    setUniformInt: (uniformName, value) => {
      gl.uniform1i(getUniform(uniformName), value);
    },
    setUniformUInt: (uniformName, value) => {
      gl.uniform1ui(getUniform(uniformName), value);
    },
    setUniformUIntArray: (uniformName, array) => {
      gl.uniform1uiv(getUniform(uniformName), array);
    },
    setUniformMat4: (uniformName, value) => {
      gl.uniformMatrix4fv(getUniform(uniformName), false, value);
    },
  };
}

export function createBuffers(
  gl: WebGL2RenderingContext,
  modelData: ModelData,
): {
  model: ModelRenderInfo;
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

  return {
    model: {
      renderType: RenderType.DRAW_ELEMENTS,
      renderMode: gl.TRIANGLES,
      indexType: gl.UNSIGNED_SHORT,
      elementsCount: modelData.facesCount * 3,
    },
    positionBuffer,
    uvBuffer,
    indexBuffer,
  };
}

function createModelBuffers(
  gl: WebGL2RenderingContext,
  modelData: SimpleMesh,
): {positionBuffer: WebGLBuffer; model: SimpleModelRenderInfo} {
  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.positionData, gl.STATIC_DRAW);

  return {
    model: {
      renderType: RenderType.DRAW_ARRAYS,
      renderMode: RenderMode.TRIANGLE_STRIP,
      elementsCount: modelData.verticesCount,
    },
    positionBuffer,
  };
}

function createArrayBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
  const arrayBuffer = gl.createBuffer();
  if (!arrayBuffer) {
    throw new Error('Cant create buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);

  return arrayBuffer;
}

function createStaticArrayBuffer(gl: WebGL2RenderingContext, data: BufferSource): WebGLBuffer {
  const arrayBuffer = createArrayBuffer(gl);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return arrayBuffer;
}

type TextureParams = {
  textureUnitIndex: number;
  alpha?: boolean;
  mipmap?: boolean;
};

function createTexture(
  gl: WebGL2RenderingContext,
  textureImage: HTMLImageElement,
  {textureUnitIndex, mipmap = false, alpha = false}: TextureParams,
): WebGLTexture {
  gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Cant create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  if (mipmap && gl.isWebGL2) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  if (alpha) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
  }

  if (mipmap && gl.isWebGL2) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  return texture;
}

function createEmptyTexture(
  gl: WebGL2RenderingContext,
  {width, height}: {width: number; height: number},
  {textureUnitIndex, mipmap, alpha}: TextureParams,
): WebGLTexture {
  gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);

  const targetTexture = gl.createTexture();
  if (!targetTexture) {
    throw new Error('Cant create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, targetTexture);

  if (alpha) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  }

  if (mipmap && gl.isWebGL2) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  if (mipmap && gl.isWebGL2) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  return targetTexture;
}

function createFrameBuffer(
  gl: WebGL2RenderingContext,
  targetTexture: WebGLTexture,
): WebGLFramebuffer {
  const frameBuffer = gl.createFramebuffer();
  if (!frameBuffer) {
    throw new Error('Cant create Framebuffer');
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return frameBuffer;
}

type AttributesInfo = {
  location: number;
  buffer: WebGLBuffer;
  iterationSize: number;
  normalized?: boolean;
};

export function createVao(
  gl: WebGL2RenderingContext,
  {
    attributes,
  }: {
    attributes: AttributesInfo[];
  },
): VaoObject {
  if (gl.isWebGL2) {
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error('Cant create VAO');
    }

    gl.bindVertexArray(vao);

    for (const {location, buffer, iterationSize, normalized} of attributes) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, iterationSize, gl.FLOAT, Boolean(normalized), 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return {
      // vao,
      activate: () => {
        gl.bindVertexArray(vao);
      },
    };
  } else {
    return {
      activate: () => {
        for (const {location, buffer, iterationSize, normalized} of attributes) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, iterationSize, gl.FLOAT, Boolean(normalized), 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      },
    };
  }
}

export function initialize(gl: WebGL2RenderingContext, {models, textures}: Assets): Scene {
  const shaderProgram = createShaderProgram(
    gl,
    matrixVertexShaderInfo,
    textureMixFragmentShaderInfo,
  );

  const lineShaderProgram = createShaderProgram(
    gl,
    matrixVertexShaderInfo,
    simpleFragmentShaderInfo,
  );

  const circleShaderProgram = createShaderProgram(
    gl,
    equatorVertexShaderInfo,
    equatorFragmentShaderInfo,
  );

  const countriesShaderProgram = createShaderProgram(
    gl,
    countriesVertexShaderInfo,
    countriesFragmentShaderInfo,
  );

  const objects: SceneObject[] = [];
  const frameBufferObjects: SceneObject[] = [];

  const {indexBuffer, positionBuffer, uvBuffer, model} = createBuffers(gl, models.earth);

  const earthTexture = createTexture(gl, textures.earth, {
    textureUnitIndex: EARTH_TEXTURE_UNIT,
    mipmap: true,
  });
  const countriesAtlasTexture = createTexture(gl, textures.countriesAtlas, {
    textureUnitIndex: ATLAS_TEXTURE_UNIT,
  });
  const countriesTexture = createEmptyTexture(gl, TEXTURE_SIZE, {
    textureUnitIndex: COUNTRIES_TEXTURE_UNIT,
    alpha: true,
    mipmap: true,
  });

  // gl.bindTexture(gl.TEXTURE_2D, null);

  const countriesFrameBuffer = createFrameBuffer(gl, countriesTexture);

  gl.useProgram(countriesShaderProgram.program);
  countriesShaderProgram.setUniformInt('u_texture', ATLAS_TEXTURE_UNIT);

  const trianglePositionBuffer = createArrayBuffer(gl);
  const triangleUvBuffer = createArrayBuffer(gl);
  const triangleColorBuffer = createArrayBuffer(gl);

  const triangleVao = createVao(gl, {
    attributes: [
      {
        location: countriesShaderProgram.locations.getAttribute('a_position'),
        buffer: trianglePositionBuffer,
        iterationSize: 3,
      },
      {
        location: countriesShaderProgram.locations.getAttribute('a_texcoord'),
        buffer: triangleUvBuffer,
        iterationSize: 2,
        normalized: true,
      },
      {
        location: countriesShaderProgram.locations.getAttribute('a_color'),
        buffer: triangleColorBuffer,
        iterationSize: 4,
        // normalized: true,
      },
    ],
  });

  const countriesObject: DrawArraysObject = {
    id: 'triangle',
    objectType: ObjectType.COUNTRIES,
    vao: triangleVao,
    cullFace: CullFace.OFF,
    disableDepthTest: true,
    renderType: RenderType.DRAW_ARRAYS,
    renderMode: RenderMode.TRIANGLES,
    blendMode: BlendMode.MIX,
    elementsCount: 0,
    hidden: true,
    updateBuffers: (positionData: number[], uvData: number[], colorData: number[]) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglePositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleUvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.DYNAMIC_DRAW);

      countriesObject.elementsCount = positionData.length / 3;
    },
  };

  frameBufferObjects.push(countriesObject);

  gl.useProgram(shaderProgram.program);

  const vao = createVao(gl, {
    attributes: [
      {
        location: shaderProgram.locations.getAttribute('a_position'),
        buffer: positionBuffer,
        iterationSize: 3,
      },
      {
        location: shaderProgram.locations.getAttribute('a_texcoord'),
        buffer: uvBuffer,
        iterationSize: 2,
        normalized: true,
      },
    ],
  });
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniform1i(shaderProgram.locations.getUniform('u_texture'), EARTH_TEXTURE_UNIT);
  gl.uniform1i(shaderProgram.locations.getUniform('u_texture2'), COUNTRIES_TEXTURE_UNIT);

  const earthMatrix = mat4.create();
  mat4.fromRotation(earthMatrix, -0.064 * Math.PI, [0, 1, 0]);
  mat4.scale(earthMatrix, earthMatrix, [-1, -1, -1]);

  objects.push({
    ...model,
    id: 'earth',
    matrix: earthMatrix,
    objectType: ObjectType.EARTH,
    vao,
    cullFace: CullFace.FRONT,
  });

  const lineBuffer = createStaticArrayBuffer(gl, new Float32Array([10, 0, 0, -10, 0, 0]));

  const linesVao = createVao(gl, {
    attributes: [
      {
        location: lineShaderProgram.locations.getAttribute('a_position'),
        buffer: lineBuffer,
        iterationSize: 3,
      },
    ],
  });

  objects.push({
    vao: linesVao,
    id: 'pointerLine',
    objectType: ObjectType.LINE,
    renderType: RenderType.DRAW_ARRAYS,
    renderMode: RenderMode.LINES,
    elementsCount: 2,
    disableDepthTest: true,
  });

  const circleBuffers = createModelBuffers(gl, models.circle);

  const circleVao = createVao(gl, {
    attributes: [
      {
        location: circleShaderProgram.locations.getAttribute('a_position'),
        buffer: circleBuffers.positionBuffer,
        iterationSize: 3,
      },
    ],
  });

  // Meridians
  for (let i = 0; i < 4; i++) {
    objects.push({
      id: 'meridian',
      objectType: ObjectType.CIRCLE,
      vao: circleVao,
      disableDepthTest: true,
      matrix: mat4.fromRotation(mat4.create(), 0.25 * i * Math.PI, [0, 1, 0]),
      ...circleBuffers.model,
    });
  }

  // Equator
  objects.push({
    id: 'equator',
    objectType: ObjectType.CIRCLE,
    vao: circleVao,
    disableDepthTest: true,
    matrix: mat4.fromRotation(mat4.create(), Math.PI / 2, [1, 0, 0]),
    ...circleBuffers.model,
  });

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);

  // gl.enable(gl.CULL_FACE);
  // gl.cullFace(gl.FRONT);
  // gl.enable(gl.DEPTH_TEST);

  return {
    lineBuffer,
    objects,
    shaders: {
      main: shaderProgram,
      line: lineShaderProgram,
      countries: countriesShaderProgram,
      circle: circleShaderProgram,
    },
    frameBufferObjects,
    countriesFrameBuffer,
  };
}

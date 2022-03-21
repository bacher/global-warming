import {mat4} from 'gl-matrix';

import {TEXTURE_SIZE} from '../data/textures';
import type {GameState, Scene, ShaderProgram, Shaders} from './types';
import {CullFace, GameType, ObjectType, ViewportSize} from './types';
import {BlendMode, RenderType} from './modelTypes';
import {countries} from '../data/countries';

export type DrawParams = {
  width: number;
  height: number;
  direction: {spin: number; roll: number};
  distance: number;
  gameState: GameState;
};

function getCameraTransform({aspectRatio}: {aspectRatio: number}): mat4 {
  return mat4.perspective(mat4.create(), Math.PI / 8, aspectRatio, 0.001, 2000);
}

const cameraMatrixData: {
  matrix: mat4 | undefined;
  aspectRatio: number | undefined;
} = {
  matrix: undefined,
  aspectRatio: undefined,
};

function neverCall(x: never): void {
  throw new Error('Never');
}

const current: {
  frameBuffer: WebGLFramebuffer | undefined;
  viewport: ViewportSize;
  shader: WebGLProgram | undefined;
  vao: WebGLVertexArrayObject | undefined;
  isCullFaceEnabled: boolean;
  cullFace: CullFace;
  depthTest: boolean | undefined;
  isBlendModeEnabled: boolean;
  blendMode: BlendMode;
  countriesTextureState: unknown;
} = {
  frameBuffer: undefined,
  viewport: {width: 0, height: 0},
  shader: undefined,
  vao: undefined,
  isCullFaceEnabled: false,
  cullFace: CullFace.BACK,
  depthTest: undefined,
  isBlendModeEnabled: false,
  blendMode: BlendMode.OFF,
  countriesTextureState: undefined,
};

function chooseShader(shaders: Shaders, objectType: ObjectType) {
  switch (objectType) {
    case ObjectType.EARTH:
      return shaders.main;
    case ObjectType.LINE:
      return shaders.line;
    case ObjectType.CIRCLE:
      return shaders.circle;
    case ObjectType.COUNTRIES:
      return shaders.countries;
  }
}

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  params: DrawParams,
): {earthMatrix: mat4} {
  const {shaders} = scene;
  const {gameState} = params;

  function setFramebuffer(frameBuffer: WebGLFramebuffer | undefined) {
    if (current.frameBuffer !== frameBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer ?? null);
      current.frameBuffer = frameBuffer;
    }
  }

  function setViewport(width: number, height: number) {
    if (current.viewport.width !== width || current.viewport.height !== height) {
      gl.viewport(0, 0, width, height);
      current.viewport = {width, height};
    }
  }

  function setShaderProgram(shader: ShaderProgram) {
    if (current.shader !== shader.program) {
      gl.useProgram(shader.program);
      current.shader = shader.program;
    }
  }

  function setVao(vao: WebGLVertexArrayObject | undefined) {
    if (current.vao !== vao) {
      gl.bindVertexArray(vao ?? null);
      current.vao = vao;
    }
  }

  function setCullFace(cullFace: CullFace) {
    if (cullFace === CullFace.OFF) {
      if (current.isCullFaceEnabled) {
        gl.disable(gl.CULL_FACE);
        current.isCullFaceEnabled = false;
      }
    } else {
      if (!current.isCullFaceEnabled) {
        gl.enable(gl.CULL_FACE);
        current.isCullFaceEnabled = true;
      }

      if (cullFace !== current.cullFace) {
        gl.cullFace(cullFace);
        current.cullFace = cullFace;
      }
    }
  }

  function setDepthTest(enable: boolean) {
    if (current.depthTest !== enable) {
      if (enable) {
        gl.enable(gl.DEPTH_TEST);
      } else {
        gl.disable(gl.DEPTH_TEST);
      }
      current.depthTest = enable;
    }
  }

  function setBlendMode(blendMode: BlendMode) {
    if (blendMode === BlendMode.OFF) {
      if (current.isBlendModeEnabled) {
        gl.disable(gl.BLEND);
        current.isBlendModeEnabled = false;
      }
    } else {
      if (!current.isBlendModeEnabled) {
        gl.enable(gl.BLEND);
        current.isBlendModeEnabled = true;
      }

      if (blendMode !== current.blendMode) {
        switch (blendMode) {
          case BlendMode.MIX:
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); //
            // gl.blendFunc(gl.SRC_ALPHA, gl.SRC_ALPHA_SATURATE); //
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Work when premultiplied in shader
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Work when texture is RGB
            break;
          default:
            throw neverCall(blendMode);
        }
        current.blendMode = blendMode;
      }
    }
  }

  // Render country texture

  if (gameState.countriesState !== current.countriesTextureState) {
    setFramebuffer(scene.countriesFrameBuffer);
    setViewport(TEXTURE_SIZE.width, TEXTURE_SIZE.height);
    // setViewport(gl.canvas.width, gl.canvas.height);

    // TODO: move to init
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const obj of scene.frameBufferObjects) {
      if (obj.id === 'triangle') {
        const posData = [];
        const uvData = [];
        const colorData = [];

        for (const {countryId, color} of gameState.countriesState) {
          const {atlasData} = countries.get(countryId)!;

          for (const area of atlasData) {
            const {uv1, uv2} = area;

            const x0 = (area.srcX / TEXTURE_SIZE.width) * 2 - 1;
            const y0 = (area.srcY / TEXTURE_SIZE.height) * 2 - 1;
            const x1 = x0 + (area.width / TEXTURE_SIZE.width) * 2;
            const y1 = y0 + (area.height / TEXTURE_SIZE.height) * 2;

            const p1 = [x0, y0, 0];
            const p2 = [x1, y0, 0];
            const p3 = [x0, y1, 0];
            const p4 = [x1, y1, 0];

            const u1 = [uv1.u, uv1.v];
            const u2 = [uv2.u, uv1.v];
            const u3 = [uv1.u, uv2.v];
            const u4 = [uv2.u, uv2.v];

            posData.push(...[...p1, ...p2, ...p3, ...p2, ...p3, ...p4]);
            uvData.push(...[...u1, ...u2, ...u3, ...u2, ...u3, ...u4]);
            colorData.push(...[...color, ...color, ...color, ...color, ...color, ...color]);
          }
        }

        obj.updateBuffers!(posData, uvData, colorData);
        obj.hidden = false;
      }

      if (obj.hidden || obj.elementsCount === 0) {
        continue;
      }

      const shader = chooseShader(shaders, obj.objectType);
      setShaderProgram(shader);
      setVao(obj.vao.vao);
      setCullFace(obj.cullFace ?? CullFace.BACK);
      setDepthTest(!obj.disableDepthTest);
      setBlendMode(obj.blendMode ?? BlendMode.OFF);

      switch (obj.renderType) {
        case RenderType.DRAW_ARRAYS:
          gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
          break;
        default:
          throw new Error();
      }
    }

    gl.generateMipmap(gl.TEXTURE_2D);

    current.countriesTextureState = gameState.countriesState;
  }

  setFramebuffer(undefined);
  setViewport(gl.canvas.width, gl.canvas.height);

  // if (Math.random() < 3) {
  //   return {} as any;
  // }

  // Render frame

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspectRatio = params.width / params.height;
  if (!cameraMatrixData.matrix || cameraMatrixData.aspectRatio !== aspectRatio) {
    cameraMatrixData.matrix = getCameraTransform({aspectRatio});
    cameraMatrixData.aspectRatio = aspectRatio;
  }

  const matrix = mat4.clone(cameraMatrixData.matrix);
  mat4.translate(matrix, matrix, [0, 0, -params.distance]);
  mat4.rotateX(matrix, matrix, -params.direction.roll);
  mat4.rotateY(matrix, matrix, -params.direction.spin);

  let earthMatrix: mat4;

  for (const obj of scene.objects) {
    if (obj.hidden || obj.elementsCount === 0) {
      continue;
    }

    const shader = chooseShader(shaders, obj.objectType);
    setShaderProgram(shader);
    setVao(obj.vao.vao);
    setCullFace(obj.cullFace ?? CullFace.BACK);
    setDepthTest(!obj.disableDepthTest);
    setBlendMode(obj.blendMode ?? BlendMode.OFF);

    let uMatrix: mat4;

    if (obj.matrix) {
      uMatrix = mat4.mul(mat4.create(), matrix, obj.matrix);
    } else {
      uMatrix = matrix;
    }

    if (obj.id === 'earth') {
      earthMatrix = uMatrix;
    }

    shader.setUniformMat4('u_matrix', uMatrix);

    if (obj.id === 'pointerLine') {
      continue;
      /*
      if (!params.pointer) {
        continue;
      }
      updatePointerDirectionBuffer(gl, params.pointer, matrix, scene.lineBuffer);
       */
    }

    switch (obj.renderType) {
      case RenderType.DRAW_ELEMENTS: {
        gl.drawElements(obj.renderMode, obj.elementsCount, obj.indexType, 0);
        break;
      }
      case RenderType.DRAW_ARRAYS:
        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
        break;
    }
  }

  return {
    earthMatrix: earthMatrix!,
  };
}

export function compareDrawParams(p1: DrawParams, p2: DrawParams): boolean {
  return (
    p1.width === p2.width &&
    p1.height === p2.height &&
    p1.gameState === p2.gameState &&
    p1.direction === p2.direction &&
    p1.distance === p2.distance
  );
}

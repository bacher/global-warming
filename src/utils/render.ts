import {mat4} from 'gl-matrix';

import {countries, mapCountriesToColor} from '../data/countries';
import type {GameState, Scene} from './types';
import {CullFace, GameType} from './types';
import {RenderType} from './modelTypes';
import {updatePointerDirectionBuffer} from './debug';

export type DrawParams = {
  width: number;
  height: number;
  direction: {spin: number; roll: number};
  distance: number;
  gameState: GameState;
};

export type DrawCallbacks = {
  debugOnFrame?: (params: {matrix: mat4}) => void;
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

const current: {
  shader: WebGLProgram | undefined;
  vao: WebGLVertexArrayObject | undefined;
  cullFace: CullFace;
  depthTest: boolean | undefined;
  successCountries: unknown | undefined;
  failedCountries: unknown | undefined;
} = {
  shader: undefined,
  vao: undefined,
  cullFace: CullFace.BACK,
  depthTest: undefined,
  successCountries: undefined,
  failedCountries: undefined,
};

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  params: DrawParams,
): {earthMatrix: mat4} {
  const {gameState} = params;

  const aspectRatio = params.width / params.height;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (!cameraMatrixData.matrix || cameraMatrixData.aspectRatio !== aspectRatio) {
    cameraMatrixData.matrix = getCameraTransform({aspectRatio});
    cameraMatrixData.aspectRatio = aspectRatio;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  function setShaderProgram(program: WebGLProgram) {
    if (current.shader !== program) {
      gl.useProgram(program);
      current.shader = program;
    }
  }

  function setVao(vao: WebGLVertexArrayObject | undefined) {
    if (current.vao !== vao) {
      gl.bindVertexArray(vao ?? null);
      current.vao = vao;
    }
  }

  function setCullFace(cullFace: CullFace) {
    if (current.cullFace !== cullFace) {
      gl.cullFace(cullFace);
      current.cullFace = cullFace;
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

  const matrix = mat4.clone(cameraMatrixData.matrix);
  mat4.translate(matrix, matrix, [0, 0, -params.distance]);
  mat4.rotateX(matrix, matrix, -params.direction.roll);
  mat4.rotateY(matrix, matrix, -params.direction.spin);

  let earthMatrix: mat4;

  for (const obj of scene.objects) {
    setShaderProgram(obj.shaderProgram.program);
    setVao(obj.vao);
    setCullFace(obj.cullFace ?? CullFace.BACK);
    setDepthTest(!obj.disableDepthTest);

    let uMatrix: mat4;

    if (obj.matrix) {
      uMatrix = mat4.mul(mat4.create(), matrix, obj.matrix);
    } else {
      uMatrix = matrix;
    }

    if (obj.id === 'earth') {
      earthMatrix = uMatrix;
    }

    obj.shaderProgram.setUniformMat4('u_matrix', uMatrix);

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
        const selectedCountryId =
          gameState.type === GameType.GAME ||
          gameState.type === GameType.QUIZ ||
          gameState.type === GameType.DISCOVERY
            ? gameState.selectedCountry
            : undefined;

        const selectedCountry = selectedCountryId ? countries.get(selectedCountryId) : undefined;

        obj.shaderProgram.setUniformUInt('u_selected', selectedCountry?.color ?? 0);

        if (gameState.type === GameType.GAME) {
          if (current.successCountries !== gameState.successCountries) {
            current.successCountries = gameState.successCountries;

            const uSuccess = new Uint32Array(200);
            uSuccess.set(mapCountriesToColor(gameState.successCountries));
            obj.shaderProgram.setUniformUIntArray('u_success', uSuccess);
          }

          if (current.failedCountries !== gameState.failedCountries) {
            current.failedCountries = gameState.failedCountries;

            const uFailed = new Uint32Array(10);
            uFailed.set(mapCountriesToColor(gameState.failedCountries));
            obj.shaderProgram.setUniformUIntArray('u_failed', uFailed);
          }
        }

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

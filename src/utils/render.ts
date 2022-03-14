import {mat4} from 'gl-matrix';

import {countries, mapCountriesToColor} from '../data/countries';
import {ATLAS_SIZE, TEXTURE_SIZE} from '../data/textures';
import atlas from '../data/atlas.json';
import type {GameState, Scene, ShaderProgram, Shaders} from './types';
import {CullFace, GameType, ObjectType} from './types';
import {RenderType} from './modelTypes';

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

const current: {
  shader: WebGLProgram | undefined;
  vao: WebGLVertexArrayObject | undefined;
  isCullFaceEnabled: boolean;
  cullFace: CullFace;
  depthTest: boolean | undefined;
  successCountries: unknown | undefined;
  failedCountries: unknown | undefined;
} = {
  shader: undefined,
  vao: undefined,
  isCullFaceEnabled: false,
  cullFace: CullFace.BACK,
  depthTest: undefined,
  successCountries: undefined,
  failedCountries: undefined,
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
    } else if (current.cullFace !== cullFace) {
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

  // Render country texture

  gl.bindFramebuffer(gl.FRAMEBUFFER, scene.countriesFrameBuffer);
  gl.viewport(0, 0, TEXTURE_SIZE.width, TEXTURE_SIZE.height);
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const obj of scene.frameBufferObjects) {
    if (obj.id === 'triangle') {
      setVao(obj.vao.vao);
      setCullFace(obj.cullFace ?? CullFace.BACK);
      setDepthTest(!obj.disableDepthTest);

      for (const country of atlas) {
        if (country.color === 247) {
          setShaderProgram(shaders.countriesRed);
        } else {
          setShaderProgram(shaders.countries);
        }

        const x0 = (country.srcX / TEXTURE_SIZE.width) * 2 - 1;
        const y0 = (country.srcY / TEXTURE_SIZE.height) * 2 - 1;
        const x1 = x0 + (country.width / TEXTURE_SIZE.width) * 2;
        const y1 = y0 + (country.height / TEXTURE_SIZE.height) * 2;

        const ux0 = country.x / ATLAS_SIZE.width;
        const uy0 = country.y / ATLAS_SIZE.height;
        const ux1 = ux0 + country.width / ATLAS_SIZE.width;
        const uy1 = uy0 + country.height / ATLAS_SIZE.height;

        const p1 = [x0, y0, 0];
        const p2 = [x1, y0, 0];
        const p3 = [x0, y1, 0];
        const p4 = [x1, y1, 0];

        const u1 = [ux0, uy0];
        const u2 = [ux1, uy0];
        const u3 = [ux0, uy1];
        const u4 = [ux1, uy1];

        // TODO: Fill buffers during init, and draw by offset + count!!!
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.vao.positionBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([...p1, ...p2, ...p3, ...p2, ...p3, ...p4]),
          gl.DYNAMIC_DRAW,
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.vao.uvBuffer!);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([...u1, ...u2, ...u3, ...u2, ...u3, ...u4]),
          gl.DYNAMIC_DRAW,
        );

        obj.elementsCount = 6;
        obj.hidden = false;

        /*
        let framebufferTexture;
        let textureIndex;

        if (counter % 2 === 0) {
          framebufferTexture = (window as any).t2;
          textureIndex = 3;
        } else {
          framebufferTexture = (window as any).t3;
          textureIndex = 0;
        }
        counter++;

        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          framebufferTexture,
          0,
        );
        obj.shaderProgram.setUniformInt('u_texture2', textureIndex);
         */

        /*
        gl.bindTexture(gl.TEXTURE_2D, (window as any).t3);
        gl.copyTexImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          0,
          0,
          TEXTURE_SIZE.width,
          TEXTURE_SIZE.height,
          0,
        );
         */

        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
      }
    }

    /*
    if (!obj.hidden && obj.elementsCount !== 0) {
      if (obj.renderType === RenderType.DRAW_ARRAYS) {
        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
      }
    }
     */
  }

  // if (Math.random() < 3) {
  //   return {} as any;
  // }

  // Render frame

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const aspectRatio = params.width / params.height;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // TODO
  // if (!cameraMatrixData.matrix || cameraMatrixData.aspectRatio !== aspectRatio) {
  cameraMatrixData.matrix = getCameraTransform({aspectRatio});
  cameraMatrixData.aspectRatio = aspectRatio;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // }

  const matrix = mat4.clone(cameraMatrixData.matrix);
  mat4.translate(matrix, matrix, [0, 0, -params.distance]);
  mat4.rotateX(matrix, matrix, -params.direction.roll);
  mat4.rotateY(matrix, matrix, -params.direction.spin);

  let earthMatrix: mat4;

  for (const obj of scene.objects) {
    const shader = chooseShader(shaders, obj.objectType);

    setShaderProgram(shader);
    setVao(obj.vao.vao);
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
        const selectedCountryId =
          gameState.type === GameType.GAME ||
          gameState.type === GameType.QUIZ ||
          gameState.type === GameType.DISCOVERY
            ? gameState.selectedCountry
            : undefined;

        const selectedCountry = selectedCountryId ? countries.get(selectedCountryId) : undefined;

        shader.setUniformUInt('u_selected', selectedCountry?.color ?? 0);

        if (gameState.type === GameType.GAME) {
          if (current.successCountries !== gameState.successCountries) {
            current.successCountries = gameState.successCountries;

            const uSuccess = new Uint32Array(200);
            uSuccess.set(mapCountriesToColor(gameState.successCountries));
            shader.setUniformUIntArray('u_success', uSuccess);
          }

          if (current.failedCountries !== gameState.failedCountries) {
            current.failedCountries = gameState.failedCountries;

            const uFailed = new Uint32Array(10);
            uFailed.set(mapCountriesToColor(gameState.failedCountries));
            shader.setUniformUIntArray('u_failed', uFailed);
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

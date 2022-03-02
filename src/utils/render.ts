import {mat4, vec3} from 'gl-matrix';

import type {GameState, Scene, ShaderProgram} from './types';
import {CullFace} from './types';
import {countries} from '../data/countries';
import {RenderType} from './modelTypes';

type Options = {
  width: number;
  height: number;
  time: number;
  pointer: {x: number; y: number} | undefined;
  direction: {spin: number; roll: number};
  distance: number;
  debugOnFrame?: (params: {matrix: mat4}) => void;
};

function getCameraTransform({aspectRatio}: {aspectRatio: number}): mat4 {
  return mat4.perspective(mat4.create(), Math.PI / 8, aspectRatio, 0.001, 2000);
}

const cameraMatrix = getCameraTransform({aspectRatio: 800 / 600});

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  gameState: GameState,
  options: Options,
) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const current: {
    shader: WebGLProgram | undefined;
    vao: WebGLVertexArrayObject | undefined;
    cullFace: CullFace;
    depthTest: boolean | undefined;
  } = {
    shader: undefined,
    vao: undefined,
    cullFace: gl.BACK,
    depthTest: undefined,
  };

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

  const matrix = mat4.clone(cameraMatrix);
  mat4.translate(matrix, matrix, [0, 0, -options.distance]);
  mat4.rotateX(matrix, matrix, -options.direction.roll);
  mat4.rotateY(matrix, matrix, -options.direction.spin);

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
      if (options.pointer) {
        const start = vec3.fromValues(options.pointer.x, options.pointer.y, 0);
        const end = vec3.fromValues(options.pointer.x, options.pointer.y, -1);

        const invertedMatrix = mat4.create();
        mat4.invert(invertedMatrix, matrix);
        vec3.transformMat4(start, start, invertedMatrix);
        vec3.transformMat4(end, end, invertedMatrix);

        const dir = vec3.sub(vec3.create(), start, end);
        const len = 100 * (1 / vec3.len(dir));
        vec3.scale(dir, dir, len);
        vec3.add(end, start, dir);
        vec3.sub(start, start, dir);

        /*
        const outputElement = document.getElementById('output');
    
        if (outputElement) {
          outputElement.innerText = `${formatVec3(start)}\n${formatVec3(end)}`;
        }
         */

        gl.bindBuffer(gl.ARRAY_BUFFER, scene.lineBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          // new Float32Array([10, 10 * Math.sin(options.time * 0.0005), 0, -10, 0, 0]),
          new Float32Array([
            start[0],
            start[1],
            start[2],
            end[0],
            end[1],
            end[2],
          ]),
          gl.DYNAMIC_DRAW,
        );
      } else {
        continue;
      }
    }

    switch (obj.renderType) {
      case RenderType.DRAW_ELEMENTS: {
        const selectedCountry = gameState.selectedCountry
          ? countries.get(gameState.selectedCountry)
          : undefined;

        obj.shaderProgram.setUniformInt(
          'u_selected',
          selectedCountry?.color ?? 0,
        );

        gl.drawElements(obj.renderMode, obj.elementsCount, obj.indexType, 0);
        break;
      }
      case RenderType.DRAW_ARRAYS:
        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
        break;
    }
  }

  if (options.debugOnFrame) {
    options.debugOnFrame({
      matrix: earthMatrix!,
    });
  }
}

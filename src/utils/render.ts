import {mat4, vec3} from 'gl-matrix';

import type {GameState, Scene, ShaderProgram} from './types';
import {RenderType} from './types';
import {formatVec3} from './format';

type Options = {
  width: number;
  height: number;
  time: number;
  pointer: {x: number; y: number} | undefined;
  direction: {spin: number; roll: number};
  distance: number;
  debugOnFrame?: (params: {matrix: mat4}) => void;
};

function setUniformMatrixData(
  gl: WebGL2RenderingContext,
  shaderProgram: ShaderProgram,
  uniformName: string,
  value: Float32List,
) {
  gl.uniformMatrix4fv(
    shaderProgram.locations.getUniform(uniformName),
    false,
    value,
  );
}

function getInitialTransformation(): mat4 {
  const matrix = mat4.create();

  mat4.rotateX(matrix, matrix, Math.PI / 4);
  mat4.rotateY(matrix, matrix, Math.PI / 2);
  mat4.rotateX(matrix, matrix, Math.PI / 2);
  mat4.rotateY(matrix, matrix, Math.PI / 4);
  mat4.rotateZ(matrix, matrix, Math.PI / 2);
  mat4.scale(matrix, matrix, [-1, 1, 1]);

  return matrix;
}

const initialTransform = getInitialTransformation();

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

  const matrix = mat4.clone(cameraMatrix);
  mat4.translate(matrix, matrix, [0, 0, -options.distance]);
  mat4.rotateX(matrix, matrix, -options.direction.roll);
  mat4.rotateY(matrix, matrix, -options.direction.spin);
  mat4.mul(matrix, matrix, initialTransform);

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
      new Float32Array([start[0], start[1], start[2], end[0], end[1], end[2]]),
      gl.DYNAMIC_DRAW,
    );
  }

  for (const obj of scene.objects) {
    switch (obj.renderType) {
      case RenderType.DRAW_ELEMENTS:
        gl.useProgram(scene.shaderProgram.program);
        gl.bindVertexArray(scene.vao);
        setUniformMatrixData(gl, scene.shaderProgram, 'u_matrix', matrix);
        gl.uniform1ui(
          scene.shaderProgram.locations.getUniform('u_selected'),
          gameState.selectedCountry ?? 0,
        );

        gl.drawElements(obj.renderMode, obj.elementsCount, obj.indexType, 0);
        break;
      case RenderType.DRAW_ARRAYS:
        if (!options.pointer) {
          break;
        }

        gl.useProgram(scene.lineShaderProgram.program);
        gl.bindVertexArray(scene.linesVao);
        setUniformMatrixData(gl, scene.lineShaderProgram, 'u_matrix', matrix);

        gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
        gl.enable(gl.DEPTH_TEST);
        break;
    }
  }

  if (options.debugOnFrame) {
    options.debugOnFrame({
      matrix,
    });
  }
}

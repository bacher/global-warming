import {mat4, vec3} from 'gl-matrix';

import type {Scene, ShaderProgram} from './types';
import {RenderType} from './types';
import {formatVec3} from './format';

type Options = {
  width: number;
  height: number;
  time: number;
};

function setUniformData(
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
  const matrix = mat4.create();
  mat4.perspective(matrix, Math.PI / 8, aspectRatio, 0.001, 2000);
  mat4.translate(matrix, matrix, [0, 0, -20]);
  return matrix;
}

const cameraMatrix = getCameraTransform({aspectRatio: 800 / 600});

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  options: Options,
) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const matrix = mat4.create();
  mat4.rotateY(matrix, cameraMatrix, options.time * 0.0005);
  mat4.mul(matrix, matrix, initialTransform);

  const start = vec3.fromValues(0, 0, 0);
  const end = vec3.fromValues(0, 0, -1);

  const invertedMatrix = mat4.create();
  mat4.invert(invertedMatrix, matrix);
  vec3.transformMat4(start, start, invertedMatrix);
  vec3.transformMat4(end, end, invertedMatrix);

  const outputElement = document.getElementById('output');

  if (outputElement) {
    outputElement.innerText = `${formatVec3(start)}\n${formatVec3(end)}`;
  }

  gl.uniformMatrix4fv(
    scene.shaderProgram.locations.getUniform('u_matrix'),
    false,
    matrix,
  );

  for (const obj of scene.objects) {
    switch (obj.renderType) {
      case RenderType.DRAW_ELEMENTS:
        gl.useProgram(scene.shaderProgram.program);
        gl.bindVertexArray(scene.vao);
        setUniformData(gl, scene.shaderProgram, 'u_matrix', matrix);

        gl.drawElements(obj.renderMode, obj.elementsCount, obj.indexType, 0);
        break;
      case RenderType.DRAW_ARRAYS:
        gl.useProgram(scene.lineShaderProgram.program);
        gl.bindVertexArray(scene.linesVao);
        setUniformData(gl, scene.lineShaderProgram, 'u_matrix', matrix);

        gl.drawArrays(obj.renderMode, 0, obj.elementsCount);
        break;
    }
  }
}

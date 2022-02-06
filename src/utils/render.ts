import {mat4} from 'gl-matrix';

import type {Scene} from './types';

type Options = {
  width: number;
  height: number;
  time: number;
};

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  options: Options,
) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(scene.vao);

  const matrix = mat4.create();
  mat4.perspective(
    matrix,
    Math.PI / 8,
    options.width / options.height,
    0.001,
    2000,
  );
  mat4.translate(matrix, matrix, [0, 0, -20]);
  mat4.rotateY(matrix, matrix, options.time * 0.0005);
  mat4.rotateX(matrix, matrix, Math.PI / 4);
  mat4.rotateY(matrix, matrix, Math.PI / 2);
  mat4.rotateX(matrix, matrix, Math.PI / 2);
  mat4.rotateY(matrix, matrix, Math.PI / 4);
  mat4.rotateZ(matrix, matrix, Math.PI / 2);
  mat4.scale(matrix, matrix, [-1, 1, 1]);

  gl.uniformMatrix4fv(
    scene.shaderProgram.locations.getUniform('u_matrix'),
    false,
    matrix,
  );

  for (const obj of scene.objects) {
    // TODO: Maybe replace by gl.UNSIGNED_INT
    gl.drawElements(gl.TRIANGLES, obj.verticesCount, gl.UNSIGNED_SHORT, 0);
  }
}

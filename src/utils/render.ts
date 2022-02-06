import {mat4} from 'gl-matrix';

import type {Scene} from './types';

type Options = {
  width: number;
  height: number;
};

export function draw(
  gl: WebGL2RenderingContext,
  scene: Scene,
  options: Options,
) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindVertexArray(scene.vao);

  const matrix = mat4.create();
  mat4.scale(matrix, matrix, [1 / 10, 1 / 10, 1 / 10]);

  gl.uniformMatrix4fv(
    scene.shaderProgram.locations.getUniform('u_matrix'),
    false,
    matrix,
  );

  for (const obj of scene.objects) {
    // TODO: Maybe replace by gl.UNSIGNED_INT
    gl.drawElements(gl.TRIANGLES, obj.verticesCount, gl.UNSIGNED_SHORT, 0);
  }

  console.log('drawn');
}

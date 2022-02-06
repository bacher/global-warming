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

  for (const obj of scene.objects) {
    // TODO: Maybe replace by gl.UNSIGNED_INT
    gl.drawElements(gl.TRIANGLES, obj.verticesCount, gl.UNSIGNED_SHORT, 0);
  }

  console.log('drawn');
}

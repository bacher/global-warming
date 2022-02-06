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

  // Draw the rectangle.
  const offset = 0;
  const count = 6;
  const indexType = gl.UNSIGNED_SHORT;
  gl.drawElements(gl.TRIANGLES, count, indexType, offset);

  console.log('drawn');
}

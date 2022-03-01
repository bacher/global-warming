import {RenderMode, RenderType, SimpleMesh} from './modelTypes';

type CircleParams = {
  segments: number;
  width: number;
  radius: number;
};

export function generateCircle({
  radius,
  segments,
  width,
}: CircleParams): SimpleMesh {
  const verticesCount = (segments + 1) * 2;
  const buffer = new Float32Array(verticesCount * 3);

  const halfWidth = width / 2;

  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    buffer.set([x, y, halfWidth, x, y, -halfWidth], i * 3 * 2);
  }

  return {
    renderType: RenderType.DRAW_ARRAYS,
    renderMode: RenderMode.TRIANGLE_STRIP,
    positionData: buffer,
    verticesCount,
  };
}

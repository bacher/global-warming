import {vec3, mat4} from 'gl-matrix';

import type {ModelData} from './binary';

const visionDir = vec3.fromValues(0, 0, 1);

function sign(p1: vec3, p2: vec3, p3: vec3): number {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function pointInTriangle(pt: vec3, v1: vec3, v2: vec3, v3: vec3): boolean {
  const d1 = sign(pt, v1, v2);
  const d2 = sign(pt, v2, v3);
  const d3 = sign(pt, v3, v1);

  const has_neg = d1 < 0 || d2 < 0 || d3 < 0;
  const has_pos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(has_neg && has_pos);
}

type Params = {
  ctx: CanvasRenderingContext2D;
  matrix: mat4;
  modelData: ModelData;
  cursor?: vec3;
};

export function debugFrame({ctx, matrix, modelData, cursor}: Params) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 800, 600);
  ctx.scale(800 / 2, 600 / 2);
  ctx.translate(1, 1);
  ctx.scale(1, -1);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.002;
  // ctx.beginPath();
  // ctx.moveTo(0, 0);
  // ctx.lineTo(0.5, 0.5);
  // ctx.closePath();
  // ctx.stroke();

  const cursorTriangles = [];

  for (let i = 0; i < modelData.indexData.length; i += 3) {
    const v1 = modelData.indexData[i];
    const v2 = modelData.indexData[i + 1];
    const v3 = modelData.indexData[i + 2];

    const v1p = modelData.positionData.slice(v1 * 3, v1 * 3 + 3);
    const v2p = modelData.positionData.slice(v2 * 3, v2 * 3 + 3);
    const v3p = modelData.positionData.slice(v3 * 3, v3 * 3 + 3);

    const v1np = vec3.transformMat4(vec3.create(), v1p, matrix);
    const v2np = vec3.transformMat4(vec3.create(), v2p, matrix);
    const v3np = vec3.transformMat4(vec3.create(), v3p, matrix);

    const t1 = vec3.sub(vec3.create(), v2np, v1np);
    const t2 = vec3.sub(vec3.create(), v3np, v1np);

    const normal = vec3.normalize(
      vec3.create(),
      vec3.cross(
        vec3.create(),
        vec3.normalize(vec3.create(), t1),
        vec3.normalize(vec3.create(), t2),
      ),
    );

    const dot = vec3.dot(visionDir, normal);

    if (dot < 0) {
      ctx.beginPath();
      ctx.moveTo(v1np[0], v1np[1]);
      ctx.lineTo(v2np[0], v2np[1]);
      ctx.lineTo(v3np[0], v3np[1]);
      ctx.closePath();
      ctx.stroke();
    }

    if (cursor && pointInTriangle(cursor, v1np, v2np, v3np)) {
      cursorTriangles.push({
        v1np,
        v2np,
        v3np,
        sumZ: v1np[2] + v2np[2] + v3np[2],
      });
    }
  }

  if (cursorTriangles.length) {
    const {v1np, v2np, v3np} = cursorTriangles.sort(
      (a, b) => a.sumZ - b.sumZ,
    )[0];

    ctx.beginPath();
    ctx.moveTo(v1np[0], v1np[1]);
    ctx.lineTo(v2np[0], v2np[1]);
    ctx.lineTo(v3np[0], v3np[1]);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
  }

  ctx.restore();
}


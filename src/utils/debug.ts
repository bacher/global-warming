import {vec3, mat4} from 'gl-matrix';

import type {ModelData} from './modelTypes';
import {
  applyInterpolation,
  getInterpolationRatios,
  isPointInTriangle,
} from './math';
import type {GameState} from './types';
import {Country} from '../data/countries';

const visionDir = vec3.fromValues(0, 0, 1);

type Params = {
  ctx?: CanvasRenderingContext2D;
  matrix: mat4;
  modelData: ModelData;
  cursor?: vec3;
  gameState: GameState;
};

export function debugFrame({
  ctx,
  matrix,
  modelData,
  cursor,
  gameState,
}: Params): void {
  if (ctx) {
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
  }

  const cursorTriangles = [];

  for (let i = 0; i < modelData.indexData.length; i += 3) {
    const v1 = modelData.indexData[i];
    const v2 = modelData.indexData[i + 1];
    const v3 = modelData.indexData[i + 2];

    const v1p = modelData.positionData.slice(v1 * 3, v1 * 3 + 3);
    const v2p = modelData.positionData.slice(v2 * 3, v2 * 3 + 3);
    const v3p = modelData.positionData.slice(v3 * 3, v3 * 3 + 3);

    const v1uv = modelData.uvData.slice(v1 * 2, v1 * 2 + 2);
    const v2uv = modelData.uvData.slice(v2 * 2, v2 * 2 + 2);
    const v3uv = modelData.uvData.slice(v3 * 2, v3 * 2 + 2);

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

    if (ctx) {
      const dot = vec3.dot(visionDir, normal);

      if (dot < 0) {
        ctx.beginPath();
        ctx.moveTo(v1np[0], v1np[1]);
        ctx.lineTo(v2np[0], v2np[1]);
        ctx.lineTo(v3np[0], v3np[1]);
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (cursor && isPointInTriangle(cursor, v1np, v2np, v3np)) {
      cursorTriangles.push({
        v1np,
        v2np,
        v3np,
        sumZ: v1np[2] + v2np[2] + v3np[2],
        v1uv,
        v2uv,
        v3uv,
      });
    }
  }

  if (cursor && cursorTriangles.length) {
    const {v1np, v2np, v3np, v1uv, v2uv, v3uv} = cursorTriangles.sort(
      (a, b) => a.sumZ - b.sumZ,
    )[0];

    const ratios = getInterpolationRatios([v1np, v2np, v3np], cursor);

    const uv = applyInterpolation([v1uv, v2uv, v3uv], ratios);

    // @ts-ignore
    const countryId = window.lookupCountryByUv?.(uv);

    gameState.selectedCountry = countryId;

    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(v1np[0], v1np[1]);
      ctx.lineTo(v2np[0], v2np[1]);
      ctx.lineTo(v3np[0], v3np[1]);
      ctx.closePath();
      ctx.fillStyle = countryId ? '#f00' : '#000';
      ctx.fill();
    }
  } else {
    gameState.selectedCountry = undefined;
  }

  if (ctx) {
    ctx.restore();
  }
}

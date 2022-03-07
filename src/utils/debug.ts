import {mat4, vec3} from 'gl-matrix';

import type {Country} from '../data/countries';
import type {ModelData} from './modelTypes';
import {applyInterpolation, getInterpolationRatios, isPointInTriangle} from './math';
import {Point2d} from './types';

type Params = {
  matrix: mat4;
  modelData: ModelData;
  cursor: {x: number; y: number};
};

export function getSelectedCountry({matrix, modelData, cursor}: Params): Country | undefined {
  const cursorVec: Point2d = [cursor.x, cursor.y];
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

    if (isPointInTriangle(cursorVec, v1np, v2np, v3np)) {
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

  if (cursorTriangles.length) {
    const {v1np, v2np, v3np, v1uv, v2uv, v3uv} = cursorTriangles.sort((a, b) => a.sumZ - b.sumZ)[0];

    const ratios = getInterpolationRatios([v1np, v2np, v3np], cursorVec);

    const uv = applyInterpolation([v1uv, v2uv, v3uv], ratios);

    // @ts-ignore
    return window.lookupCountryByUv?.(uv);
  }

  return undefined;
}

export function makeMemorizedGetSelectedCountry(): typeof getSelectedCountry {
  let lastCall:
    | {
        matrix: mat4;
        cursor: {x: number; y: number};
        results: Country | undefined;
      }
    | undefined;

  return (params) => {
    if (!lastCall || lastCall.matrix !== params.matrix || lastCall.cursor !== params.cursor) {
      lastCall = {
        matrix: params.matrix,
        cursor: params.cursor,
        results: getSelectedCountry(params),
      };
    }

    return lastCall.results;
  };
}

export function updatePointerDirectionBuffer(
  gl: WebGL2RenderingContext,
  pointer: {x: number; y: number},
  matrix: mat4,
  buffer: WebGLBuffer,
) {
  const start = vec3.fromValues(pointer.x, pointer.y, 0);
  const end = vec3.fromValues(pointer.x, pointer.y, -1);

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

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    // new Float32Array([10, 10 * Math.sin(options.time * 0.0005), 0, -10, 0, 0]),
    new Float32Array([start[0], start[1], start[2], end[0], end[1], end[2]]),
    gl.DYNAMIC_DRAW,
  );
}

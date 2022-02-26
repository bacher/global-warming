import type {AsPoint2d, Point2d} from './types';

function sign(p1: AsPoint2d, p2: AsPoint2d, p3: AsPoint2d): number {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

export function isPointInTriangle(
  pt: AsPoint2d,
  v1: AsPoint2d,
  v2: AsPoint2d,
  v3: AsPoint2d,
): boolean {
  const d1 = sign(pt, v1, v2);
  const d2 = sign(pt, v2, v3);
  const d3 = sign(pt, v3, v1);

  const has_neg = d1 < 0 || d2 < 0 || d3 < 0;
  const has_pos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(has_neg && has_pos);
}

export function getInterpolationRatios(
  [pointA, pointB, pointC]: [AsPoint2d, AsPoint2d, AsPoint2d],
  innerPoint: AsPoint2d,
): [number, number] {
  let ad;
  if (innerPoint[0] === pointC[0]) {
    ad = 0;
  } else {
    ad = (innerPoint[1] - pointC[1]) / (innerPoint[0] - pointC[0]);
  }

  const bd = pointC[1] - ad * pointC[0];

  const aa = (pointB[1] - pointA[1]) / (pointB[0] - pointA[0]);
  const ba = pointA[1] - aa * pointA[0];

  const p2x = (bd - ba) / (aa - ad);
  const p2y = p2x * aa + ba;

  let ratio1;
  let ratio2;

  if (pointB[0] === pointA[0]) {
    ratio1 = (p2y - pointA[1]) / (pointB[1] - pointA[1]);
  } else {
    ratio1 = (p2x - pointA[0]) / (pointB[0] - pointA[0]);
  }

  if (p2x === pointC[0]) {
    ratio2 = (innerPoint[1] - pointC[1]) / (p2y - pointC[1]);
  } else {
    ratio2 = (innerPoint[0] - pointC[0]) / (p2x - pointC[0]);
  }

  return [ratio1, ratio2];
}

export function applyInterpolation(
  [pointA, pointB, pointC]: [AsPoint2d, AsPoint2d, AsPoint2d],
  [mix1, mix2]: [number, number],
): Point2d {
  const point = [
    pointA[0] * (1 - mix1) + pointB[0] * mix1,
    pointA[1] * (1 - mix1) + pointB[1] * mix1,
  ];

  return [
    pointC[0] * (1 - mix2) + point[0] * mix2,
    pointC[1] * (1 - mix2) + point[1] * mix2,
  ];
}

/*
// Debug
const points = [
  [3, 5],
  [15, 7],
  [7, 12],
];

const point = [9, 10];

const ratios = getInterpolationRatios(points as any, point as any);

console.log('Ratios:', ratios);

console.log('Applied:', applyInterpolation(points as any, ratios));
*/

export function bound(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

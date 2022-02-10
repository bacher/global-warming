import type {vec3} from 'gl-matrix';

function normalize(value: number): string {
  const [int, float] = value.toFixed(6).split('.');

  return `${int.toString().padStart(6, ' ')}.${float}`;
}

export function formatVec3(vec: vec3): string {
  return [normalize(vec[0]), normalize(vec[0]), normalize(vec[0])].join(' ');
}

function printVec3(point: vec3) {
  return `(\
${(point[0] * 100).toFixed(0).padStart(6)}, \
${(point[1] * 100).toFixed(0).padStart(6)}, \
${(100 * point[2]).toFixed(0).padStart(6)})`;
}

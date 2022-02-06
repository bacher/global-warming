import type {vec2, vec3} from './types';

export function isVec2(arr: number[]): arr is vec2 {
  return arr.length === 2;
}

export function isVec3(arr: number[]): arr is vec3 {
  return arr.length === 3;
}

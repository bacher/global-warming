import type {Direction} from './types';

export function getNearestRotation({from, to}: {from: Direction; to: Direction}): Direction {
  const by = {
    spin: to.spin - from.spin,
    roll: to.roll - from.roll,
  };

  by.spin = by.spin % (2 * Math.PI);

  if (by.spin > Math.PI) {
    by.spin -= 2 * Math.PI;
  }

  return by;
}

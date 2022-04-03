import type {DirectionState, DistanceState} from './types';
import {easeOutCirc} from './easing';

const INTRO_ANIMATION_DURATION = 1000;
const TARGET_DISTANCE = 12;

export type IntroAnimation = {
  update: () => void;
};

export function createIntroAnimation(
  distanceState: DistanceState,
  onDone: () => void,
): IntroAnimation {
  const startTs = Date.now();
  const initialDistance = distanceState.distance;

  return {
    update: () => {
      const ratio = Math.min(1, (Date.now() - startTs) / INTRO_ANIMATION_DURATION);
      const r = easeOutCirc(ratio);

      distanceState.distance = initialDistance - (initialDistance - TARGET_DISTANCE) * r;

      if (ratio >= 1) {
        onDone();
      }
    },
  };
}

function getInitialDeltas() {
  return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
}

export type SpringAnimation = {
  value: number;
  target: number;
  update: (ms: number) => number;
};

export type SpringParams = {
  value: number;
  stiffness: number;
  damping: number;
  mass: number;
  r: number;
  multiplier?: number;
};

export function createSpring({
  value,
  stiffness,
  damping,
  mass,
  r,
  multiplier = 1,
}: SpringParams): SpringAnimation {
  const mD = 1 / multiplier;
  let v = 0;
  let d = getInitialDeltas();
  let deltaIndex = 0;

  const spring = {
    value,
    target: value,
    update: (t: number) => {
      const delta = spring.target - spring.value;

      if (delta === 0 && v === 0) {
        return spring.value;
      }

      const x = delta * multiplier;
      const Fs = stiffness * x;
      const Fd = -damping * v;
      const a = (Fs + Fd) / mass;
      const v2 = v + a * t;
      const deltaX = v2 * t * r;
      spring.value += deltaX * mD;

      d[deltaIndex] = Math.abs(deltaX);

      if (d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8] + d[9] < 1) {
        v = 0;
        spring.value = spring.target;
        d = getInitialDeltas();
        return spring.value;
      }

      deltaIndex++;
      if (deltaIndex === 10) {
        deltaIndex = 0;
      }

      v = v2;

      return spring.value;
    },
  };

  return spring;
}

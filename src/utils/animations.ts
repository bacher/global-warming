import type {DirectionState} from './types';
import {easeOutCirc} from './easing';

const INTRO_ANIMATION_DURATION = 1000;
const TARGET_DISTANCE = 12;

export type IntroAnimation = {
  update: () => void;
};

export function createIntroAnimation(
  direction: DirectionState,
  onDone: () => void,
): IntroAnimation {
  const startTs = Date.now();
  const initialDistance = direction.distance;

  return {
    update: () => {
      const ratio = Math.min(1, (Date.now() - startTs) / INTRO_ANIMATION_DURATION);
      const r = easeOutCirc(ratio);

      direction.distance = initialDistance - (initialDistance - TARGET_DISTANCE) * r;

      if (ratio >= 1) {
        onDone();
      }
    },
  };
}

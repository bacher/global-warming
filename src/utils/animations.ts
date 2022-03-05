import type {DirectionState} from './types';

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
      const delta = Date.now() - startTs;
      const ratio = Math.min(
        1,
        Math.log2(1 + delta / INTRO_ANIMATION_DURATION),
      );

      direction.distance =
        initialDistance - (initialDistance - TARGET_DISTANCE) * ratio;

      if (ratio === 1) {
        onDone();
      }
    },
  };
}

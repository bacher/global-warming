import {useEffect, useRef} from 'react';

import {useTabActive} from './useTabActive';

export function useFpsCounter() {
  const fpsCounterRef = useRef<HTMLPreElement>(null);
  const framesCountRef = useRef(0);
  const isActive = useTabActive();

  function drawFps(fps: number | undefined) {
    const element = fpsCounterRef.current;
    if (element) {
      element.innerText = fps?.toString() ?? '';
    }
  }

  function tick() {
    framesCountRef.current++;
  }

  useEffect(() => {
    if (isActive) {
      framesCountRef.current = 0;

      const intervalId = window.setInterval(() => {
        const framesCount = framesCountRef.current;
        drawFps(framesCount);
        framesCountRef.current = 0;
      }, 1000);

      return () => {
        drawFps(undefined);
        window.clearInterval(intervalId);
      };
    }

    drawFps(undefined);
  }, [isActive]);

  return {
    fpsCounterRef,
    tick,
  };
}

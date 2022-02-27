import {useRef, useState} from 'react';

import {useHandler} from './useHandler';

const DEFAULT_SHOW_TIME = 1500;

export enum SplashType {
  NORMAL = 1,
  BAD,
}

type SplashTextData = {
  text: string;
  type: SplashType;
};

export function useSplash() {
  const [splashText, setSplashText] = useState<SplashTextData | undefined>();
  const resetTimerRef = useRef<number | undefined>();

  const showSplashText = useHandler(
    (
      text: string,
      {
        type = SplashType.NORMAL,
        timeout = DEFAULT_SHOW_TIME,
      }: {type?: SplashType; timeout?: number} = {},
    ) => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = undefined;
      }

      setSplashText({
        text,
        type,
      });

      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = undefined;
        setSplashText(undefined);
      }, timeout);
    },
  );

  return {
    splashText,
    showSplashText,
  };
}

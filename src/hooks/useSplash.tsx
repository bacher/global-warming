import {ReactNode, useMemo, useRef, useState} from 'react';
import cn from 'classnames';

import {useHandler} from './useHandler';

import styles from './splash.module.scss';

const DEFAULT_SHOW_TIME = 1500;

enum SplashType {
  NONE,
  NOTIFICATION,
  BLOCK,
}

export enum SplashStyle {
  NORMAL = 1,
  BAD,
  SMALL_BAD,
}

type SplashTextData = {
  text: string | ReactNode;
  type: SplashStyle;
};

type SplashOptions = {type?: SplashStyle; timeout?: number};

export function useSplash() {
  const [splashType, setSplashType] = useState(SplashType.NONE);
  const [splashText, setSplashText] = useState<SplashTextData | undefined>();
  const resetTimerRef = useRef<number | undefined>();
  const onDoneRef = useRef<(() => void) | undefined>();

  const showSplashText = useHandler(
    (
      text: string | ReactNode,
      {type = SplashStyle.NORMAL, timeout = DEFAULT_SHOW_TIME}: SplashOptions = {},
    ) => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = undefined;
      }

      setSplashType(SplashType.NOTIFICATION);
      setSplashText({
        text,
        type,
      });

      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = undefined;
        setSplashType(SplashType.NONE);
        setSplashText(undefined);
      }, timeout);
    },
  );

  const showBlockText = useHandler(
    (
      text: string | ReactNode,
      {type = SplashStyle.NORMAL, timeout = DEFAULT_SHOW_TIME}: SplashOptions,
      onDone: () => void,
    ) => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = undefined;
      }

      setSplashType(SplashType.BLOCK);
      setSplashText({text, type});
      onDoneRef.current = onDone;
    },
  );

  const markup = useMemo(() => {
    return splashType !== SplashType.NONE && splashText ? (
      <div
        className={cn(styles.wrapper, {
          [styles.upper]: splashType === SplashType.NOTIFICATION,
          [styles.center]: splashType === SplashType.BLOCK,
        })}
      >
        <div
          className={cn(styles.splashText, {
            [styles.splashTextBad]: splashText.type === SplashStyle.BAD,
            [styles.splashTextSmallBad]: splashText.type === SplashStyle.SMALL_BAD,
          })}
        >
          {splashText.text}
        </div>
        {splashType === SplashType.BLOCK && (
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={(event) => {
                event.preventDefault();
                setSplashType(SplashType.NONE);
                onDoneRef.current?.();
              }}
            >
              Go to Menu
            </button>
          </div>
        )}
      </div>
    ) : undefined;
  }, [splashType, splashText]);

  return {
    splash: markup,
    showSplashText,
    showBlockText,
  };
}

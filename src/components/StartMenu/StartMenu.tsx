import {useEffect, useState} from 'react';
import cn from 'classnames';

import styles from './StartMenu.module.scss';

type Props = {
  disabled?: boolean;
  onGameStart: () => void;
  onQuizStart: () => void;
  onDiscoveryStart: () => void;
};

export function StartMenu({
  disabled,
  onGameStart,
  onQuizStart,
  onDiscoveryStart,
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 1000);
  });

  if (!show) {
    return null;
  }

  return (
    <form className={styles.buttons}>
      <button
        type="button"
        className={cn(styles.startButton, styles.startButtonMain)}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          onGameStart();
        }}
      >
        Start Game
      </button>
      <button
        type="button"
        className={styles.startButton}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          onQuizStart();
        }}
      >
        Play Quiz
      </button>
      <button
        type="button"
        className={styles.startButton}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          onDiscoveryStart();
        }}
      >
        Discover the World
      </button>
    </form>
  );
}

import styles from './StartMenu.module.scss';

type Props = {
  onGameStart: () => void;
  onDiscoveryStart: () => void;
};

export function StartMenu({onGameStart, onDiscoveryStart}: Props) {
  return (
    <form className={styles.buttons}>
      <button
        type="button"
        className={styles.startButton}
        onClick={(event) => {
          event.preventDefault();
          onGameStart();
        }}
      >
        Start the Game
      </button>
      <button
        type="button"
        className={styles.startButton}
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

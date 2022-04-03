import {PressButton} from '../PressButton';

import styles from './RightPanel.module.scss';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function RightPanel({onZoomIn, onZoomOut}: Props) {
  return (
    <div className={styles.rightPanel}>
      <div className={styles.zoom}>
        <PressButton title="Zoom Out" className={styles.zoomButton} onClick={onZoomOut}>
          -
        </PressButton>
        <PressButton title="Zoom In" className={styles.zoomButton} onClick={onZoomIn}>
          +
        </PressButton>
      </div>
    </div>
  );
}

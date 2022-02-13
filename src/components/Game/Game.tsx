import {useEffect, useRef, useState} from 'react';

import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';
import {debugFrame} from '../../utils/debug';
import {GameState} from '../../utils/types';
import {useFpsCounter} from '../../hooks/useFpsCounter';
import {useWindowEvent} from '../../hooks/useWindowEvent';

import {CountriesCanvas} from '../CountriesCanvas';
import styles from './Game.module.css';

const WIDTH = 800;
const HEIGHT = 600;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);
  const {fpsCounterRef, tick} = useFpsCounter();
  const mousePosRef = useRef<{x: number; y: number} | undefined>();

  const gameStateRef = useRef<GameState>({selectedCountry: undefined});

  useEffect(() => {
    loadAssets().then(setAssets);
  }, []);

  useEffect(() => {
    if (!assets) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error();
    }

    const gl = canvas.getContext('webgl2');

    if (!gl) {
      throw new Error();
    }

    const scene = initialize(gl, assets);

    timeRef.current = Date.now() - 20000;

    function doRender() {
      draw(gl!, scene, gameStateRef.current, {
        width: WIDTH,
        height: HEIGHT,
        time: Date.now() - timeRef.current,
        // time: 0,
        pointer: mousePosRef.current,
        debugOnFrame: ({matrix}) => {
          const ctx = debugCanvasRef.current!.getContext('2d')!;
          const modelData = assets!.modelData;

          debugFrame({
            ctx,
            matrix,
            modelData,
            cursor: mousePosRef.current
              ? [mousePosRef.current.x, mousePosRef.current.y, 0]
              : undefined,
            gameState: gameStateRef.current,
          });
        },
      });
      tick();
      requestAnimationFrame(doRender);
    }

    doRender();
  }, [assets]);

  useWindowEvent<MouseEvent>('mousemove', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      mousePosRef.current = undefined;
    } else {
      mousePosRef.current = {
        x: x / (WIDTH / 2) - 1,
        y: (y / (HEIGHT / 2) - 1) * -1,
      };
    }
  });

  return (
    <>
      <div className={styles.root}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={WIDTH}
          height={HEIGHT}
        />
        <canvas
          ref={debugCanvasRef}
          className={styles.debugCanvas}
          width={WIDTH}
          height={HEIGHT}
        />
        <span ref={fpsCounterRef} className={styles.fpsCounter} />
        <pre id="output" className={styles.output} />
      </div>
      {assets && <CountriesCanvas image={assets.textures.countries} />}
    </>
  );
}

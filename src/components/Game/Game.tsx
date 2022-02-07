import {useEffect, useRef, useState} from 'react';

import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';
import {useFpsCounter} from '../../hooks/useFpsCounter';

import styles from './Game.module.css';

const WIDTH = 800;
const HEIGHT = 600;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);
  const {fpsCounterRef, tick} = useFpsCounter();

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

    timeRef.current = Date.now();

    function doRender() {
      draw(gl!, scene, {
        width: WIDTH,
        height: HEIGHT,
        time: Date.now() - timeRef.current,
      });
      tick();
      requestAnimationFrame(doRender);
    }

    doRender();
  }, [assets]);

  return (
    <div>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <span ref={fpsCounterRef} className={styles.fpsCounter} />
      <pre id="output" className={styles.output}/>
    </div>
  );
}

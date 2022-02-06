import {useEffect, useRef, useState} from 'react';

import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';

const WIDTH = 800;
const HEIGHT = 600;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);

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
      requestAnimationFrame(doRender);
    }

    doRender();
  }, [assets]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />;
}

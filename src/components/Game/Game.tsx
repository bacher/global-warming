import {useEffect, useRef} from 'react';

import {draw} from '../../utils/render';

const WIDTH = 800;
const HEIGHT = 600;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error();
    }

    const gl = canvas.getContext('webgl2');

    if (!gl) {
      throw new Error();
    }

    draw(gl, {width: WIDTH, height: HEIGHT});
  }, []);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />;
}

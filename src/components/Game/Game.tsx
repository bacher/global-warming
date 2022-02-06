import {useEffect, useRef, useState} from 'react';

import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {ModelBufferData, parseBinModel} from '../../utils/binary';

const WIDTH = 800;
const HEIGHT = 600;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelData, setModelBuffers] = useState<ModelBufferData | undefined>();

  useEffect(() => {
    fetch('/earth.bin')
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }
        return response.arrayBuffer();
      })
      .then((buffer) => {
        setModelBuffers(parseBinModel(buffer));
      });
  }, []);

  useEffect(() => {
    if (!modelData) {
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

    const scene = initialize(gl, modelData);

    draw(gl, scene, {width: WIDTH, height: HEIGHT});
  }, [modelData]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />;
}

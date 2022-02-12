import {useEffect, useRef} from 'react';

import styles from './CountriesCanvas.module.css';
import {Point2d} from '../../utils/types';

export function CountriesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.addEventListener('load', () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // @ts-ignore
      window.lookupCountryByUv = ([u, v]: Point2d) => {
        const q = ctx.getImageData(
          Math.floor(u * 2098),
          Math.floor(v * 1574),
          1,
          1,
        );

        // console.log(q.data);
        return q.data[3] > 0;
      };
    });
    img.src = `${process.env.PUBLIC_URL}/textures/earth_countries.png`;
  }, []);

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        width={2098}
        height={1574}
        className={styles.canvas}
      />
    </div>
  );
}

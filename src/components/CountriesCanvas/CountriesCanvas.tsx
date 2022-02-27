import {useEffect, useRef} from 'react';

import {Country, getCountryByColor} from '../../data/countries';
import type {Point2d} from '../../utils/types';

import styles from './CountriesCanvas.module.css';

type Props = {
  image: HTMLImageElement;
};

export function CountriesCanvas({image}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    // @ts-ignore
    window.lookupCountryByUv = ([u, v]: Point2d): Country | undefined => {
      const q = ctx.getImageData(
        Math.floor(u * 2098),
        Math.floor(v * 1574),
        1,
        1,
      );

      return getCountryByColor(q.data[0]);
    };
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

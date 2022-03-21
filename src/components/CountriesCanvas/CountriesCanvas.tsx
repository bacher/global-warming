import {useEffect, useRef} from 'react';

import {TEXTURE_SIZE} from '../../data/textures';
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
        Math.floor(u * TEXTURE_SIZE.width),
        Math.floor(v * TEXTURE_SIZE.height),
        1,
        1,
      );

      const country = getCountryByColor(q.data[0]);

      const output = document.getElementById('debugOutput');
      if (output) {
        output.innerText = `Hover color: ${q.data[0]} (0x${q.data[0].toString(16)})\nCountry: ${
          country ?? '-'
        }`;
      }

      return country;
    };
  }, []);

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        width={TEXTURE_SIZE.width}
        height={TEXTURE_SIZE.height}
        className={styles.canvas}
      />
    </div>
  );
}

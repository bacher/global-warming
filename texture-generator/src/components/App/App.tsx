import {useEffect, useRef} from 'react';

import styles from './App.module.scss';

const textureSize = {width: 2098, height: 1574};

const targetTextureSize = {width: 2048, height: 2048};
const DIMENSION = 65;
const GAP = 10;
const CELL_SIZE = Math.floor((targetTextureSize.width - GAP) / DIMENSION - GAP);

const SHOW_GRID = false;
const SHOW_GRID_CELLS = false;
const SHOW_AREAS = false;

type Point = {
  x: number;
  y: number;
};

type CountryBox = {
  color: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  cellX: number;
  cellY: number;
  cellWidth: number;
  cellHeight: number;
  cellArea: number;
  priority: number;
};

function fitIntoGrid(grid: number[][], country: CountryBox): boolean {
  const {cellWidth, cellHeight} = country;

  for (let y = 0; y < DIMENSION; y++) {
    nextCell: for (let x = 0; x < DIMENSION; x++) {
      for (let cy = 0; cy < cellHeight; cy++) {
        for (let cx = 0; cx < cellWidth; cx++) {
          if (grid[y + cy][x + cx] !== 0) {
            continue nextCell;
          }
        }
      }

      country.cellX = x;
      country.cellY = y;

      for (let cy = 0; cy < cellHeight; cy++) {
        for (let cx = 0; cx < cellWidth; cx++) {
          grid[y + cy][x + cx] = country.color;
        }
      }
      return true;
    }
  }

  return false;
}

function getCellsCount(size: number) {
  return Math.ceil((size + GAP) / (CELL_SIZE + GAP));
}

function processTexture(ctx: CanvasRenderingContext2D) {
  const countries: Map<number, {color: number; topLeft: Point; bottomRight: Point}> = new Map();

  const {width, height} = ctx.canvas;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = ctx.getImageData(x, y, 1, 1);
      const color = pixel.data[0];

      if (color !== 0) {
        let country = countries.get(color);

        if (!country) {
          country = {
            color,
            topLeft: {x, y},
            bottomRight: {x, y},
          };
          countries.set(color, country);
        } else {
          if (country.topLeft.x > x) {
            country.topLeft.x = x;
          }
          if (country.bottomRight.x < x) {
            country.bottomRight.x = x;
          }
          if (country.topLeft.y > y) {
            country.topLeft.y = y;
          }
          if (country.bottomRight.y < y) {
            country.bottomRight.y = y;
          }
        }
      }
    }
  }

  // console.log(countries);

  for (const country of countries.values() as any) {
    ctx.strokeStyle = 'red';
    ctx.rect(
      country.topLeft.x,
      country.topLeft.y,
      country.bottomRight.x - country.topLeft.x,
      country.bottomRight.y - country.topLeft.y,
    );
    ctx.stroke();
  }

  const countryBoxes = Array.from(countries.values()).map((country) => {
    const width = country.bottomRight.x - country.topLeft.x + 1;
    const height = country.bottomRight.y - country.topLeft.y + 1;

    const cellWidth = getCellsCount(width);
    const cellHeight = getCellsCount(height);

    return {
      color: country.color,
      x: country.topLeft.x,
      y: country.topLeft.y,
      width,
      height,
      area: width * height,
      cellX: 0,
      cellY: 0,
      cellWidth,
      cellHeight,
      cellArea: cellWidth * cellHeight,
      priority: Math.max(cellWidth, cellHeight) + Math.min(cellWidth, cellHeight) / 1000,
    };
  });

  countryBoxes.sort((a, b) => b.priority - a.priority);

  const grid = Array.from({length: DIMENSION}).map(() =>
    Array.from({length: DIMENSION}).map(() => 0),
  );

  for (const country of countryBoxes) {
    const isSuccess = fitIntoGrid(grid, country);

    if (!isSuccess) {
      alert(`Can't put country ${country.color}`);
      throw new Error(`Can't put country ${country.color}`);
    }
  }

  console.log(countryBoxes);
  console.log(grid);

  return {
    countries: countryBoxes,
  };
}

function drawGridTexture(
  ctx: CanvasRenderingContext2D,
  countries: CountryBox[],
  img: HTMLImageElement,
) {
  for (const country of countries) {
    const finalX = country.cellX * (CELL_SIZE + GAP) + GAP;
    const finalY = country.cellY * (CELL_SIZE + GAP) + GAP;

    ctx.drawImage(
      img,
      country.x,
      country.y,
      country.width,
      country.height,
      finalX,
      finalY,
      country.width,
      country.height,
    );

    const count = country.width * country.height;
    const imageData = ctx.getImageData(finalX, finalY, country.width, country.height);

    for (let i = 0; i < count; i++) {
      const pixelColor = imageData.data[i * 4];

      if (pixelColor !== 0) {
        if (pixelColor === country.color) {
          imageData.data.set([255, 0, 0, 255], i * 4);
        } else {
          imageData.data.set([0, 0, 0, 255], i * 4);
        }
      }
    }

    ctx.putImageData(imageData, finalX, finalY);
  }
}

function drawDebugGrid(ctx: CanvasRenderingContext2D, countries: CountryBox[]) {
  ctx.save();
  ctx.translate(-0.5, -0.5);

  if (SHOW_GRID) {
    ctx.beginPath();
    for (let y = 0; y <= DIMENSION; y++) {
      ctx.moveTo(0, GAP + (CELL_SIZE + GAP) * y - GAP / 2);
      ctx.lineTo(targetTextureSize.width, GAP + (CELL_SIZE + GAP) * y - GAP / 2);
    }
    for (let x = 0; x <= DIMENSION; x++) {
      ctx.moveTo(GAP + (CELL_SIZE + GAP) * x - GAP / 2, 0);
      ctx.lineTo(GAP + (CELL_SIZE + GAP) * x - GAP / 2, targetTextureSize.height);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
  }

  if (SHOW_GRID_CELLS) {
    ctx.beginPath();
    for (let y = 0; y < DIMENSION; y++) {
      for (let x = 0; x < DIMENSION; x++) {
        ctx.rect(GAP + (CELL_SIZE + GAP) * x, GAP + (CELL_SIZE + GAP) * y, CELL_SIZE, CELL_SIZE);
      }
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
  }

  if (SHOW_AREAS) {
    ctx.beginPath();
    for (const country of countries) {
      const rect = getFigureRect(country);
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function getFigureRect({
  cellX,
  cellY,
  cellWidth,
  cellHeight,
}: {
  cellX: number;
  cellY: number;
  cellWidth: number;
  cellHeight: number;
}) {
  return {
    x: GAP + (CELL_SIZE + GAP) * cellX,
    y: GAP + (CELL_SIZE + GAP) * cellY,
    width: (CELL_SIZE + GAP) * cellWidth - GAP,
    height: (CELL_SIZE + GAP) * cellHeight - GAP,
  };
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasOutRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const img = new Image();
    img.addEventListener('load', () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      const outCtx = canvasOutRef.current!.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      const {countries} = processTexture(ctx);

      outCtx.fillStyle = '#000';
      outCtx.rect(0, 0, targetTextureSize.width, targetTextureSize.height);
      outCtx.fill();

      drawGridTexture(outCtx, countries, img);
      drawDebugGrid(outCtx, countries);

      outputRef.current!.value = JSON.stringify(
        countries.map((country) => ({
          color: country.color,
          srcX: country.x - GAP / 2,
          srcY: country.y - GAP / 2,
          x: GAP + (CELL_SIZE + GAP) * country.cellX - GAP / 2,
          y: GAP + (CELL_SIZE + GAP) * country.cellY - GAP / 2,
          width: country.width + GAP,
          height: country.height + GAP,
        })),
        null,
        2,
      );
    });
    img.src = `${process.env.PUBLIC_URL}/textures/earth_countries.png`;
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <canvas
          ref={canvasRef}
          width={textureSize.width}
          height={textureSize.height}
          style={{
            width: textureSize.width / 4,
            height: textureSize.height / 4,
          }}
        />
        <canvas
          ref={canvasOutRef}
          width={targetTextureSize.width}
          height={targetTextureSize.height}
          style={{
            width: targetTextureSize.width / 4,
            height: targetTextureSize.height / 4,
          }}
        />
      </div>
      <textarea readOnly ref={outputRef} className={styles.jsonOutput} />
    </div>
  );
}

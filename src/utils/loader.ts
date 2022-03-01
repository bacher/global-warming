import type {ModelData, SimpleMesh} from './modelTypes';
import {parseBinModel} from './binary';
import {generateCircle} from './generateShapes';

async function loadTexture(textureName: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener('load', () => {
      resolve(image);
    });

    image.addEventListener('error', reject);

    image.src = textureName;
  });
}

async function loadModel(modelName: string): Promise<ModelData> {
  const response = await fetch(modelName);

  if (!response.ok) {
    throw new Error();
  }

  const buffer = await response.arrayBuffer();
  return parseBinModel(buffer);
}

export type Assets = {
  models: {
    earth: ModelData;
    circle: SimpleMesh;
  };
  textures: Record<string, HTMLImageElement>;
};

export async function loadAssets(): Promise<Assets> {
  const [earthModel, earth, countries, area] = await Promise.all([
    loadModel(`${process.env.PUBLIC_URL}/earth.bin`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_compress.png`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_countries.png`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_area.png`),
  ]);

  return {
    models: {
      earth: earthModel,
      circle: generateCircle({radius: Math.PI, segments: 64, width: 0.007}),
    },
    textures: {
      earth,
      countries,
      area,
    },
  };
}

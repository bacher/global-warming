import {ModelData, parseBinModel} from './binary';

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
  modelData: ModelData;
  textures: Record<string, HTMLImageElement>;
};

export async function loadAssets(): Promise<Assets> {
  const [modelData, earth, countries, area] = await Promise.all([
    loadModel(`${process.env.PUBLIC_URL}/earth.bin`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_compress.png`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_countries.png`),
    loadTexture(`${process.env.PUBLIC_URL}/textures/earth_area.png`),
  ]);

  return {
    modelData,
    textures: {
      earth,
      countries,
      area,
    },
  };
}

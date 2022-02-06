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
  textureImage: HTMLImageElement;
};

export async function loadAssets(): Promise<Assets> {
  const [modelData, texture] = await Promise.all([
    loadModel('/earth.bin'),
    loadTexture('/textures/earth_compress.png'),
  ]);

  return {
    modelData,
    textureImage: texture,
  };
}

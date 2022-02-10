export type ModelData = {
  facesCount: number;
  positionData: Float32Array;
  normalData: Float32Array;
  uvData: Float32Array;
  indexData: Uint16Array;
};

export function parseBinModel(buffer: ArrayBuffer): ModelData {
  const headerSize = 8;
  const header = new Uint32Array(buffer.slice(0, headerSize));
  const verticesCount = header[0];
  const facesCount = header[1];

  const positionSize = verticesCount * 3 * 4;
  const normalSize = verticesCount * 3 * 4;
  const uvSize = verticesCount * 2 * 4;
  const indexSize = facesCount * 3 * 2;

  let offset = headerSize;

  const positionData = new Float32Array(
    buffer.slice(offset, offset + positionSize),
  );
  offset += positionSize;

  const normalData = new Float32Array(
    buffer.slice(offset, offset + normalSize),
  );
  offset += normalSize;

  const uvData = new Float32Array(buffer.slice(offset, offset + uvSize));
  offset += uvSize;

  const indexData = new Uint16Array(buffer.slice(offset, offset + indexSize));

  return {
    facesCount,
    positionData,
    normalData,
    uvData,
    indexData,
  };
}

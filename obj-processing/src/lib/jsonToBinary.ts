import type {FaceVertex, vec2, vec3, WavefrontObject} from './types';

type Vertex = {
  position: vec3;
  uv: vec2;
  normal: vec3;
};

type IndexedFace = [number, number, number];

function isIndexedFace(arr: number[]): arr is IndexedFace {
  return arr.length === 3;
}

export function jsonToBinary(obj: WavefrontObject) {
  const vertices: Vertex[] = [];
  const verticesMap = new Map<string, number>();
  const indexArray: IndexedFace[] = [];

  for (const face of obj.faces) {
    const mappedPoints = face.map((point) => {
      if (point.normal === undefined || point.uv === undefined) {
        throw new Error('No normals or uvs');
      }

      const position = obj.vertices[point.vertex];
      const normal = obj.normals[point.normal];
      const uv = obj.uvs[point.uv];

      const serialized = [
        position.join('|'),
        normal.join('|'),
        uv.join('|'),
      ].join('#');

      let index = verticesMap.get(serialized);

      if (index !== undefined) {
        return index;
      }

      index = vertices.length;
      vertices.push({
        position,
        uv,
        normal,
      });
      verticesMap.set(serialized, index);

      return index;
    });

    if (!isIndexedFace(mappedPoints)) {
      throw new Error('Invalid points');
    }

    indexArray.push(mappedPoints);
  }

  const positionBuffer = new Float32Array(vertices.length * 3);
  const normalBuffer = new Float32Array(vertices.length * 3);
  const uvBuffer = new Float32Array(vertices.length * 2);
  const indexBuffer = new Uint16Array(indexArray.length * 3);

  for (let i = 0; i < vertices.length; i++) {
    const {position, normal, uv} = vertices[i];

    positionBuffer.set(position, i * 3);
    normalBuffer.set(normal, i * 3);
    uvBuffer.set(uv, i * 2);
  }

  for (let i = 0; i < indexArray.length; i++) {
    const indexes = indexArray[i];
    indexBuffer.set(indexes, i * 3);
  }

  const header = new Uint32Array([vertices.length, indexArray.length]);

  console.info(`Vertices ${vertices.length}, Faces: ${indexArray.length}`);

  return Buffer.concat([
    Buffer.from(header.buffer),
    Buffer.from(positionBuffer.buffer),
    Buffer.from(normalBuffer.buffer),
    Buffer.from(uvBuffer.buffer),
    Buffer.from(indexBuffer.buffer),
  ]);
}

export type vec2 = [number, number];

export type vec3 = [number, number, number];

export type FaceVertex = {
  vertex: number;
  uv?: number;
  normal?: number;
};

export type Face = [FaceVertex, FaceVertex, FaceVertex];

export type WavefrontObject = {
  name: string;
  mtl?: string;
  smoothShading?: number | string;
  vertices: vec3[];
  uvs: vec2[];
  normals: vec3[];
  faces: Face[];
};

export type JSONResults = {
  mtlLib?: string;
  objects: WavefrontObject[];
};

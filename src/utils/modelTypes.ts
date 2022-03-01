export enum RenderType {
  DRAW_ARRAYS = 1,
  DRAW_ELEMENTS,
}

export type ModelData = {
  facesCount: number;
  positionData: Float32Array;
  normalData: Float32Array;
  uvData: Float32Array;
  indexData: Uint16Array;
};

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants#rendering_primitives
export enum RenderMode {
  LINES = 0x0001,
  TRIANGLES = 0x0004,
  TRIANGLE_STRIP = 0x0005,
}

export type SimpleMesh = {
  renderType: RenderType.DRAW_ARRAYS;
  renderMode: RenderMode;
  positionData: Float32Array;
  verticesCount: number;
};

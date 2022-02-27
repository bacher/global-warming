import {vec2, vec3, vec4} from 'gl-matrix';

import type {Country} from '../data/countries';

export type Point2d = [number, number];

export type AsPoint2d = Point2d | vec2 | vec3 | vec4;

export type VertexShaderInfo = {
  source: string;
  uniforms: string[];
  attributes: string[];
};

export type FragmentShaderInfo = {
  source: string;
  uniforms: string[];
};

export type ShaderProgram = {
  program: WebGLProgram;
  locations: {
    getUniform: (uniformName: string) => WebGLUniformLocation | null;
    getAttribute: (attributeName: string) => number;
  };
};

export enum RenderType {
  DRAW_ARRAYS,
  DRAW_ELEMENTS,
}

export type DrawElementsObject = {
  renderType: RenderType.DRAW_ELEMENTS;
  renderMode: GLenum;
  indexType: GLenum; // gl.UNSIGNED_SHORT | gl.UNSIGNED_INT
  elementsCount: number;
};

export type DrawArraysObject = {
  renderType: RenderType.DRAW_ARRAYS;
  renderMode: GLenum;
  elementsCount: number;
};

export type SceneObject = DrawElementsObject | DrawArraysObject;

export type Scene = {
  shaderProgram: ShaderProgram;
  vao: WebGLVertexArrayObject;
  linesVao: WebGLVertexArrayObject;
  lineShaderProgram: ShaderProgram;
  lineBuffer: WebGLBuffer;
  objects: SceneObject[];
};

export type GameState = {
  selectedCountry: Country | undefined;
};

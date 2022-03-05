import type {mat4, vec2, vec3, vec4} from 'gl-matrix';

import type {Country} from '../data/countries';
import {RenderType} from './modelTypes';
import {CountryInfo} from '../data/countries';

export type Point2d = [number, number];

export type AsPoint2d = Point2d | vec2 | vec3 | vec4;

export type ViewportSize = {
  width: number;
  height: number;
};

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
  setUniformInt: (uniformName: string, value: number) => void;
  setUniformMat4: (uniformName: string, value: Float32List) => void;
};

export enum CullFace {
  FRONT = 0x0404,
  BACK = 0x0405,
}

export type CommonSceneObjectType = {
  shaderProgram: ShaderProgram;
  vao: WebGLVertexArrayObject;
  id: string;
  matrix?: mat4;
  cullFace?: CullFace;
  disableDepthTest?: boolean;
};

export type ModelRenderInfo = {
  renderType: RenderType.DRAW_ELEMENTS;
  renderMode: GLenum;
  indexType: GLenum; // gl.UNSIGNED_SHORT | gl.UNSIGNED_INT
  elementsCount: number;
};

export type DrawElementsObject = CommonSceneObjectType & ModelRenderInfo;

export type SimpleModelRenderInfo = {
  renderType: RenderType.DRAW_ARRAYS;
  renderMode: GLenum;
  elementsCount: number;
};

export type DrawArraysObject = CommonSceneObjectType & SimpleModelRenderInfo;

export type SceneObject = DrawElementsObject | DrawArraysObject;

export type Scene = {
  lineBuffer: WebGLBuffer;
  objects: SceneObject[];
};

export enum GameType {
  MENU = 1,
  FIND,
  DISCOVERY,
}

export type GameState =
  | {
      type: GameType.MENU;
    }
  | {
      type: GameType.FIND;
      guessCountry: CountryInfo;
      selectedCountry: Country | undefined;
    }
  | {
      type: GameType.DISCOVERY;
      selectedCountry: Country | undefined;
    };

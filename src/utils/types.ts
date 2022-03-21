import type {mat4, vec2, vec3, vec4} from 'gl-matrix';

import type {Country} from '../data/countries';
import {CountryInfo} from '../data/countries';
import {BlendMode, RenderType} from './modelTypes';

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
  setUniformUInt: (uniformName: string, value: number) => void;
  setUniformUIntArray: (uniformName: string, value: Uint32Array) => void;
  setUniformMat4: (uniformName: string, value: Float32List) => void;
};

export type VaoObject = {
  vao: WebGLVertexArrayObject;
  // positionBuffer: WebGLBuffer;
  // uvBuffer: WebGLBuffer | undefined;
};

export enum CullFace {
  OFF = 0x0,
  FRONT = 0x0404,
  BACK = 0x0405,
}

export enum ObjectType {
  EARTH = 1,
  CIRCLE,
  COUNTRIES,
  LINE,
}

export type CommonSceneObjectType = {
  id: string;
  vao: VaoObject;
  objectType: ObjectType;
  matrix?: mat4;
  cullFace?: CullFace;
  disableDepthTest?: boolean;
  blendMode?: BlendMode;
  hidden?: boolean;
  updateBuffers?: (positionData: number[], uvData: number[], colorData: number[]) => void;
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

export type Shaders = {
  main: ShaderProgram;
  line: ShaderProgram;
  countries: ShaderProgram;
  circle: ShaderProgram;
};

export type Scene = {
  objects: SceneObject[];
  shaders: Shaders;
  frameBufferObjects: SceneObject[];
  lineBuffer: WebGLBuffer;
  countriesFrameBuffer: WebGLFramebuffer;
};

export type Direction = {
  spin: number;
  roll: number;
};

export type DirectionState = {
  direction: Direction;
  distance: number;
};

export enum GameType {
  MENU = 1,
  GAME,
  QUIZ,
  DISCOVERY,
}

export enum InGameState {
  STARTING = 1,
  SWITCHING,
  FINDING,
  ENDING,
}

export type CountryState = {
  countryId: Country;
  color: [number, number, number, number];
};

export type GameState =
  | {
      type: GameType.MENU;
      countriesState: CountryState[];
    }
  | {
      type: GameType.GAME;
      inGameState: InGameState;
      guessCountry: CountryInfo | undefined;
      countriesState: CountryState[];
    }
  | {
      type: GameType.QUIZ;
      guessCountry: CountryInfo | undefined;
      countriesState: CountryState[];
    }
  | {
      type: GameType.DISCOVERY;
      countriesState: CountryState[];
    };

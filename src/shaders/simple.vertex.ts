import type {VertexShaderInfo} from '../utils/types';

export const simpleVertexShaderInfo: VertexShaderInfo = {
  source: `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`,
  uniforms: [],
  attributes: ['a_position'],
};

import type {VertexShaderInfo} from '../utils/types';

export const matrixVertexShaderInfo: VertexShaderInfo = {
  source: `#version 300 es

uniform mat4 u_matrix;
in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

// all shaders have a main function
void main() {
  v_texcoord = a_texcoord;
  gl_Position = u_matrix * a_position;
}
`,
  uniforms: ['u_matrix'],
  attributes: ['a_position', 'a_texcoord'],
};

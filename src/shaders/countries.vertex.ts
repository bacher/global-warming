import type {VertexShaderInfo} from '../utils/types';

export const countriesVertexShaderInfo: VertexShaderInfo = {
  source: `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;
in vec4 a_color;

out vec2 v_texcoord;
out vec4 v_color;

void main() {
  v_texcoord = a_texcoord;
  v_color = a_color;
  gl_Position = a_position;
}
`,
  uniforms: [],
  attributes: ['a_position', 'a_texcoord', 'a_color'],
};

import type {VertexShaderInfo} from '../utils/types';

export const simpleVertexShaderInfo: VertexShaderInfo = {
  source: `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;
out vec2 v_texcoord2;

void main() {
  v_texcoord = a_texcoord;
  v_texcoord2 = vec2(
    (a_position.x + 1.0) / 2.0,
    (a_position.y + 1.0) / 2.0
  ); 
  gl_Position = a_position;
}
`,
  uniforms: [],
  attributes: ['a_position', 'a_texcoord'],
};

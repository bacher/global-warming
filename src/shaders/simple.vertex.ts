import type {VertexShaderInfo} from '../utils/types';

export const simpleVertexShaderInfo: VertexShaderInfo = {
  source: `
in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
  v_texcoord = a_texcoord;
  gl_Position = a_position;
}
`,
  uniforms: [],
  attributes: ['a_position', 'a_texcoord'],
};

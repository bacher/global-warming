import type {VertexShaderInfo} from '../utils/types';

export const matrixVertexShaderInfo: VertexShaderInfo = {
  source: `
uniform mat4 u_matrix;
in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
  v_texcoord = a_texcoord;
  gl_Position = u_matrix * a_position;
}
`,
  uniforms: ['u_matrix'],
  attributes: ['a_position', 'a_texcoord'],
};

import type {VertexShaderInfo} from '../utils/types';

export const equatorVertexShaderInfo: VertexShaderInfo = {
  source: `
uniform mat4 u_matrix;
in vec4 a_position;

void main() {
  gl_Position = u_matrix * a_position;
}
`,
  uniforms: ['u_matrix'],
  attributes: ['a_position'],
};

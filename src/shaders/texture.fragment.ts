import type {FragmentShaderInfo} from '../utils/types';

export const textureFragmentShaderInfo: FragmentShaderInfo = {
  source: `
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  // out_color = vec4(color.r, 0, 0, color.r);
  out_color = vec4(1.0, 0, 0, color.r);
}
`,
  uniforms: ['u_texture'],
};

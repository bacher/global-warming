import type {FragmentShaderInfo} from '../utils/types';

export const countriesFragmentShaderInfo: FragmentShaderInfo = {
  source: `
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;
in vec4 v_color;

out vec4 out_color;

void main() {
  vec4 texColor = texture(u_texture, v_texcoord);
  float finalAlpha = v_color.a * texColor.r;
  out_color = vec4(v_color.rgb * finalAlpha, finalAlpha);
}
`,
  uniforms: ['u_texture'],
};

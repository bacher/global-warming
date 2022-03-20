import type {FragmentShaderInfo} from '../utils/types';

export const countriesFragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;
in vec4 v_color;

out vec4 outColor;

void main() {
  vec4 texColor = texture(u_texture, v_texcoord);
  float finalAlpha = v_color.a * texColor.r;
  outColor = vec4(v_color.rgb * finalAlpha, finalAlpha);
}
`,
  uniforms: ['u_texture'],
};

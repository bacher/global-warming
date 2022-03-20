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
  vec4 color = texture(u_texture, v_texcoord);
  // outColor = vec4(color.r, 0, 0, color.r);
  outColor = vec4(1.0, 0, 0, color.r);
}
`,
  uniforms: ['u_texture'],
};

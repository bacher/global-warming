import type {FragmentShaderInfo} from '../utils/types';

export const textureMixFragmentShaderInfo: FragmentShaderInfo = {
  source: `
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_texture2;
in vec2 v_texcoord;
out vec4 out_color;

void main() {
  vec4 solid = texture(u_texture, v_texcoord);
  vec4 area = texture(u_texture2, v_texcoord);
  
  out_color = vec4(
    mix(
      solid.rgb,
      area.rgb,
      area.a
    ),
    1
  );
}
`,
  uniforms: ['u_texture', 'u_texture2'],
};

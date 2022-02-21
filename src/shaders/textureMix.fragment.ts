import type {FragmentShaderInfo} from '../utils/types';

export const textureMixFragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform uint u_selected;
in vec2 v_texcoord;
out vec4 outColor;

void main() {
  vec4 solid = texture(u_texture, v_texcoord);
  vec4 country = texture(u_texture2, v_texcoord); 
  
  if (country.r > 0.0) {
    if (u_selected == uint(country.r * 255.0 + 0.5)) {
      outColor = vec4(
        mix(
          solid.rgb,
          vec3(1.0, 0.0, 0.0),
          country.a
        ),
        1
      );
      return;
    }
  }
  
  outColor = solid;
}
`,
  uniforms: ['u_texture', 'u_texture2', 'u_selected'],
};

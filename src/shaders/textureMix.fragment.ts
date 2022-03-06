import type {FragmentShaderInfo} from '../utils/types';

export const textureMixFragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform uint u_selected;
uniform uint u_success[200];
uniform uint u_failed[10];
in vec2 v_texcoord;
out vec4 outColor;

void main() {
  vec4 solid = texture(u_texture, v_texcoord);
  vec4 country = texture(u_texture2, v_texcoord); 
  
  if (country.r > 0.0) {
    uint cur = uint(country.r * 255.0 + 0.5);
  
    int useMix = 0;
    vec3 mixColor = vec3(0.0, 0.0, 0.0);
    
    for (int i = 0; i < 200; i++) {
      if (u_success[i] == cur) {
        mixColor = vec3(0.0, 1.0, 0.0);
        useMix = 1;
      }
    }
    
    if (useMix == 0) {
      if (
        cur == u_failed[0] ||
        cur == u_failed[1] ||
        cur == u_failed[2] ||
        cur == u_failed[3] ||
        cur == u_failed[4] ||
        cur == u_failed[5] ||
        cur == u_failed[6] ||
        cur == u_failed[7] ||
        cur == u_failed[8] ||
        cur == u_failed[9]
      ) {
        mixColor = vec3(1.0, 0.0, 0.0);
        useMix = 1;
      } else if (u_selected == cur) {
        mixColor = vec3(1.0, 0.64, 0.0);
        useMix = 1;
      }
    }
    
    if (useMix == 1) {
      outColor = vec4(
        mix(
          solid.rgb,
          mixColor,
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
  uniforms: ['u_texture', 'u_texture2', 'u_selected', 'u_success', 'u_failed'],
};

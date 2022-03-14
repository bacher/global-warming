import type {FragmentShaderInfo} from '../utils/types';

export const texture2FragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_texture2;

in vec2 v_texcoord;
in vec2 v_texcoord2;

out vec4 outColor;

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  vec4 colorB = texture(u_texture2, v_texcoord2);
 
  /*
  if (color[0] == 0.0) {
    outColor = colorB;
    // outColor = vec4(0.3,0.3,0.0,1.0);
    return;
  }
   */

  vec4 cc = vec4(mix(colorB.rgb, color.rgb, color.r), 1);
  outColor = vec4(0, cc.r, 0, 1);
  // outColor = colorB;
  // outColor = color;
}
`,
  uniforms: ['u_texture', 'u_texture2'],
};

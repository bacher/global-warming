import type {FragmentShaderInfo} from '../utils/types';

export const textureFragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_texture;
in vec2 v_texcoord;
out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texcoord);
}
`,
  uniforms: ['u_texture'],
};

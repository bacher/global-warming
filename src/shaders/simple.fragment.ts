import type {FragmentShaderInfo} from '../utils/types';

export const simpleFragmentShaderInfo: FragmentShaderInfo = {
  source: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(1, 0, 0, 1);
}
`,
  uniforms: [],
};

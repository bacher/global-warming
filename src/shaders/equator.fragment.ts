import type {FragmentShaderInfo} from '../utils/types';

export const equatorFragmentShaderInfo: FragmentShaderInfo = {
  source: `
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

out vec4 out_color;

void main() {
  out_color = vec4(0, 0, 0, 1);
}
`,
  uniforms: [],
};

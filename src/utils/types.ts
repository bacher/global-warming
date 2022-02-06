export type VertexShaderInfo = {
  source: string;
  uniforms: string[];
  attributes: string[];
};

export type FragmentShaderInfo = {
  source: string;
  uniforms: string[];
};

export type ShaderProgram = {
  program: WebGLProgram;
  locations: {
    getUniform: (uniformName: string) => WebGLUniformLocation | null;
    getAttribute: (attributeName: string) => number;
  };
};

export type SceneObject = {
  verticesCount: number;
};

export type Scene = {
  shaderProgram: ShaderProgram;
  vao: WebGLVertexArrayObject;
  objects: SceneObject[];
};

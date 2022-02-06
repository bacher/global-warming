export type ShaderInfo = {
  source: string;
  attributes: string[];
};

export type ShaderProgram = {
  program: WebGLProgram;
  locations: {
    getAttributeLocation: (attrName: string) => number;
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

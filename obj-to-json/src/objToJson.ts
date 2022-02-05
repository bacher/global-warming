import fs from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);

const [filename] = args;

if (!filename) {
  console.info('No filename');
  process.exit(1);
}

const outFileName = path.join(
  path.dirname(filename),
  `${path.basename(filename, '.obj')}.json`,
);

type vec2 = [number, number];
type vec3 = [number, number, number];

type FaceVertex = {
  vertex: number;
  uv?: number;
  normal?: number;
};

type Face = [FaceVertex, FaceVertex, FaceVertex];

type WavefrontObject = {
  name: string;
  mtl?: string;
  smoothShading?: number | string;
  vertices: vec3[];
  uvs: vec2[];
  normals: vec3[];
  faces: Face[];
};

type Results = {
  mtlLib?: string;
  objects: WavefrontObject[];
};

function parseFacePoint(str: string): FaceVertex {
  const parts = str.split(/\s*\/\s*/).map((part) => {
    if (part === '') {
      return undefined;
    }

    return Number(part) - 1;
  });

  if (
    parts.some(
      (part) => part !== undefined && (!Number.isInteger(part) || part < 0),
    )
  ) {
    console.error('Invalid face definition:', parts);
    throw new Error('Invalid face');
  }

  const [vertex, uv, normal] = parts;

  if (vertex === undefined) {
    console.error('Invalid face definition:', parts);
    throw new Error('Invalid face');
  }

  return {
    vertex,
    uv,
    normal,
  };
}

function adaptPoint(obj: WavefrontObject, point: FaceVertex, shifts: Shifts) {
  point.vertex -= shifts.verticesShift;
  if (point.vertex < 0) {
    throw new Error('Invalid face definition');
  }

  if (point.normal !== undefined) {
    point.normal -= shifts.normalsShift;
    if (point.normal < 0) {
      throw new Error('Invalid face definition');
    }
  }

  if (point.uv !== undefined) {
    point.uv -= shifts.textureShift;
    if (point.uv < 0) {
      throw new Error('Invalid face definition');
    }
  }

  if (point.vertex >= obj.vertices.length) {
    // console.log('Ver', point.vertex, obj.vertices.length);
    throw new Error('Face vertex index out of rance');
  }
  if (point.uv !== undefined && point.uv >= obj.uvs.length) {
    // console.log('Tex', point.uv, obj.uvs.length);
    throw new Error('Face texture index out of rance');
  }
  if (point.normal !== undefined && point.normal >= obj.normals.length) {
    // console.log('Nor', point.normal, obj.normals.length);
    throw new Error('Face normal index out of rance');
  }
}

type Shifts = {
  verticesShift: number;
  textureShift: number;
  normalsShift: number;
};

async function start() {
  const objFile = await fs.readFile(filename, 'utf-8');

  const lines = objFile
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('#'));

  const results: Results = {
    mtlLib: undefined,
    objects: [],
  };

  let currentObject: WavefrontObject | undefined;

  const shifts: Shifts = {
    verticesShift: 0,
    textureShift: 0,
    normalsShift: 0,
  };

  for (const line of lines) {
    const match = line.match(/^(\w+)\s+(.*)$/);

    if (!match) {
      continue;
    }

    const [, command, rest] = match;

    switch (command) {
      case 'mtllib':
        results.mtlLib = rest;
        break;
      case 'o':
        if (currentObject) {
          shifts.verticesShift += currentObject.vertices.length;
          shifts.normalsShift += currentObject.normals.length;
          shifts.textureShift += currentObject.uvs.length;
        }

        currentObject = {
          name: rest,
          vertices: [],
          uvs: [],
          normals: [],
          faces: [],
        };
        results.objects.push(currentObject);
        break;
      case 'v':
      case 'vt':
      case 'vn': {
        if (!currentObject) {
          throw new Error('No current object');
        }

        const parts = rest.split(/\s+/).map(Number);

        if (parts.some((number) => Number.isNaN(number))) {
          throw new Error('Invalid value');
        }

        switch (command) {
          case 'v':
            if (parts.length !== 3) {
              throw new Error('Invalid vertex');
            }

            currentObject.vertices.push(parts as vec3);
            break;
          case 'vn':
            if (parts.length !== 3) {
              throw new Error('Invalid normal');
            }

            currentObject.normals.push(parts as vec3);
            break;
          case 'vt':
            if (parts.length !== 2) {
              throw new Error('Invalid uv');
            }

            currentObject.uvs.push(parts as vec2);
            break;
        }
        break;
      }
      case 'f': {
        if (!currentObject) {
          throw new Error('No current object');
        }

        const points = rest.split(/\s+/).map(parseFacePoint);

        points.forEach((point) => {
          adaptPoint(currentObject!, point, shifts);
        });

        if (points.length === 4) {
          currentObject.faces.push(
            [points[0], points[1], points[2]],
            [points[2], points[3], points[0]],
          );
        } else if (points.length === 3) {
          currentObject.faces.push(points as Face);
        } else {
          throw new Error('Invalid face');
        }
        break;
      }
      case 'usemtl':
        if (!currentObject) {
          throw new Error('No current object');
        }

        currentObject.mtl = rest;
        break;
      case 's': {
        if (!currentObject) {
          throw new Error('No current object');
        }

        let smoothShading: number | string = parseInt(rest, 10);

        if (
          smoothShading.toString() !== rest ||
          !Number.isInteger(smoothShading)
        ) {
          smoothShading = rest;
        }

        currentObject.smoothShading = smoothShading;
        break;
      }
      default:
        console.warn('Unknown declaration:', command);
    }
  }

  if (!results.objects.length) {
    throw new Error('No objects found');
  }

  for (const obj of results.objects) {
    console.log(
      `[Object] \
${obj.name.padEnd(20)} \
Vertices: ${obj.vertices.length}, \
Normals: ${obj.normals.length}, \
Texture Coords: ${obj.uvs.length}, \
Faces: ${obj.faces.length}`,
    );
  }

  await fs.writeFile(outFileName, JSON.stringify(results));

  console.info('Model have been written into file:', outFileName);
}

start().catch((error) => {
  console.error(error);
  process.exit(2);
});

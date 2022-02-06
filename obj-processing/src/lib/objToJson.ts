import type {Face, FaceVertex, JSONResults, WavefrontObject} from './types';
import {isVec2, isVec3} from './utils';

type WavefrontObjectInner = WavefrontObject & {
  deduplicated: {
    vertices: number;
    normals: number;
    uvs: number;
  };
  caches: {
    vertices: Map<string, number>;
    verticesIndex: number;
    verticesMatch: Map<number, number>;
    uvs: Map<string, number>;
    uvsIndex: number;
    uvsMatch: Map<number, number>;
    normals: Map<string, number>;
    normalsIndex: number;
    normalsMatch: Map<number, number>;
  };
};

type JSONResultsTemp = {
  mtlLib?: string;
  objects: WavefrontObjectInner[];
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

function adaptPoint(
  obj: WavefrontObjectInner,
  point: FaceVertex,
  shifts: Shifts,
): FaceVertex {
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

  const vertex = obj.caches.verticesMatch.get(point.vertex);
  let normal;
  let uv;

  if (vertex === undefined) {
    console.log('get vertex by', point.vertex);
    throw new Error('Match is not found');
  }

  if (point.normal !== undefined) {
    normal = obj.caches.normalsMatch.get(point.normal);
    if (normal === undefined) {
      console.log('get normal by', point.normal);
      throw new Error('Match is not found');
    }
  }

  if (point.uv !== undefined) {
    uv = obj.caches.uvsMatch.get(point.uv);
    if (uv === undefined) {
      console.log('get uv by', point.uv);
      throw new Error('Match is not found');
    }
  }

  return {
    vertex,
    normal,
    uv,
  };
}

type Shifts = {
  verticesShift: number;
  textureShift: number;
  normalsShift: number;
};

export type Options = {
  precision?: number;
  filter?: string;
};

export function objToJson(
  objFile: string,
  {precision, filter}: Options,
): JSONResults {
  const lines = objFile
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('#'));

  const results: JSONResultsTemp = {
    mtlLib: undefined,
    objects: [],
  };

  let currentObject: WavefrontObjectInner | undefined;

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
          shifts.verticesShift += currentObject.caches.verticesIndex;
          shifts.normalsShift += currentObject.caches.normalsIndex;
          shifts.textureShift += currentObject.caches.uvsIndex;
        }

        currentObject = {
          name: rest,
          vertices: [],
          uvs: [],
          normals: [],
          faces: [],
          deduplicated: {
            vertices: 0,
            normals: 0,
            uvs: 0,
          },
          caches: {
            vertices: new Map(),
            verticesIndex: 0,
            verticesMatch: new Map(),
            uvs: new Map(),
            uvsIndex: 0,
            uvsMatch: new Map(),
            normals: new Map(),
            normalsIndex: 0,
            normalsMatch: new Map(),
          },
        };
        Object.defineProperty(currentObject, 'caches', {enumerable: false});
        Object.defineProperty(currentObject, 'deduplicated', {
          enumerable: false,
        });

        results.objects.push(currentObject);
        break;
      case 'v':
      case 'vt':
      case 'vn': {
        if (!currentObject) {
          throw new Error('No current object');
        }

        const {caches} = currentObject;
        const parts = rest.split(/\s+/).map((v) => {
          const num = Number(v);

          if (precision !== undefined) {
            return Number(num.toFixed(precision));
          }

          return num;
        });

        if (parts.some((number) => Number.isNaN(number))) {
          throw new Error('Invalid value');
        }

        const serialized = parts.join('|');

        switch (command) {
          case 'v': {
            if (!isVec3(parts)) {
              throw new Error('Invalid vertex');
            }

            const currentIndex = caches.verticesIndex++;
            let vertexIndex = caches.vertices.get(serialized);
            if (vertexIndex === undefined) {
              vertexIndex = currentObject.vertices.length;
              currentObject.vertices.push(parts);
              caches.vertices.set(serialized, vertexIndex);
            } else {
              currentObject.deduplicated.vertices++;
            }
            caches.verticesMatch.set(currentIndex, vertexIndex);
            break;
          }
          case 'vn': {
            if (!isVec3(parts)) {
              throw new Error('Invalid normal');
            }

            const currentIndex = caches.normalsIndex++;
            let normalIndex = caches.normals.get(serialized);
            if (normalIndex === undefined) {
              normalIndex = currentObject.normals.length;
              currentObject.normals.push(parts);
              caches.normals.set(serialized, normalIndex);
            } else {
              currentObject.deduplicated.normals++;
            }
            caches.normalsMatch.set(currentIndex, normalIndex);
            break;
          }
          case 'vt': {
            if (!isVec2(parts)) {
              throw new Error('Invalid uv');
            }

            const currentIndex = caches.uvsIndex++;
            let normalIndex = caches.uvs.get(serialized);
            if (normalIndex === undefined) {
              normalIndex = currentObject.uvs.length;
              currentObject.uvs.push(parts);
              caches.uvs.set(serialized, normalIndex);
            } else {
              currentObject.deduplicated.uvs++;
            }
            caches.uvsMatch.set(currentIndex, normalIndex);
            break;
          }
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

  let filteredObjects = results.objects;

  if (filter) {
    filteredObjects = filteredObjects.filter(({name}) => name === filter);
  }

  if (!filteredObjects.length) {
    throw new Error('No objects found');
  }

  for (const obj of results.objects) {
    const details = filteredObjects.includes(obj)
      ? `Vertices: ${obj.vertices.length}, \
Normals: ${obj.normals.length}, \
UVs: ${obj.uvs.length}, \
Faces: ${obj.faces.length}, \
Dedupl (v/n/t): \
${obj.deduplicated.vertices}/\
${obj.deduplicated.normals}/\
${obj.deduplicated.uvs}`
      : 'SKIP';

    console.log(`[Object] ${obj.name.padEnd(20)} ${details}`);
  }

  return {
    mtlLib: results.mtlLib,
    objects: filteredObjects,
  };
}

import path from 'path';
import fs from 'fs/promises';
import type {JSONResults} from './lib/types';
import {jsonToBinary} from './lib/jsonToBinary';

const args = process.argv.slice(2);

async function start() {
  const [fileName] = args;

  if (!fileName) {
    throw new Error('No file name');
  }

  const outFileNamePrefix = path.join(
    path.dirname(fileName),
    path.basename(fileName, '.json'),
  );

  const json = await fs.readFile(fileName, 'utf-8');

  const model = JSON.parse(json) as JSONResults;

  for (const obj of model.objects) {
    const buffer = jsonToBinary(obj);
    const outFile = `${outFileNamePrefix}.${obj.name}.bin`;
    await fs.writeFile(outFile, buffer);
    console.info(`Model "${obj.name}" have been written into: ${outFile}`);
  }
}

start().catch((error) => {
  console.error('Critical Error:', error);
  process.exit(10);
});

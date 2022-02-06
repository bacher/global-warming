import path from 'path';
import fs from 'fs/promises';

import {objToJson} from './lib/objToJson';
import {strictParseInt} from './lib/cli';

const args = process.argv.slice(2);

async function start() {
  let precision: number | undefined;
  let fileName: string | undefined;
  let filter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const value = args[i];

    const flagMatch = value.match(/^--([\w-]+)$/);

    if (flagMatch) {
      const [, flag] = flagMatch;
      const nextValue = args[i + 1];

      switch (flag) {
        case 'precision':
          precision = strictParseInt(nextValue);
          i++;
          break;
        case 'filter':
          filter = nextValue;
          i++;

          break;
        default:
          console.error(`Invalid flag "${value}"`);
          process.exit(1);
      }
    } else {
      fileName = value;
    }
  }

  if (!fileName) {
    console.info('No file name');
    process.exit(1);
    return;
  }

  const outFileName = path.join(
    path.dirname(fileName),
    `${path.basename(fileName, '.obj')}.json`,
  );

  const objFile = await fs.readFile(fileName, 'utf-8');

  if (precision !== undefined) {
    console.log('Precision:', precision);
  }

  if (filter) {
    console.log(`Filter: "${filter}"`);
  }

  const results = objToJson(objFile, {
    precision,
    filter,
  });

  await fs.writeFile(outFileName, JSON.stringify(results));

  console.info('Model have been written into file:', outFileName);
}

start().catch((error) => {
  console.error(error);
  process.exit(2);
});

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const source = resolve('public/favicon.svg');
const image = await loadImage(await readFile(source));

for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  canvas.getContext('2d').drawImage(image, 0, 0, size, size);
  await writeFile(resolve(`public/icon-${size}.png`), canvas.toBuffer('image/png'));
}

console.log('PWA icons are current.');

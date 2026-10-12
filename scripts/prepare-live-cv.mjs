// Build the browser renderer from the PDF.js package already in package-lock.json.
import { access, cp, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const packagePath = require.resolve('pdfjs-dist/package.json');
const pdfjsRoot = path.dirname(packagePath);
const { version } = JSON.parse(await readFile(packagePath, 'utf8'));
const { liveCv } = await import(pathToFileURL(path.join(root, 'config/live-cv.mjs')).href);
const expectedBase = `/cv/runtime/pdfjs-${version}/`;
if (liveCv.pdfjsBase !== expectedBase) {
  throw new Error(`PDF.js ${version} is installed but live-cv.mjs expects ${liveCv.pdfjsBase}. Keep the installed library and worker versions consistent.`);
}
const files = [
  ['build/pdf.min.mjs', 'pdf.min.mjs'],
  ['build/pdf.worker.min.mjs', 'pdf.worker.min.mjs'],
  ['cmaps', 'cmaps'], ['standard_fonts', 'standard_fonts'], ['LICENSE', 'LICENSE'],
];
for (const [source] of files) await access(path.join(pdfjsRoot, source));
const target = path.join(root, 'public', liveCv.pdfjsBase.replace(/^\//, ''));
await mkdir(target, { recursive: true });
for (const [source, destination] of files) {
  await cp(path.join(pdfjsRoot, source), path.join(target, destination), { recursive: true });
}
console.log(`Prepared live CV browser renderer (PDF.js ${version}).`);

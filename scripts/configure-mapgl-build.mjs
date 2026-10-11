// Run once locally. npm then repeats this lightweight guard before astro check.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'tsconfig.json');
let config = await readFile(configPath, 'utf8');
for (const directory of ['public', 'teaching']) {
  const exclude = /("exclude"\s*:\s*\[)([^\]]*)(\])/;
  const match = config.match(exclude);
  if (!match) throw new Error('Expected an exclude array in tsconfig.json. Add public and teaching to that array.');
  if (match[2].includes(`"${directory}"`)) continue;
  const entries = match[2].trimEnd();
  const separator = entries.trim() && !entries.endsWith(',') ? ', ' : ' ';
  config = config.replace(exclude, `$1${entries}${separator}"${directory}"$3`);
}
const packagePath = path.join(root, 'package.json');
const originalPackage = await readFile(packagePath, 'utf8');
const pkg = JSON.parse(originalPackage);
pkg.scripts ??= {};
const guard = 'node scripts/configure-mapgl-build.mjs';
if (!(pkg.scripts.precheck ?? '').includes(guard)) {
  pkg.scripts.precheck = pkg.scripts.precheck ? `${guard} && ${pkg.scripts.precheck}` : guard;
}
if (config !== await readFile(configPath, 'utf8')) await writeFile(configPath, config);
const updatedPackage = JSON.stringify(pkg, null, 2) + '\n';
if (updatedPackage !== originalPackage) await writeFile(packagePath, updatedPackage);
console.log('Build guard ready: static browser assets and Quarto authoring files are excluded from TypeScript checks.');

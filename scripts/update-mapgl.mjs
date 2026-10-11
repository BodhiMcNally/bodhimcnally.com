// Optional local authoring command; hosting builds use the supplied native content.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { embedMapgl } from './embed-mapgl.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'teaching/mapgl-source');
const destination = path.join(root, 'public/resources/mapgl');
const downloadsOnly = process.argv.includes('--downloads-only');
const fromIndex = process.argv.indexOf('--from-html');
const fromHtml = fromIndex < 0 ? undefined : process.argv[fromIndex + 1];
if (fromIndex >= 0 && !fromHtml) throw new Error('--from-html needs a path to an executed, self-contained Quarto HTML file.');
const excluded = new Set(['_site', '.quarto', 'downloads', 'exports', 'renv', '.git', '__pycache__']);
async function walk(directory, exclusions = new Set()) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (exclusions.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await walk(absolute, exclusions));
    else if (entry.isFile()) out.push(absolute);
  }
  return out.sort();
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: source, stdio: 'inherit', shell: false });
  if (result.error) throw new Error(`Could not run ${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

let buildDirectory;
if (!downloadsOnly) {
  let html;
  try {
    if (fromHtml) {
      html = await readFile(path.resolve(fromHtml), 'utf8');
    } else {
      // Avoid exposing Quarto vendor libraries to Astro's broad TypeScript scan.
      buildDirectory = await mkdtemp(path.join(os.tmpdir(), 'bodhi-mapgl-quarto-'));
      run(process.env.QUARTO_CLI || 'quarto', ['render', '--output-dir', buildDirectory]);
      html = await readFile(path.join(buildDirectory, 'index.html'), 'utf8');
    }
    const summary = await embedMapgl(html, root);
    console.log(`Embedded ${summary.maps} map outputs and ${summary.headings} tutorial sections in the native resource.`);
    await import('./apply-mapgl-update.mjs');
  } finally {
    if (buildDirectory) await rm(buildDirectory, { recursive: true, force: true });
    await rm(path.join(source, '.quarto'), { recursive: true, force: true });
  }
}

// Prepared data and the executable source bundle remain available to students.
const dataRoot = path.join(source, 'data');
const checksums = [];
for (const file of (await walk(dataRoot)).filter(file => path.basename(file) !== 'SHA256SUMS.txt')) {
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  checksums.push(`${hash}  ${path.relative(dataRoot, file).split(path.sep).join('/')}`);
}
await writeFile(path.join(dataRoot, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
await mkdir(path.join(source, 'downloads'), { recursive: true });
await cp(path.join(source, 'index.qmd'), path.join(source, 'downloads/index.qmd.txt'));
await rm(path.join(source, 'downloads/project2-starter.qmd.txt'), { force: true });
const zipEntries = {};
for (const file of await walk(source, excluded)) {
  const relative = path.relative(source, file).split(path.sep).join('/');
  if (/(?:\.Rhistory|\.RData|\.pyc|\.rmarkdown|\.knit\.md)$/.test(relative) || path.basename(file).startsWith('.Renviron')) continue;
  zipEntries[`mapgl-tutorial/${relative}`] = new Uint8Array(await readFile(file));
}
await writeFile(path.join(source, 'downloads/mapgl-tutorial-source.zip'), zipSync(zipEntries, { level: 6 }));
await mkdir(path.join(destination, 'downloads'), { recursive: true });
await cp(path.join(source, 'downloads'), path.join(destination, 'downloads'), { recursive: true });
await mkdir(path.join(destination, 'data'), { recursive: true });
for (const entry of await readdir(dataRoot, { withFileTypes: true })) {
  if (entry.isFile()) await cp(path.join(dataRoot, entry.name), path.join(destination, 'data', entry.name));
}
console.log('Updated the native tutorial and student source download. Run npm run verify, then commit and push.');

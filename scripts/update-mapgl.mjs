// Optional local authoring command. Ordinary Astro builds use the supplied HTML.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'teaching', 'mapgl-source');
const destination = path.join(root, 'public', 'resources', 'mapgl');
const publishOnly = process.argv.includes('--publish-only');
const downloadsOnly = process.argv.includes('--downloads-only');
// Keep generated vendor libraries outside Astro's TypeScript project.
const buildDirectory = downloadsOnly ? null : publishOnly ? path.join(source, '_site') :
  await mkdtemp(path.join(os.tmpdir(), 'bodhi-mapgl-quarto-'));
async function walk(directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await walk(absolute));
    else if (entry.isFile()) out.push(absolute);
  }
  return out.sort();
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: source, stdio: 'inherit', shell: false });
  if (result.error) throw new Error(`Could not run ${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

// Refresh data checksums and student downloads before Quarto copies resources.
const dataRoot = path.join(source, 'data');
const dataFiles = (await walk(dataRoot)).filter(file => path.basename(file) !== 'SHA256SUMS.txt');
const checksums = [];
for (const file of dataFiles) {
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  checksums.push(`${hash}  ${path.relative(dataRoot, file).split(path.sep).join('/')}`);
}
await writeFile(path.join(dataRoot, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
await mkdir(path.join(source, 'downloads'), { recursive: true });
for (const name of ['index.qmd', 'project2-starter.qmd'])
  await cp(path.join(source, name), path.join(source, 'downloads', `${name}.txt`));
const excluded = new Set(['_site', '.quarto', 'downloads', 'exports', 'renv', '.git', '__pycache__']);
const zipEntries = {};
for (const file of await walk(source)) {
  const relative = path.relative(source, file).split(path.sep).join('/');
  if (relative.split('/').some(part => excluded.has(part)) || /(?:\.Rhistory|\.RData|\.pyc)$/.test(relative)
      || path.basename(file).startsWith('.Renviron')) continue;
  zipEntries[`mapgl-tutorial/${relative}`] = new Uint8Array(await readFile(file));
}
await writeFile(path.join(source, 'downloads', 'mapgl-tutorial-source.zip'), zipSync(zipEntries, { level: 6 }));

if (downloadsOnly) {
  await mkdir(path.join(destination, 'downloads'), { recursive: true });
  await cp(path.join(source, 'downloads'), path.join(destination, 'downloads'), { recursive: true });
  console.log('Refreshed the downloadable Quarto sources and source archive.');
  process.exit(0);
}

if (!publishOnly) {
  run(process.env.QUARTO_R || 'Rscript', ['scripts/export-example.R']);
  run(process.env.QUARTO_CLI || 'quarto', ['render', '--output-dir', buildDirectory]);
} else {
  // Useful after a separate successful Quarto render; does not rerun R.
  await cp(path.join(source, 'downloads'), path.join(buildDirectory, 'downloads'), { recursive: true });
  await cp(path.join(dataRoot, 'SHA256SUMS.txt'), path.join(buildDirectory, 'data', 'SHA256SUMS.txt'));
}
await mkdir(destination, { recursive: true });
// Every published HTML dependency is embedded: site_libs is redundant.
await cp(buildDirectory, destination, { recursive: true,
  filter: file => path.basename(file) !== 'site_libs' });
await rm(path.join(destination, 'site_libs'), { recursive: true, force: true });
await cp(path.join(source, 'exports', 'sydney-sa2-preview.html'),
         path.join(destination, 'sydney-sa2-preview.html'));

for (const name of ['index.html', 'project2-starter.html', 'sydney-sa2-preview.html']) {
  const file = path.join(destination, name);
  let html = await readFile(file, 'utf8');
  html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
  const canonical = `<link rel="canonical" href="https://bodhimcnally.com/resources/mapgl/${name}">`;
  html = html.replace('</head>', `${canonical}\n<style id="mapgl-publication-css">.mapgl-legend-title{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.3!important}</style>\n</head>`);
  if (name === 'sydney-sa2-preview.html') {
    html = html.replace('<html>', '<html lang="en-AU">');
    html = html.replace('</head>', `<meta name="description" content="Interactive ABS June 2025 population density map for Greater Sydney SA2s.">
<style>html,body{margin:0;font-family:system-ui,sans-serif;color:#172f46;background:#fff}main{padding:12px}h1{font-size:18px;margin:0 0 8px}p{font-size:12px;line-height:1.45;margin:8px 0}.mapboxgl-legend,.maplibregl-legend{max-width:calc(100% - 44px)}.legend-title{white-space:normal}.legend-text{min-width:0;white-space:normal;overflow:visible;text-overflow:clip}</style>\n</head>`);
    html = html.replace(/(<body[^>]*>)/i, '$1<main><h1>Greater Sydney population density</h1>');
    html = html.replace('</body>', '<p>Residents per km², June 2025. Sources: ABS Regional population 2024–25 and ASGS 2021. Estimates are preliminary. <a href="index.html">Full tutorial</a>.</p></main></body>');
  }
  await writeFile(file, html);
}
// Remove only this helper's generated cache after publication.
await rm(buildDirectory, { recursive: true, force: true });
await rm(path.join(source, '.quarto'), { recursive: true, force: true });
await rm(path.join(source, 'exports', 'sydney-sa2-preview_files'), { recursive: true, force: true });
console.log('Updated public/resources/mapgl and the downloadable source bundle. Run npm run verify, then commit and push.');

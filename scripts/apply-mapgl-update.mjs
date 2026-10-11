// Run once after merging the update files into an existing website.
// Only the mapgl branch is added; other resource-page customisations are preserved.
import { access, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const relative of [
  'src/components/MapglTutorial.astro', 'src/data/mapgl/tutorial.html',
  'src/data/mapgl/headings.json', 'public/resources/mapgl/runtime/mapgl.js',
]) await access(path.join(root, relative));
const page = path.join(root, 'src/pages/resources/[id].astro');
let text = await readFile(page, 'utf8');
const configPath = path.join(root, 'tsconfig.json');
let config = await readFile(configPath, 'utf8');
const excludedAssets = 'public/resources/mapgl';
if (!config.includes(`"${excludedAssets}"`)) {
  const exclude = /("exclude"\s*:\s*\[)([^\]]*)(\])/;
  const found = config.match(exclude);
  if (!found) throw new Error('Could not find tsconfig.json exclude list. No files were changed. Add public/resources/mapgl to the existing exclude array, then rerun.');
  const entries = found[2].trimEnd();
  const separator = entries.trim() && !entries.endsWith(',') ? ', ' : ' ';
  config = config.replace(exclude, `$1${entries}${separator}"${excludedAssets}"$3`);
}
if (!text.includes("import MapglTutorial from '@/components/MapglTutorial.astro';")) {
  const anchors = [
    "import TableOfContents from '@/components/TableOfContents.astro';",
    'const { Content, headings } = await render(entry);',
    '<TableOfContents headings={headings} />',
    '<Content />',
  ];
  for (const anchor of anchors) {
    if (text.split(anchor).length !== 2) {
      throw new Error(`Could not identify the resource-template insertion point: ${anchor}. No files were changed. Compare docs/MAPGL_INTEGRATION.md with your customised template.`);
    }
  }
  text = text.replace(anchors[0], `${anchors[0]}\nimport MapglTutorial from '@/components/MapglTutorial.astro';\nimport mapglHeadings from '@/data/mapgl/headings.json';`);
  text = text.replace(anchors[1], `${anchors[1]}\nconst isMapglTutorial = entry.id === 'interactive-maps-in-r-with-mapgl';\nconst resourceHeadings = isMapglTutorial ? mapglHeadings : headings;`);
  text = text.replace(anchors[2], '<TableOfContents headings={resourceHeadings} />');
  text = text.replace(anchors[3], '{isMapglTutorial ? <MapglTutorial /> : <Content />}');
  await writeFile(page, text);
}
// These are prebuilt browser dependencies and data, not TypeScript source files.
await writeFile(configPath, config);

// Exact obsolete paths from the previous tutorial package, not whole folders.
for (const relative of [
  'public/resources/mapgl/index.html',
  'public/resources/mapgl/project2-starter.html',
  'public/resources/mapgl/sydney-sa2-preview.html',
  'public/resources/mapgl/project2-starter.qmd',
  'public/resources/mapgl/downloads/project2-starter.qmd.txt',
  'public/resources/mapgl/styles.css',
  'public/resources/mapgl/search.json',
  'public/resources/mapgl/index.qmd',
  'public/resources/mapgl/scripts/install-packages.R',
  'public/resources/mapgl/R/prepare-sydney-data.R',
  'teaching/mapgl-source/project2-starter.qmd',
  'teaching/mapgl-source/project2-starter.rmarkdown',
  'teaching/mapgl-source/index.rmarkdown',
  'teaching/mapgl-source/downloads/project2-starter.qmd.txt',
  'teaching/mapgl-source/downloads/index.qmd.txt',
  'teaching/mapgl-source/downloads/mapgl-tutorial-source.zip',
  'teaching/mapgl-source/scripts/export-example.R',
]) await rm(path.join(root, relative), { force: true });
console.log('The full mapgl lesson now uses the native resource page. Obsolete starter and standalone pages removed.');

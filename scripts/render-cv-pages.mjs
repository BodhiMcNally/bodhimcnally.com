import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { pdfToImg } from 'pdftoimg-js';

const projectRoot = process.cwd();
const pdfPath = path.join(projectRoot, 'public/cv/Bodhi_McNally_Master_CV.pdf');
const outputDirectory = path.join(projectRoot, 'public/cv/pages');
const manifestPath = path.join(projectRoot, 'src/data/cv-pages.json');
const outputPattern = /^bodhi-cv-page-\d+\.webp$/;
const renderVersion = 1;

const source = await readFile(pdfPath);
const sourceHash = createHash('sha256').update(source).digest('hex');

const readManifest = async () => {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return null;
  }
};

const outputIsCurrent = async (manifest) => {
  if (
    !manifest ||
    manifest.renderVersion !== renderVersion ||
    manifest.sourceHash !== sourceHash ||
    !Array.isArray(manifest.pages) ||
    manifest.pages.length === 0
  ) return false;

  try {
    await Promise.all(
      manifest.pages.map((page) => access(path.join(projectRoot, 'public', page.replace(/^\//, '')))),
    );
    return true;
  } catch {
    return false;
  }
};

const previousManifest = await readManifest();
if (await outputIsCurrent(previousManifest)) {
  console.log(`CV preview is current (${previousManifest.pages.length} pages).`);
  process.exit(0);
}

await mkdir(outputDirectory, { recursive: true });
const temporaryDirectory = await mkdtemp(path.join(outputDirectory, '.cv-render-'));

try {
  console.log('The master CV changed. Rendering its page previews…');
  const rendered = await pdfToImg(pdfPath, {
    pages: 'all',
    imgType: 'png',
    scale: 2.223,
    background: 'rgb(255,255,255)',
    intent: 'display',
  });
  const pageImages = Array.isArray(rendered) ? rendered : [rendered];

  if (pageImages.length === 0) throw new Error('The PDF did not contain any renderable pages.');

  const pages = [];
  const dimensions = [];

  for (const [index, dataUrl] of pageImages.entries()) {
    const encoded = dataUrl.match(/^data:image\/(?:png|jpeg);base64,(.+)$/)?.[1];
    if (!encoded) throw new Error(`Page ${index + 1} did not return a valid image.`);

    const image = await loadImage(Buffer.from(encoded, 'base64'));
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0);

    const filename = `bodhi-cv-page-${index + 1}.webp`;
    await writeFile(path.join(temporaryDirectory, filename), await canvas.encode('webp', 84));
    pages.push(`/cv/pages/${filename}`);
    dimensions.push({ width: image.width, height: image.height });
  }

  const existingFiles = await readdir(outputDirectory);
  await Promise.all(
    existingFiles
      .filter((filename) => outputPattern.test(filename))
      .map((filename) => rm(path.join(outputDirectory, filename))),
  );

  for (const page of pages) {
    const filename = path.basename(page);
    await rename(path.join(temporaryDirectory, filename), path.join(outputDirectory, filename));
  }

  const manifest = { renderVersion, sourceHash, pages, dimensions };
  const temporaryManifest = `${manifestPath}.tmp`;
  await writeFile(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporaryManifest, manifestPath);
  console.log(`Rendered ${pages.length} CV pages as WebP.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

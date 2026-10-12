// Run once after merging this update into the existing website root.
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragment } from 'parse5';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const relative of [
  'api/cv.mjs', 'server/live-cv.mjs', 'config/live-cv.mjs',
  'src/components/LiveCv.astro', 'src/scripts/live-cv-client.ts',
  'public/cv/runtime/pdfjs-4.8.69/pdf.min.mjs',
  'public/cv/runtime/pdfjs-4.8.69/pdf.worker.min.mjs',
]) await access(path.join(root, relative));

const pagePath = path.join(root, 'src/pages/about.astro');
const sitePath = path.join(root, 'src/data/site.ts');
const checkerPath = path.join(root, 'scripts/check-links.mjs');
const vercelPath = path.join(root, 'vercel.json');
const tsconfigPath = path.join(root, 'tsconfig.json');
let [page, site, checker] = await Promise.all([pagePath, sitePath, checkerPath].map((file) => readFile(file, 'utf8')));
const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
let tsconfig = await readFile(tsconfigPath, 'utf8');

if (!page.includes('<LiveCv cv={site.cv} />')) {
  const importAnchor = "import { site } from '@/data/site';";
  if (page.split(importAnchor).length !== 2) throw new Error('Could not identify the site import in about.astro. No files changed.');
  const tree = parseFragment(page, { sourceCodeLocationInfo: true });
  const sections = [];
  function visit(node) {
    if (node.tagName === 'section' && node.attrs?.some((attribute) => attribute.name === 'id' && attribute.value === 'curriculum-vitae')) {
      sections.push(node);
    }
    node.childNodes?.forEach(visit);
  }
  visit(tree);
  if (sections.length !== 1 || !sections[0].sourceCodeLocation?.endTag) {
    throw new Error('Could not identify the complete curriculum-vitae section in about.astro. No files changed.');
  }
  const { startOffset, endOffset } = sections[0].sourceCodeLocation;
  page = page.slice(0, startOffset) + '<LiveCv cv={site.cv} />' + page.slice(endOffset);
  page = page.replace(importAnchor, `import LiveCv from '@/components/LiveCv.astro';\n${importAnchor}`);
}

if (!site.includes("downloadHref: '/api/cv?download=1'")) {
  const anchor = "downloadHref: '/cv/Bodhi_McNally_Master_CV.pdf'";
  if (site.split(anchor).length !== 2) throw new Error('Could not identify the CV download link in site.ts. No files changed.');
  site = site.replace(anchor, "downloadHref: '/api/cv?download=1'");
}

// The static link audit also recognises the one new, real Vercel function route.
const routeCheck = "if (resolved.pathname === '/api/cv' && await exists(path.join(projectRoot, 'api/cv.mjs'))) continue;";
if (!checker.includes(routeCheck)) {
  const anchor = 'const candidates = candidatesForPath(resolved.pathname);';
  if (checker.split(anchor).length !== 2) throw new Error('Could not identify the link-check insertion point. No files changed.');
  checker = checker.replace(anchor, `${routeCheck}\n    ${anchor}`);
}

vercel.functions ??= {};
vercel.functions['api/cv.mjs'] = { ...vercel.functions['api/cv.mjs'], maxDuration: 30 };
const exclude = /("exclude"\s*:\s*\[)([^\]]*)(\])/;
const excluded = tsconfig.match(exclude);
if (!excluded) throw new Error('Expected an exclude array in tsconfig.json. No files changed.');
if (!excluded[2].includes('"public"')) {
  const entries = excluded[2].trimEnd();
  const separator = entries.trim() && !entries.endsWith(',') ? ', ' : ' ';
  tsconfig = tsconfig.replace(exclude, `$1${entries}${separator}"public"$3`);
}

// Validate every insertion point before changing any original file.
for (const [file, text] of [
  [pagePath, page], [sitePath, site], [checkerPath, checker],
  [vercelPath, JSON.stringify(vercel, null, 2) + '\n'], [tsconfigPath, tsconfig],
]) {
  if (await readFile(file, 'utf8') !== text) await writeFile(file, text);
}
console.log('Live CV installed. Deploy once, then upload new versions of the existing Drive PDF.');

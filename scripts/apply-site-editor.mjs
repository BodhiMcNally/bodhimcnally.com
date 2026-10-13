// Migrate visible static copy into editable Markdown while preserving page layouts.
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from '@astrojs/compiler';
import { parseFragment } from 'parse5';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const copyPath = path.join(root, 'src/data/site-copy.json');
let copies = {};
try { copies = JSON.parse(await readFile(copyPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const proposals = new Map();
const editable = new Set('p h1 h2 h3 h4 h5 h6 li blockquote label summary dt dd'.split(' '));
const inline = new Set('em i strong b a code br del s sup sub'.split(' '));
const idFor = (file, offset, value) => 'copy-' + createHash('sha256').update(`${file}:${offset}:${value}`).digest('hex').slice(0, 16);
const codeOffset = (source, byteOffset) => Buffer.from(source).subarray(0, byteOffset).toString('utf8').length;
function tagEnd(source, start) {
  let quote = '', braces = 0;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) { if (character === quote && source[index - 1] !== '\\') quote = ''; continue; }
    if (['"', "'", '`'].includes(character)) { quote = character; continue; }
    if (character === '{') braces += 1;
    if (character === '}') braces -= 1;
    if (character === '>' && braces === 0) return index + 1;
  }
  throw new Error('Could not identify a component opening tag.');
}
const escapeText = text => text.replace(/\s+/g, ' ').replace(/([\\\[\]*_`~$<>])/g, '\\$1');
function htmlMarkdown(html) {
  const tree = parseFragment(html);
  function convert(node) {
    if (node.nodeName === '#text') return escapeText(node.value);
    const children = (node.childNodes ?? []).map(convert).join('');
    if (['em', 'i'].includes(node.tagName)) return `*${children}*`;
    if (['strong', 'b'].includes(node.tagName)) return `**${children}**`;
    if (['del', 's'].includes(node.tagName)) return `~~${children}~~`;
    if (node.tagName === 'code') return '`' + (node.childNodes ?? []).map(child => child.value ?? '').join('') + '`';
    if (node.tagName === 'br') return '  \n';
    if (node.tagName === 'a') return `[${children}](${node.attrs.find(attr => attr.name === 'href')?.value ?? '#'})`;
    if (['sup', 'sub'].includes(node.tagName)) return `<${node.tagName}>${children}</${node.tagName}>`;
    return children;
  }
  return tree.childNodes.map(convert).join('').trim();
}
function pure(node) {
  if (node.type === 'text') return true;
  if (node.type !== 'element' || !inline.has(node.name)) return false;
  if (node.attributes?.some(attr => !['quoted', 'empty'].includes(attr.kind))) return false;
  return (node.children ?? []).every(pure);
}
function record(file, offset, element, markdown, extras = {}) {
  const id = idFor(file, offset, markdown);
  copies[id] ??= { markdown, element, source: file, label: markdown.replace(/[*_`]/g, '').slice(0, 100), ...extras };
  return id;
}
async function files(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) results.push(...await files(path.join(directory, entry.name)));
    else results.push(path.join(directory, entry.name));
  }
  return results;
}

for (const file of await files(path.join(root, 'src'))) {
  if (!file.endsWith('.astro') || /(?:EditableCopy|MarkdownText|SiteEditorBridge|\/admin\/|\/posts\/)/.test(file)) continue;
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  let source = await readFile(file, 'utf8');
  if (relative === 'src/components/Footer.astro') source = source.replace(/\s*<li><button type="button" data-open-provenance>Site details<\/button><\/li>/, '');
  const { ast } = await parse(source, { position: true });
  const changes = [];
  function visit(node) {
    if (node.type === 'element' && ['script', 'style', 'pre', 'code', 'noscript'].includes(node.name)) return;
    if (node.type === 'element' && editable.has(node.name) && (node.children ?? []).length && node.children.every(pure)) {
      const start = codeOffset(source, node.position.start.offset), end = codeOffset(source, node.position.end.offset);
      const original = source.slice(start, end);
      const open = original.match(new RegExp(`^<${node.name}\\b[^>]*>`));
      if (!open || !original.endsWith(`</${node.name}>`)) throw new Error(`Could not locate editable text in ${relative}. No original files changed.`);
      const markdown = htmlMarkdown(original.slice(open[0].length, -(`</${node.name}>`.length)));
      if (!markdown) return;
      const id = record(relative, start, node.name, markdown);
      const attributes = open[0].slice(node.name.length + 1, -1).trim();
      changes.push({ start, end, value: `<EditableCopy copyId="${id}" as="${node.name}"${attributes ? ' ' + attributes : ''} />` });
      return;
    }
    if (node.type === 'component' && node.name === 'PageHeader' && !node.attributes.some(attr => attr.name === 'cmsTitle')) {
      const title = node.attributes.find(attr => attr.name === 'title' && attr.kind === 'quoted');
      if (title) {
        const start = codeOffset(source, node.position.start.offset), end = tagEnd(source, start);
        const original = source.slice(start, end);
        const id = record(relative, start, 'h1', title.value, { label: 'Page heading: ' + title.value });
        changes.push({ start, end, value: original.replace(/\s*\/>$/, ` cmsTitle="${id}" />`) });
      }
    }
    node.children?.forEach(visit);
  }
  visit(ast);
  changes.sort((a, b) => b.start - a.start).forEach(change => { source = source.slice(0, change.start) + change.value + source.slice(change.end); });
  if (changes.some(change => change.value.startsWith('<EditableCopy')) && !source.includes("import EditableCopy from '@/components/EditableCopy.astro';")) {
    source = source.startsWith('---')
      ? source.replace(/^---\r?\n/, "---\nimport EditableCopy from '@/components/EditableCopy.astro';\n")
      : "---\nimport EditableCopy from '@/components/EditableCopy.astro';\n---\n" + source;
  }
  proposals.set(file, source);
}

const profilePath = path.join(root, 'src/data/site.ts');
let profile = await readFile(profilePath, 'utf8');
const profileAst = ts.createSourceFile('site.ts', profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const fields = new Set(['name', 'shortName', 'defaultTitle', 'defaultDescription', 'location', 'currentRole', 'institution', 'clinicalSchool', 'introduction', 'researchSummary']);
const profileChanges = [];
function inspect(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(profileAst) === 'site') {
    let object = node.initializer;
    if (ts.isAsExpression(object)) object = object.expression;
    if (!ts.isObjectLiteralExpression(object)) throw new Error('Expected a site profile object.');
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property) || !fields.has(property.name.getText(profileAst))) continue;
      const name = property.name.getText(profileAst);
      if (!ts.isStringLiteral(property.initializer)) continue;
      const id = `profile-${name}`;
      copies[id] ??= { markdown: property.initializer.text, element: ['introduction', 'researchSummary'].includes(name) ? 'p' : 'plain', source: 'src/data/site.ts', label: name };
      profileChanges.push({ start: property.initializer.getStart(profileAst), end: property.initializer.end, value: `siteCopy['${id}'].markdown` });
    }
  }
  ts.forEachChild(node, inspect);
}
inspect(profileAst);
profileChanges.sort((a, b) => b.start - a.start).forEach(change => { profile = profile.slice(0, change.start) + change.value + profile.slice(change.end); });
if (profileChanges.length && !profile.includes("import siteCopy from './site-copy.json';")) profile = "import siteCopy from './site-copy.json';\n" + profile;
proposals.set(profilePath, profile);

const homePath = path.join(root, 'src/pages/index.astro');
let home = proposals.get(homePath);
for (const [name, className] of [['introduction', 'home-introduction__lead'], ['researchSummary', 'home-introduction__research']]) {
  home = home.replace(`<p class="${className}">{site.${name}}</p>`, `<EditableCopy copyId="profile-${name}" as="p" class="${className}" />`);
}
if (!home.includes("import EditableCopy from '@/components/EditableCopy.astro';")) home = home.replace(/^---\r?\n/, "---\nimport EditableCopy from '@/components/EditableCopy.astro';\n");
proposals.set(homePath, home);

const headerPath = path.join(root, 'src/components/PageHeader.astro');
let header = proposals.get(headerPath);
if (!header.includes('cmsTitle?: string;')) {
  header = header.replace('title: string;', 'title: string;\n  cmsTitle?: string;');
  header = header.replace('const { title, introduction }', 'const { title, introduction, cmsTitle }');
  header = header.replace('<h1>{title}</h1>', '{cmsTitle ? <EditableCopy copyId={cmsTitle} as="h1" /> : <h1>{title}</h1>}');
  if (!header.includes("import EditableCopy from '@/components/EditableCopy.astro';")) header = header.replace(/^---\r?\n/, "---\nimport EditableCopy from '@/components/EditableCopy.astro';\n");
}
proposals.set(headerPath, header);

// Move research records into JSON without evaluating source code.
const researchPath = path.join(root, 'src/data/research.ts');
let research = await readFile(researchPath, 'utf8');
const researchDataPath = path.join(root, 'src/data/research-content.json');
const researchAst = ts.createSourceFile('research.ts', research, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const data = {};
const researchChanges = [];
function literal(node) {
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
    if (!ts.isPropertyAssignment(property)) throw new Error('Expected literal research data.');
    return [ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(researchAst), literal(property.initializer)];
  }));
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  throw new Error('Expected literal research data. No original files changed.');
}
function researchVisit(node) {
  if (ts.isVariableDeclaration(node) && ['publications', 'presentations', 'projects'].includes(node.name.getText(researchAst)) && ts.isArrayLiteralExpression(node.initializer)) {
    const name = node.name.getText(researchAst);
    data[name] = literal(node.initializer);
    researchChanges.push({ start: node.initializer.getStart(researchAst), end: node.initializer.end, value: `researchContent.${name} as ${node.type.getText(researchAst)}` });
  }
  ts.forEachChild(node, researchVisit);
}
researchVisit(researchAst);
researchChanges.sort((a, b) => b.start - a.start).forEach(change => { research = research.slice(0, change.start) + change.value + research.slice(change.end); });
if (researchChanges.length) {
  research = "import researchContent from './research-content.json';\n" + research;
  proposals.set(researchDataPath, JSON.stringify(data, null, 2) + '\n');
}
await access(researchChanges.length ? researchPath : researchDataPath);
proposals.set(researchPath, research);

// The generated mapgl lesson is raw HTML, so retain its markup and mark text only.
const tutorialPath = path.join(root, 'src/data/mapgl/tutorial.html');
let tutorial = await readFile(tutorialPath, 'utf8');
const tutorialTree = parseFragment(tutorial, { sourceCodeLocationInfo: true });
const tutorialChanges = [];
function htmlPure(node) { return node.nodeName === '#text' || (inline.has(node.tagName) && node.childNodes?.every(htmlPure)); }
function tutorialVisit(node) {
  if (editable.has(node.tagName) && node.childNodes?.every(htmlPure) && !node.attrs.some(attr => attr.name === 'data-edit-copy')) {
    const location = node.sourceCodeLocation;
    if (location?.startTag && location?.endTag) {
      const markdown = htmlMarkdown(tutorial.slice(location.startTag.endOffset, location.endTag.startOffset));
      if (markdown) {
        const headingId = /^h[1-6]$/.test(node.tagName) ? node.attrs.find(attr => attr.name === 'id')?.value : undefined;
        const id = record('src/data/mapgl/tutorial.html', location.startOffset, node.tagName, markdown, { kind: 'html', ...(headingId ? { headingId } : {}) });
        tutorialChanges.push({ start: location.startTag.endOffset - 1, end: location.startTag.endOffset - 1, value: ` data-edit-copy="${id}"` });
        return;
      }
    }
  }
  if (!['script', 'style', 'pre', 'code'].includes(node.tagName)) node.childNodes?.forEach(tutorialVisit);
}
tutorialVisit(tutorialTree);
tutorialChanges.sort((a, b) => b.start - a.start).forEach(change => { tutorial = tutorial.slice(0, change.start) + change.value + tutorial.slice(change.end); });
proposals.set(tutorialPath, tutorial);
const mapComponentPath = path.join(root, 'src/components/MapglTutorial.astro');
let mapComponent = proposals.get(mapComponentPath);
if (!mapComponent.includes('applyHtmlCopies')) {
  mapComponent = mapComponent.replace(/^---\r?\n/, "---\nimport siteCopy from '@/data/site-copy.json';\nimport { applyHtmlCopies } from '../../server/editor/markdown.mjs';\n");
  const rawImport = mapComponent.match(/import (\w+) from ['"]@\/data\/mapgl\/tutorial\.html\?raw['"];?/);
  if (!rawImport) throw new Error('Could not identify the mapgl lesson import. No original files changed.');
  const name = rawImport[1];
  mapComponent = mapComponent.replace(rawImport[0], rawImport[0].replace(name, 'originalLesson') + `\nconst ${name} = await applyHtmlCopies(originalLesson, siteCopy);`);
}
proposals.set(mapComponentPath, mapComponent);
const resourcePath = path.join(root, 'src/pages/resources/[id].astro');
let resource = proposals.get(resourcePath);
if (!resource.includes('editableHeadings')) {
  resource = resource.replace(/^---\r?\n/, "---\nimport siteCopy from '@/data/site-copy.json';\nimport { editableHeadings } from '../../../server/editor/markdown.mjs';\n");
  resource = resource.replace("import mapglHeadings from '@/data/mapgl/headings.json';", "import originalMapglHeadings from '@/data/mapgl/headings.json';\nconst mapglHeadings = await editableHeadings(originalMapglHeadings, siteCopy);");
}
proposals.set(resourcePath, resource);

const layoutPath = path.join(root, 'src/layouts/BaseLayout.astro');
let layout = await readFile(layoutPath, 'utf8');
if (!layout.includes("import 'katex/dist/katex.min.css';")) layout = layout.replace(/^---\r?\n/, "---\nimport 'katex/dist/katex.min.css';\n");
if (!layout.includes('SiteEditorBridge')) {
  layout = layout.replace(/^---\r?\n/, "---\nimport SiteEditorBridge from '@/components/SiteEditorBridge.astro';\n");
  layout = layout.replace('<Footer />', '<Footer />\n    <SiteEditorBridge />');
}
proposals.set(layoutPath, layout);

const astroConfigPath = path.join(root, 'astro.config.mjs');
let astroConfig = await readFile(astroConfigPath, 'utf8');
if (!astroConfig.includes('SITE_EDITOR_ADMIN_SITEMAP')) {
  if (!astroConfig.includes('sitemap()')) throw new Error('Could not identify the sitemap configuration. No original files changed.');
  astroConfig = astroConfig.replace('sitemap()', "sitemap({ filter: page => !new URL(page).pathname.startsWith('/admin/') }) /* SITE_EDITOR_ADMIN_SITEMAP */");
}
proposals.set(astroConfigPath, astroConfig);

// Research descriptions and citations also support Markdown.
const researchPagePath = path.join(root, 'src/pages/research.astro');
let researchPage = proposals.get(researchPagePath);
if (!researchPage.includes("import MarkdownText from '@/components/MarkdownText.astro';")) {
  researchPage = researchPage.replace(/^---\r?\n/, "---\nimport MarkdownText from '@/components/MarkdownText.astro';\n");
  researchPage = researchPage.replace('<p>{project.shortDescription}</p>', '<MarkdownText text={project.shortDescription} />');
  researchPage = researchPage.replace('<p class="publication-list__citation">{publication.citation}</p>', '<MarkdownText class="publication-list__citation" text={publication.citation} />');
}
proposals.set(researchPagePath, researchPage);
// Make the complete post archive accessible from the home page.
home = proposals.get(homePath);
if (!home.includes('href="/posts/"')) {
  home = home.replace('<header class="home-updates__header">', '<a class="text-link" href="/posts/">All posts</a>\n    <header class="home-updates__header">');
}
proposals.set(homePath, home);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
for (const hook of ['prebuild', 'predev']) {
  const command = 'node scripts/prepare-site-editor.mjs';
  if (!pkg.scripts[hook]?.includes(command)) pkg.scripts[hook] = pkg.scripts[hook] ? `${command} && ${pkg.scripts[hook]}` : command;
}
proposals.set(packagePath, JSON.stringify(pkg, null, 2) + '\n');
const vercelPath = path.join(root, 'vercel.json');
const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
vercel.functions ??= {};
vercel.functions['api/editor.mjs'] = { ...vercel.functions['api/editor.mjs'], maxDuration: 30 };
proposals.set(vercelPath, JSON.stringify(vercel, null, 2) + '\n');
const swPath = path.join(root, 'public/sw.js');
let sw = await readFile(swPath, 'utf8');
sw = sw.replace("const CACHE = 'bodhi-academic-v4';", "const CACHE = 'bodhi-academic-v5';");
if (!sw.includes('// Editor sessions and deployment status always use the network.')) {
  const anchor = "if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;";
  if (sw.split(anchor).length !== 2) throw new Error('Could not identify the offline-worker guard. No original files changed.');
  sw = sw.replace(anchor, `${anchor}\n  // Editor sessions and deployment status always use the network.\n  if (['/api/editor', '/editor-build.json'].includes(new URL(event.request.url).pathname)) {\n    event.respondWith(fetch(event.request));\n    return;\n  }`);
}
if (!sw.includes('// Editor code updates bypass offline storage too.')) {
  sw = sw.replace("if (['/api/editor', '/editor-build.json'].includes(new URL(event.request.url).pathname)) {", "// Editor code updates bypass offline storage too.\n  if (['/api/editor', '/editor-build.json', '/admin'].includes(new URL(event.request.url).pathname) || new URL(event.request.url).pathname.startsWith('/admin/')) {");
  sw += `\n// Discard any editor files saved by an earlier offline worker.\nself.addEventListener('activate', event => {\n  event.waitUntil((async () => {\n    const cache = await caches.open(CACHE);\n    const requests = await cache.keys();\n    await Promise.all(requests.filter(request => {\n      const pathname = new URL(request.url).pathname;\n      return ['/api/editor', '/editor-build.json', '/admin'].includes(pathname) || pathname.startsWith('/admin/');\n    }).map(request => cache.delete(request)));\n  })());\n});\n`;
}
proposals.set(swPath, sw);
const ignorePath = path.join(root, '.gitignore');
let ignore = await readFile(ignorePath, 'utf8');
for (const generated of ['public/editor-build.json', 'public/cv/runtime/', 'public/admin/katex.min.css', 'public/admin/fonts/']) {
  if (!ignore.split(/\r?\n/).includes(generated)) ignore += `\n${generated}\n`;
}
proposals.set(ignorePath, ignore);
proposals.set(copyPath, JSON.stringify(copies, null, 2) + '\n');

// All migrations are prepared and validated before original files are written.
for (const [file, value] of proposals) {
  let previous;
  try { previous = await readFile(file, 'utf8'); } catch {}
  if (previous !== value) await writeFile(file, value);
}
console.log(`Site editor installed: ${Object.keys(copies).length} editable text blocks; Site details removed from the footer.`);

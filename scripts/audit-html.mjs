import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : absolute;
    }),
  );
  return files.flat();
}

const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const label = path.relative(distRoot, file);
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const ariaReferences = [...html.matchAll(/\saria-labelledby=["']([^"']+)["']/g)]
    .flatMap((match) => match[1].split(/\s+/));
  const formControls = [...html.matchAll(/<(input|select|textarea)\b[^>]*\sid=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[2]);

  if (!/<html\b[^>]*\slang=["'][^"']+["']/i.test(html)) {
    failures.push(`${label}: missing document language`);
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    failures.push(`${label}: missing page title`);
  }
  if (!/<meta\b[^>]*\sname=["']description["'][^>]*\scontent=["'][^"']+["']/i.test(html)) {
    failures.push(`${label}: missing meta description`);
  }
  if (!/<link\b[^>]*\srel=["']canonical["'][^>]*\shref=["']https:\/\/bodhimcnally\.com\//i.test(html)) {
    failures.push(`${label}: missing canonical URL`);
  }
  if ((html.match(/<main\b/gi) ?? []).length !== 1) {
    failures.push(`${label}: expected exactly one main landmark`);
  }
  if (headings.filter((level) => level === 1).length !== 1) {
    failures.push(`${label}: expected exactly one h1`);
  }
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      failures.push(`${label}: heading level jumps from h${headings[index - 1]} to h${headings[index]}`);
    }
  }
  for (const image of images) {
    if (!/\salt=["'][^"']*["']/i.test(image)) {
      failures.push(`${label}: image without alt attribute`);
    }
  }
  for (const id of duplicateIds) {
    failures.push(`${label}: duplicate id “${id}”`);
  }
  for (const id of ariaReferences) {
    if (!ids.includes(id)) {
      failures.push(`${label}: aria-labelledby references missing id “${id}”`);
    }
  }
  for (const id of formControls) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`<label\\b[^>]*\\sfor=["']${escaped}["']`, 'i').test(html)) {
      failures.push(`${label}: form control “${id}” has no matching label`);
    }
  }
  if (/href=["']#["']/i.test(html)) {
    failures.push(`${label}: empty fragment link`);
  }
}

const cssFiles = (await walk(path.join(distRoot, '_astro'))).filter((file) => file.endsWith('.css'));
const css = (await Promise.all(cssFiles.map((file) => readFile(file, 'utf8')))).join('\n');
if (!css.includes('prefers-reduced-motion:reduce')) {
  failures.push('CSS: reduced-motion override not found');
}
if (!css.includes(':focus-visible')) {
  failures.push('CSS: visible keyboard-focus style not found');
}

if (failures.length > 0) {
  console.error('HTML/accessibility audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Audited ${htmlFiles.length} HTML files: baseline accessibility and metadata checks passed.`);
}

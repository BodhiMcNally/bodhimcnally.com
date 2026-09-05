import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
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

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function routeForFile(filePath) {
  const relative = path.relative(distRoot, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function candidatesForPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  if (!relative || decoded.endsWith('/')) {
    return [path.join(distRoot, relative, 'index.html')];
  }
  if (path.extname(relative)) {
    return [path.join(distRoot, relative)];
  }
  return [
    path.join(distRoot, relative),
    path.join(distRoot, `${relative}.html`),
    path.join(distRoot, relative, 'index.html'),
  ];
}

const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'));
const failures = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const route = routeForFile(htmlFile);
  const hrefs = [...html.matchAll(/\shref=["']([^"']+)["']/g)].map((match) => match[1]);

  for (const href of hrefs) {
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('data:')
    ) {
      continue;
    }

    const resolved = new URL(href, `https://bodhimcnally.com${route}`);
    const candidates = candidatesForPath(resolved.pathname);
    const matchingFile = (await Promise.all(candidates.map(exists))).findIndex(Boolean);

    if (matchingFile === -1) {
      failures.push(`${route} → ${href} (missing target)`);
      continue;
    }

    if (resolved.hash) {
      const target = await readFile(candidates[matchingFile], 'utf8');
      const id = decodeURIComponent(resolved.hash.slice(1));
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\sid=["']${escaped}["']`).test(target)) {
        failures.push(`${route} → ${href} (missing fragment)`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Internal link check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML files: all internal links resolve.`);
}

// Run once after merging this small fix into the existing website root.
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['scripts/prepare-live-cv.mjs', 'config/live-cv.mjs', 'src/components/LiveCv.astro']) {
  await access(path.join(root, file));
}
const packagePath = path.join(root, 'package.json');
const swPath = path.join(root, 'public/sw.js');
const clientPath = path.join(root, 'src/scripts/live-cv-client.ts');
const [packageText, swOriginal, clientOriginal] = await Promise.all([packagePath, swPath, clientPath].map(file => readFile(file, 'utf8')));
const pkg = JSON.parse(packageText);
pkg.scripts ??= {};
const prepare = 'node scripts/prepare-live-cv.mjs';
for (const hook of ['prebuild', 'predev']) {
  if (!pkg.scripts[hook]?.includes(prepare)) {
    pkg.scripts[hook] = pkg.scripts[hook] ? `${prepare} && ${pkg.scripts[hook]}` : prepare;
  }
}
let sw = swOriginal;
if (!sw.includes('// Live CV requests bypass offline storage.')) {
  const anchor = "if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;";
  if (sw.split(anchor).length !== 2) throw new Error('Could not identify the service-worker fetch guard. No original files changed.');
  sw = sw.replace(anchor, `${anchor}\n  // Live CV requests bypass offline storage.\n  if (new URL(event.request.url).pathname === '/api/cv') {\n    event.respondWith(fetch(event.request));\n    return;\n  }`);
  // Purge only CV responses; keep saved resources and other offline pages intact.
  sw += `\nself.addEventListener('activate', event => {\n  event.waitUntil((async () => {\n    const cache = await caches.open(CACHE);\n    const requests = await cache.keys();\n    await Promise.all(requests.filter(request => new URL(request.url).pathname === '/api/cv').map(request => cache.delete(request)));\n  })());\n});\n`;
  const urlAnchor = "const urls = event.data.urls.filter(url => typeof url === 'string' && url.startsWith('/'));";
  const assetsAnchor = "await Promise.allSettled([...assets].map(url => cache.add(url)));";
  for (const expected of [urlAnchor, assetsAnchor]) {
    if (sw.split(expected).length !== 2) throw new Error('Could not identify the offline-save filter. No original files changed.');
  }
  sw = sw.replace(urlAnchor, "const urls = event.data.urls.filter(url => typeof url === 'string' && url.startsWith('/') && new URL(url, self.location.origin).pathname !== '/api/cv');");
  sw = sw.replace(assetsAnchor, "await Promise.allSettled([...assets].filter(url => new URL(url, self.location.origin).pathname !== '/api/cv').map(url => cache.add(url)));");
}
let client = clientOriginal;
if (!client.includes('// Recheck the CV when the corrected offline worker takes control.')) {
  const anchor = "retry.addEventListener('click', () => { void refresh(true); });";
  if (client.split(anchor).length !== 2) throw new Error('Could not identify the CV refresh insertion point. No original files changed.');
  client = client.replace(anchor, `${anchor}\n  // Recheck the CV when the corrected offline worker takes control.\n  if ('serviceWorker' in navigator) {\n    void navigator.serviceWorker.getRegistration('/').then(registration => registration?.update()).catch(() => undefined);\n    navigator.serviceWorker.addEventListener('controllerchange', () => {\n      if (started) void (async () => {\n        await inFlight;\n        await refresh(true);\n      })();\n    });\n  }`);
}

// Ensure rendering assets can be generated before saving any configuration changes.
await import('./prepare-live-cv.mjs');
for (const [file, text] of [
  [packagePath, JSON.stringify(pkg, null, 2) + '\n'], [swPath, sw], [clientPath, client],
]) {
  if (await readFile(file, 'utf8') !== text) await writeFile(file, text);
}
console.log('CV preview fixed: renderer assets are generated automatically; live CV requests use the network.');

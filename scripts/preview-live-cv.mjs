// npm run build first; then preview static pages AND the Vercel CV function locally.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveLiveCv } from '../server/live-cv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env['LIVE_CV_PREVIEW_PORT'] ?? 4322);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.pdf': 'application/pdf', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/cv') {
      const result = await serveLiveCv(new Request(url, { method: request.method, headers: request.headers }));
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    let filename = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    if (filename !== dist && !filename.startsWith(`${dist}${path.sep}`)) throw new Error('Invalid path.');
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    const bytes = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] ?? 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Live CV preview: http://127.0.0.1:${port}/about/#curriculum-vitae`);
});

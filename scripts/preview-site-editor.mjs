import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveEditor } from '../server/editor/handler.mjs';
import { serveLiveCv } from '../server/live-cv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.loadEnvFile(path.join(root, '.env.editor.local'));
process.env['CMS_ALLOW_LOCAL'] = '1';
const port = Number(process.env['EDITOR_PREVIEW_PORT'] ?? 4323);
const dist = path.join(root, 'dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (['/api/editor', '/api/cv'].includes(url.pathname)) {
      const chunks = []; let length = 0;
      for await (const chunk of request) { length += chunk.length; if (length > 350000) { response.writeHead(413); response.end(); return; } chunks.push(chunk); }
      const result = await (url.pathname === '/api/editor' ? serveEditor : serveLiveCv)(new Request(url, { method: request.method, headers: request.headers, ...(!['GET', 'HEAD'].includes(request.method) ? { body: Buffer.concat(chunks) } : {}) }));
      response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(Buffer.from(await result.arrayBuffer())); return;
    }
    let file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
    if (file !== dist && !file.startsWith(dist + path.sep)) throw new Error('Invalid path.');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' }); response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Editor preview: http://127.0.0.1:${port}/admin/`));

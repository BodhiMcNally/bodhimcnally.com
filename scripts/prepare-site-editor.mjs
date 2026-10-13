import { readFile, writeFile, access, cp, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['src/data/site-copy.json', 'src/data/research-content.json', 'api/editor.mjs']) await access(path.join(root, file));
JSON.parse(await readFile(path.join(root, 'src/data/site-copy.json'), 'utf8'));
let revision = process.env['VERCEL_GIT_COMMIT_SHA'] ?? '';
if (!revision) {
  try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
}
await writeFile(path.join(root, 'public/editor-build.json'), JSON.stringify({ revision, builtAt: new Date().toISOString() }) + '\n');
const require = createRequire(path.join(root, 'package.json'));
const katexRoot = path.dirname(require.resolve('katex/package.json'));
await mkdir(path.join(root, 'public/admin'), { recursive: true });
await cp(path.join(katexRoot, 'dist/katex.min.css'), path.join(root, 'public/admin/katex.min.css'));
await cp(path.join(katexRoot, 'dist/fonts'), path.join(root, 'public/admin/fonts'), { recursive: true });
console.log('Site editor content and deployment marker prepared.');

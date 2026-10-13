// Fast-forward a clean local checkout after edits published by the website.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');
const git = async (...args) => (await execute('git', args, { cwd: root, encoding: 'utf8', timeout: 45000 })).stdout.trim();
const log = message => console.log(`${new Date().toISOString()} ${message}`);
const common = path.resolve(root, await git('rev-parse', '--git-common-dir'));
const lock = path.join(common, 'site-editor-sync.json');
let stopping = false;
if (watch) {
  try {
    const existing = JSON.parse(await readFile(lock, 'utf8'));
    try { process.kill(existing.pid, 0); log('A site sync helper is already running.'); process.exit(0); } catch {}
    await unlink(lock);
  } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
  await mkdir(common, { recursive: true });
  await writeFile(lock, JSON.stringify({ pid: process.pid, root }) + '\n', { flag: 'wx' });
  const stop = () => { stopping = true; };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
async function sync() {
  const branch = await git('branch', '--show-current');
  if (branch !== 'main') { log(`Paused: you are working on ${branch || 'a detached revision'}.`); return; }
  if (await git('status', '--porcelain', '--untracked-files=no')) { log('Paused: save and commit your local tracked changes before automatic sync resumes.'); return; }
  await git('fetch', 'origin', 'main');
  const current = await git('rev-parse', 'HEAD'), remote = await git('rev-parse', 'origin/main');
  if (current === remote) return;
  try { await git('merge-base', '--is-ancestor', 'HEAD', 'origin/main'); }
  catch { log('Paused: local commits and the remote need to be reconciled. Pull/rebase in VS Code before continuing.'); return; }
  // Git also refuses a merge that would overwrite a colliding untracked file.
  await git('merge', '--ff-only', 'origin/main');
  log(`Updated your local website files to ${remote.slice(0, 12)}.`);
}
try {
  do {
    try { await sync(); } catch (error) { log(`Sync paused: ${error.message.split('\n')[0]}`); if (!watch) process.exitCode = 1; }
    if (watch && !stopping) await new Promise(resolve => setTimeout(resolve, 30000));
  } while (watch && !stopping);
} finally {
  if (watch) {
    try { const value = JSON.parse(await readFile(lock, 'utf8')); if (value.pid === process.pid) await unlink(lock); } catch {}
  }
}

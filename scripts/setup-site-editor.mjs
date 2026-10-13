// Creates a private local environment file. Never commit this file.
import readline from 'node:readline';
import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../server/editor/auth.mjs';
import { editorConfig } from '../config/editor.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.stdin.isTTY) throw new Error('Run this setup in your own interactive terminal.');
function hidden(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = '';
    const finish = () => { process.stdin.off('keypress', keypress); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    const keypress = (text, key) => {
      if (key?.ctrl && key.name === 'c') { finish(); reject(new Error('Setup cancelled.')); return; }
      if (key?.name === 'return' || key?.name === 'enter') { finish(); resolve(value); return; }
      if (key?.name === 'backspace') { value = value.slice(0, -1); return; }
      if (text && !key?.ctrl && !key?.meta && !/[\u0000-\u001f\u007f]/.test(text)) value += text;
    };
    process.stdin.on('keypress', keypress);
  });
}
console.log(`Configure the private editor login for ${editorConfig.username}. Input below is hidden.`);
const password = await hidden('Password: ');
const confirmation = await hidden('Confirm password: ');
if (!password || password !== confirmation) throw new Error('The passwords must match and cannot be empty.');
const token = await hidden('GitHub fine-grained token (Contents read/write for this repository): ');
if (!token.trim()) throw new Error('A repository token is required for publishing.');
const values = {
  CMS_USERNAME: editorConfig.username,
  CMS_PASSWORD_HASH: await hashPassword(password),
  CMS_SESSION_SECRET: randomBytes(48).toString('base64url'),
  CMS_GITHUB_TOKEN: token.trim(),
  CMS_REPOSITORY: editorConfig.repository,
  CMS_BRANCH: editorConfig.branch,
  CMS_ORIGIN: editorConfig.origin,
};
const file = path.join(root, '.env.editor.local');
await writeFile(file, Object.entries(values).map(([name, value]) => `${name}=${JSON.stringify(value)}`).join('\n') + '\n', { mode: 0o600 });
console.log('Private settings saved to .env.editor.local. Import its values into Vercel Environment Variables, then redeploy.');
console.log('The password itself is not saved. Keep this environment file out of Git.');

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { hashPassword, issueSession, readSession } from '../server/editor/auth.mjs';
import { serveEditor } from '../server/editor/handler.mjs';
import { editorConfig } from '../config/editor.mjs';
import { Repository, EditorError } from '../server/editor/repository.mjs';
import { validateCopy, validateDocument, linkedinEmbed } from '../server/editor/content.mjs';
import { renderEditorMarkdown } from '../server/editor/markdown.mjs';

const env = { CMS_USERNAME: 'BodhiMcNally', CMS_PASSWORD_HASH: await hashPassword('Test login only 42'), CMS_SESSION_SECRET: 'test-session-secret-which-is-more-than-thirty-two-characters', CMS_GITHUB_TOKEN: 'test-token' };
const origin = 'https://bodhimcnally.com';
const cookies = {};
const request = (action, payload, options = {}) => new Request(`${origin}/api/editor?action=${action}${options.query ?? ''}`, {
  method: payload ? 'POST' : 'GET',
  headers: { ...(payload ? { Origin: origin, 'Content-Type': 'application/json', 'X-Editor-CSRF': cookies.csrf ?? '' } : {}), ...(cookies.cookie ? { Cookie: cookies.cookie } : {}), ...(options.headers ?? {}) },
  ...(payload ? { body: JSON.stringify(payload) } : {}),
});
const digest = text => createHash('sha1').update(text).digest('hex');
export class MemoryRepository {
  constructor(files) { this.files = new Map(Object.entries(files)); this.name = editorConfig.repository; this.branch = 'main'; this.writes = []; }
  async read(file) { if (!this.files.has(file)) throw new EditorError(404, 'Not found'); const text = this.files.get(file); return { path: file, text, sha: digest(text) }; }
  async list(directory) { return [...this.files.keys()].filter(file => file.startsWith(directory + '/')).map(file => ({ path: file, name: file.split('/').pop(), sha: digest(this.files.get(file)), kind: directory.endsWith('updates') ? 'post' : 'resource' })); }
  async write(file, text, sha, message) {
    const current = this.files.get(file);
    if ((current === undefined ? null : digest(current)) !== (sha ?? null)) throw new EditorError(409, 'Newer content exists.');
    this.files.set(file, text); this.writes.push({ file, text, message });
    return { sha: digest(text), commit: digest(message + text), commitUrl: 'https://github.com/BodhiMcNally/bodhimcnally.com/commit/test', message: 'Saved to GitHub.' };
  }
}
const repository = new MemoryRepository({
  [editorConfig.copyPath]: JSON.stringify({ intro: { markdown: 'Original copy', element: 'p', source: 'src/pages/about.astro', label: 'Biography' }, heading: { markdown: 'About', element: 'h1', source: 'src/pages/about.astro', label: 'Heading' } }),
  [editorConfig.researchPath]: JSON.stringify({ publications: [], projects: [], presentations: [] }),
  'src/content/updates/existing-post.md': '---\ntitle: Existing post\nsummary: An update\nsource: site\nsortOrder: 10\ndraft: false\n---\n\nOriginal post\n',
});
const call = req => serveEditor(req, { env, repository });

test('private data and writes require a valid login', async () => {
  assert.equal((await call(request('bootstrap'))).status, 401);
  assert.equal((await call(request('save-copy', { id: 'intro', markdown: 'Attempt' }))).status, 401);
  assert.equal(repository.writes.length, 0);
  const bad = await call(request('login', { username: 'BodhiMcNally', password: 'wrong' })); assert.equal(bad.status, 401);
  const response = await call(request('login', { username: 'BodhiMcNally', password: 'Test login only 42' })); assert.equal(response.status, 200);
  const value = await response.json(); cookies.csrf = value.csrf; cookies.cookie = response.headers.get('set-cookie').split(';')[0];
  assert.match(response.headers.get('set-cookie'), /HttpOnly/); assert.match(response.headers.get('set-cookie'), /Secure/); assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
});

test('cross-origin, missing-CSRF and tampered sessions cannot publish', async () => {
  assert.equal((await call(request('save-copy', {}, { headers: { Origin: 'https://other.example' } }))).status, 403);
  assert.equal((await call(request('save-copy', {}, { headers: { 'X-Editor-CSRF': 'invalid' } }))).status, 403);
  const altered = cookies.cookie.slice(0, -1) + (cookies.cookie.endsWith('x') ? 'y' : 'x');
  assert.equal((await call(request('bootstrap', null, { headers: { Cookie: altered } }))).status, 401);
  assert.equal(repository.writes.length, 0);
});

test('editing a paragraph writes Markdown source and preserves other entries', async () => {
  const bootstrap = await (await call(request('bootstrap'))).json();
  const markdown = '**Clinical research**\n\n- Urology\n- Data science';
  const response = await call(request('save-copy', { id: 'intro', markdown, sha: bootstrap.copy.sha })); assert.equal(response.status, 200);
  const value = JSON.parse((await repository.read(editorConfig.copyPath)).text);
  assert.equal(value.intro.markdown, markdown); assert.equal(value.heading.markdown, 'About');
  assert.ok((await response.json()).commit);
});

test('a stale browser cannot overwrite a newer Git/VS Code edit', async () => {
  const file = await repository.read(editorConfig.copyPath);
  const data = JSON.parse(file.text); data.intro.markdown = 'A newer change from VS Code'; repository.files.set(file.path, JSON.stringify(data));
  const response = await call(request('save-copy', { id: 'intro', markdown: 'Old browser draft', sha: file.sha })); assert.equal(response.status, 409);
  assert.equal(JSON.parse((await repository.read(file.path)).text).intro.markdown, 'A newer change from VS Code');
});

test('headings keep inline semantics and source paths cannot be changed', async () => {
  const file = await repository.read(editorConfig.copyPath);
  assert.equal((await call(request('save-copy', { id: 'heading', markdown: 'Heading\n\n- Bullet', sha: file.sha }))).status, 400);
  assert.equal((await call(request('document', null, { query: '&path=../../package.json' }))).status, 400);
  assert.equal((await call(request('save-document', { path: 'api/editor.mjs', metadata: {}, body: 'code' }))).status, 400);
});

test('publications can be added with structured details and optional links can be cleared', async () => {
  const file = await repository.read(editorConfig.researchPath);
  const record = { id: 'test-paper', title: 'Test publication', authors: ['McNally B', 'Kam J'], journal: 'Test journal', year: 2026, citation: '**McNally B**, Kam J. Test publication.', publicationType: 'Journal article', doi: '10.1234/test', selected: true };
  let response = await call(request('save-research', { kind: 'publications', create: true, sha: file.sha, record })); assert.equal(response.status, 200);
  const saved = await response.json(); response = await call(request('save-research', { kind: 'publications', create: false, sha: saved.sha, record: { ...record, doi: '' } })); assert.equal(response.status, 200);
  const current = JSON.parse((await repository.read(file.path)).text); assert.equal(current.publications.length, 1); assert.equal(current.publications[0].doi, undefined);
});

test('new posts use the existing Markdown collection and preserve metadata', async () => {
  const metadata = { title: 'New post', summary: 'A summary', published: '2026-10-13', source: 'site', sortOrder: 1000, draft: false, customField: 'preserved' };
  const response = await call(request('save-document', { path: 'src/content/updates/new-post.md', metadata, body: '**Bold** and *italics*\n\n1. First\n2. Second', sha: null })); assert.equal(response.status, 200);
  const file = await repository.read('src/content/updates/new-post.md'); assert.match(file.text, /customField: preserved/); assert.match(file.text, /\*\*Bold\*\*/);
  assert.equal((await call(request('save-document', { path: file.path, metadata, body: 'Duplicate', sha: null }))).status, 409);
});

test('LinkedIn accepts official embeds without publishing arbitrary iframe code', () => {
  const valid = 'https://www.linkedin.com/embed/feed/update/urn:li:share:7419591884752240641';
  assert.equal(linkedinEmbed(`<iframe src="${valid}" onload="bad()"></iframe>`), valid);
  assert.throws(() => linkedinEmbed('https://evil.example/embed'), /official LinkedIn/);
  assert.throws(() => validateDocument('src/content/updates/unsafe.md', { title: 'Unsafe', summary: 'Summary', source: 'site' }, '<script>alert(1)</script>'), /Use Markdown/);
  assert.doesNotThrow(() => validateDocument('src/content/updates/code.md', { title: 'Code', summary: 'Summary', source: 'site' }, '```html\n<script>example</script>\n```'));
});

test('profile metadata stays plain text while page paragraphs support Markdown', async () => {
  assert.equal(await validateCopy({ element: 'plain' }, 'Bodhi McNally'), 'Bodhi McNally');
  await assert.rejects(validateCopy({ element: 'plain' }, '**Bodhi McNally**'), /plain text/);
  await assert.rejects(validateCopy({ element: 'plain' }, 'One\nTwo'), /single line/);
  assert.equal(await validateCopy({ element: 'p' }, '**Bold biography**'), '**Bold biography**');
});

test('offline storage cannot serve stale editor code or cache editor sessions', async () => {
  const events = new Map(), fetched = [];
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  runInNewContext(source, {
    URL, Promise,
    self: { location: { origin }, addEventListener(name, listener) { if (!events.has(name)) events.set(name, []); events.get(name).push(listener); } },
    fetch(request) { fetched.push(request.url); return Promise.resolve('network response'); },
    caches: { match() { throw new Error('Editor requests must not use offline storage.'); } },
  });
  for (const path of ['/api/editor?action=session', '/editor-build.json', '/admin/', '/admin/editor.js', '/admin/editor.css']) {
    let result;
    const event = { request: { url: origin + path, method: 'GET', mode: path === '/admin/' ? 'navigate' : 'cors' }, respondWith(value) { result = value; } };
    for (const listener of events.get('fetch')) listener(event);
    assert.equal(await result, 'network response');
  }
  assert.equal(fetched.length, 5);
});

test('Markdown preview supports formatting, lists, code, tables, footnotes and maths, and strips active HTML', async () => {
  const html = await renderEditorMarkdown('**Bold** *italic* ~~old~~\n\n- Point\n\n> Quote\n\n```r\nmean(x)\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\nFootnote[^1]\n\n[^1]: Detail\n\n$x^2$\n\n<script>bad()</script><img src=x onerror=bad()>');
  for (const tag of ['strong', 'em', 'del', 'ul', 'blockquote', 'pre', 'table', 'sup']) assert.ok(html.includes(`<${tag}`), tag);
  assert.match(html, /katex/); assert.doesNotMatch(html, /<script|onerror=/);
});

test('GitHub publishing uses the fixed repository, file SHA and authenticated server token', async () => {
  const calls = [];
  const old = 'old';
  const repo = new Repository(env, async (url, options) => {
    calls.push({ url, options });
    return options.method === 'GET' ? Response.json({ encoding: 'base64', content: Buffer.from(old).toString('base64'), sha: 'oldsha' }) : Response.json({ content: { sha: 'newsha' }, commit: { sha: 'commitsha', html_url: 'https://github.com/BodhiMcNally/bodhimcnally.com/commit/commitsha' } });
  });
  const result = await repo.write(editorConfig.copyPath, 'new', 'oldsha', 'Edit site'); assert.equal(result.commit, 'commitsha');
  assert.match(calls[1].url, /^https:\/\/api.github.com\/repos\/BodhiMcNally\/bodhimcnally.com\/contents\/src\/data\/site-copy.json$/);
  const body = JSON.parse(calls[1].options.body); assert.equal(body.sha, 'oldsha'); assert.equal(body.branch, 'main'); assert.equal(Buffer.from(body.content, 'base64').toString(), 'new');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
});

test('rotating the password hash invalidates earlier sessions and logout clears the cookie', async () => {
  const req = request('session'); const issued = issueSession(req, env);
  const authenticated = new Request(req.url, { headers: { Cookie: issued.cookie.split(';')[0] } });
  assert.ok(readSession(authenticated, env)); assert.equal(readSession(authenticated, { ...env, CMS_PASSWORD_HASH: await hashPassword('Different password') }), null);
  const response = await call(request('logout', {})); assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

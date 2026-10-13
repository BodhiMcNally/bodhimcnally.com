import { editorConfig } from '../../config/editor.mjs';
import { checkOrigin, checkLogin, issueSession, readSession, logoutCookie, validCsrf } from './auth.mjs';
import { Repository, EditorError, contentPathAllowed } from './repository.mjs';
import { parseDocument, validateCopy, validateDocument, validateResearch, string } from './content.mjs';
import { renderEditorMarkdown } from './markdown.mjs';

const headers = { 'Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status = 200, additional = {}) => Response.json(value, { status, headers: { ...headers, ...additional } });
async function body(request) {
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) throw new EditorError(415, 'Send a JSON request.');
  if (Number(request.headers.get('content-length') ?? 0) > 350000) throw new EditorError(413, 'This edit is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new EditorError(400, 'The request body is missing.');
  let bytes = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 350000) { await reader.cancel(); throw new EditorError(413, 'This edit is too large.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new EditorError(400, 'The request body is not valid JSON.'); }
}

export async function serveEditor(request, { env = process.env, fetcher = fetch, repository } = {}) {
  const action = new URL(request.url).searchParams.get('action') ?? 'session';
  try {
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
    if (request.method === 'POST' && !checkOrigin(request, env)) throw new EditorError(403, 'The request must come from your website.');
    if (action === 'login' && request.method === 'POST') {
      const value = await body(request);
      const username = string(value.username, 'Username', 100);
      if (typeof value.password !== 'string' || !value.password || value.password.length > 1024) throw new EditorError(400, 'Enter a valid password.');
      const password = value.password;
      const result = await checkLogin(request, env, username, password);
      if (result.status !== 200) return json({ error: result.message }, result.status);
      const session = issueSession(request, env);
      return json({ authenticated: true, username: session.claims.user, csrf: session.claims.csrf }, 200, { 'Set-Cookie': session.cookie });
    }
    const session = readSession(request, env);
    if (action === 'session' && request.method === 'GET') return json({ authenticated: Boolean(session), ...(session ? { username: session.user, csrf: session.csrf } : {}) });
    if (!session) throw new EditorError(401, 'Please log in to edit your website.');
    if (request.method === 'POST' && !validCsrf(request, session)) throw new EditorError(403, 'Your editor session needs to be reloaded before publishing.');
    if (action === 'logout' && request.method === 'POST') return json({ authenticated: false }, 200, { 'Set-Cookie': logoutCookie(request, env) });
    if (action === 'preview' && request.method === 'POST') {
      const value = await body(request);
      return json({ html: await renderEditorMarkdown(string(value.markdown, 'Markdown', 250000, true)) });
    }
    const repo = repository ?? new Repository(env, fetcher);
    if (action === 'bootstrap' && request.method === 'GET') {
      const [copy, research, posts, resources] = await Promise.all([
        repo.read(editorConfig.copyPath), repo.read(editorConfig.researchPath),
        repo.list('src/content/updates'), repo.list('src/content/resources'),
      ]);
      return json({ username: session.user, csrf: session.csrf, copy: { sha: copy.sha, entries: JSON.parse(copy.text) }, research: { sha: research.sha, entries: JSON.parse(research.text) }, documents: [...posts, ...resources], repository: repo.name, branch: repo.branch });
    }
    if (action === 'document' && request.method === 'GET') {
      const file = new URL(request.url).searchParams.get('path') ?? '';
      if (!contentPathAllowed(file) || !file.startsWith('src/content/')) throw new EditorError(400, 'Choose a Markdown document.');
      const result = await repo.read(file);
      return json({ path: file, sha: result.sha, ...parseDocument(result.text) });
    }
    if (action === 'save-copy' && request.method === 'POST') {
      const value = await body(request);
      const file = await repo.read(editorConfig.copyPath);
      const entries = JSON.parse(file.text);
      const entry = entries[value.id];
      if (!Object.hasOwn(entries, value.id) || !entry) throw new EditorError(400, 'That text block was not found.');
      const markdown = await validateCopy(entry, value.markdown);
      const updated = { ...entries, [value.id]: { ...entry, markdown } };
      const result = await repo.write(editorConfig.copyPath, JSON.stringify(updated, null, 2) + '\n', value.sha, `Edit website text: ${entry.label.slice(0, 70)}`);
      return json({ ...result, entry: updated[value.id] });
    }
    if (action === 'save-research' && request.method === 'POST') {
      const value = await body(request);
      const record = validateResearch(value.kind, value.record);
      const file = await repo.read(editorConfig.researchPath);
      const data = JSON.parse(file.text);
      const records = data[value.kind];
      const index = records.findIndex(item => item.id === record.id);
      if (value.create && index >= 0) throw new EditorError(409, 'That record ID already exists. Choose a different ID.');
      if (!value.create && index < 0) throw new EditorError(404, 'That research record no longer exists.');
      if (index >= 0) {
        records[index] = { ...records[index], ...record };
        const optional = value.kind === 'publications' ? ['doi', 'pubmedUrl'] : value.kind === 'projects' ? ['institution', 'role', 'startYear', 'endYear'] : ['location', 'citation', 'link'];
        for (const key of optional) if (!Object.hasOwn(record, key)) delete records[index][key];
      }
      else records.push(record);
      const result = await repo.write(editorConfig.researchPath, JSON.stringify(data, null, 2) + '\n', value.sha, `${value.create ? 'Add' : 'Edit'} ${value.kind}: ${record.title.slice(0, 90)}`);
      return json({ ...result, record });
    }
    if (action === 'save-document' && request.method === 'POST') {
      const value = await body(request);
      const file = string(value.path, 'Document path', 200);
      if (!contentPathAllowed(file) || !file.startsWith('src/content/')) throw new EditorError(400, 'Choose a valid Markdown document path.');
      const text = validateDocument(file, value.metadata, value.body);
      const result = await repo.write(file, text, value.sha ?? null, `${value.sha ? 'Edit' : 'Add'} ${file.includes('/updates/') ? 'post' : 'resource'}: ${value.metadata.title.slice(0, 90)}`);
      return json({ ...result, path: file, ...parseDocument(text) });
    }
    throw new EditorError(404, 'That editor action was not found.');
  } catch (error) {
    return json({ error: error instanceof EditorError ? error.message : 'The editor could not complete this request. Your unsaved text is still available.' }, error instanceof EditorError ? error.status : 500);
  }
}

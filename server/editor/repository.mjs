import { editorConfig } from '../../config/editor.mjs';

export class EditorError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function contentPathAllowed(file) {
  return [editorConfig.copyPath, editorConfig.researchPath].includes(file)
    || /^src\/content\/(?:updates|resources)\/[a-z0-9][a-z0-9-]{0,100}\.md$/.test(file);
}

export class Repository {
  constructor(env, fetcher = fetch) {
    this.token = env['CMS_GITHUB_TOKEN'];
    this.name = env['CMS_REPOSITORY'] ?? editorConfig.repository;
    this.branch = env['CMS_BRANCH'] ?? editorConfig.branch;
    this.fetcher = fetcher;
    if (!this.token) throw new EditorError(503, 'Add CMS_GITHUB_TOKEN to the private Vercel environment settings to enable publishing.');
    if (!/^[\w.-]+\/[\w.-]+$/.test(this.name) || !/^[\w./-]+$/.test(this.branch)) throw new EditorError(503, 'The repository or branch setting is invalid.');
  }
  async request(route, method = 'GET', payload) {
    const result = await this.fetcher(`https://api.github.com/repos/${this.name}/${route}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    if (result.status === 404) throw new EditorError(404, 'That content file was not found.');
    if (result.status === 409 || result.status === 422) throw new EditorError(409, 'The repository changed or the branch rejected this update. Reload the latest content before publishing again.');
    if (result.status === 401 || result.status === 403) throw new EditorError(503, 'GitHub rejected access. Check the token expiry, repository selection and Contents read/write permission.');
    if (!result.ok) throw new EditorError(502, `GitHub could not complete this request (HTTP ${result.status}).`);
    return result.json();
  }
  async read(file) {
    if (!contentPathAllowed(file)) throw new EditorError(400, 'This file is outside the editable content folders.');
    const data = await this.request(`contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(this.branch)}`);
    if (Array.isArray(data) || data.encoding !== 'base64') throw new EditorError(400, 'Expected a text content file.');
    return { path: file, sha: data.sha, text: Buffer.from(data.content, 'base64').toString('utf8') };
  }
  async list(directory) {
    if (!['src/content/updates', 'src/content/resources'].includes(directory)) throw new EditorError(400, 'This folder is not editable.');
    const entries = await this.request(`contents/${directory}?ref=${encodeURIComponent(this.branch)}`);
    return entries.filter(entry => entry.type === 'file' && contentPathAllowed(entry.path)).map(entry => ({ path: entry.path, sha: entry.sha, name: entry.name, kind: directory.endsWith('/updates') ? 'post' : 'resource' }));
  }
  async write(file, text, expectedSha, message) {
    let previous = null;
    try { previous = await this.read(file); } catch (error) { if (error.status !== 404) throw error; }
    if ((previous?.sha ?? null) !== (expectedSha ?? null)) throw new EditorError(409, 'This content has changed since you opened it. Your draft is still in the editor. Reload the latest version before publishing.');
    if (previous?.text === text) return { unchanged: true, sha: previous.sha, message: 'No content changes to publish.' };
    const result = await this.request(`contents/${file.split('/').map(encodeURIComponent).join('/')}`, 'PUT', {
      message, branch: this.branch, content: Buffer.from(text).toString('base64'), ...(previous ? { sha: previous.sha } : {}),
    });
    return { sha: result.content.sha, commit: result.commit.sha, commitUrl: result.commit.html_url, message: 'Saved to GitHub. The website deployment will follow.' };
  }
}

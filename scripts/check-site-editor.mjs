// Read-only checks after the editor has been deployed.
import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] ?? 'https://bodhimcnally.com').origin;
async function get(path) {
  const response = await fetch(new URL(path, origin), { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${path} returned HTTP ${response.status}. Check that all update files were committed and the deployment succeeded.`);
  return response;
}
try {
  const admin = await (await get('/admin/')).text();
  assert.match(admin, /data-editor-login/, 'The editor login is missing.');
  assert.match(admin, /name="robots"[^>]*content="noindex, nofollow"/, 'The editor should not be indexed.');
  const home = await (await get('/')).text();
  const footer = home.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] ?? '';
  assert.ok(footer, 'The public footer was not found.');
  assert.doesNotMatch(footer, /data-open-provenance/, 'The Site details footer button remains.');
  for (const file of ['/admin/editor.js', '/admin/editor.css', '/admin/katex.min.css']) await get(file);
  const response = await get('/api/editor?action=session');
  assert.match(response.headers.get('content-type') ?? '', /application\/json/, 'The editor function is not serving JSON.');
  assert.match(response.headers.get('cache-control') ?? '', /no-store/, 'Private requests must not be cached.');
  const session = await response.json();
  assert.equal(session.authenticated, false, 'An anonymous request should not be logged in.');
  const marker = await (await get(`/editor-build.json?check=${Date.now()}`)).json();
  assert.match(marker.revision, /^[a-f0-9]{40}$/, 'The build is missing its Git revision. In Vercel, enable system environment variables.');
  console.log('Editor login, runtime assets, anonymous session, deployment marker and footer checks passed.');
  console.log('Log in at ' + origin + '/admin/ to check your private settings and publish a small edit.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

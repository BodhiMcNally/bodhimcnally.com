(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const elements = {
    login: $('[data-editor-login]'), account: $('[data-editor-account]'), user: $('[data-editor-user]'),
    workspace: $('[data-editor-workspace]'), notice: $('[data-editor-notice]'), deployment: $('[data-editor-deployment]'),
    list: $('[data-editor-items]'), search: $('[data-editor-search]'), source: $('[data-editor-source]'), filter: $('[data-editor-copy-filter]'),
    add: $('[data-editor-new]'), title: $('[data-editor-current-title]'), detail: $('[data-editor-current-detail]'), form: $('[data-editor-form]'),
    markdown: $('[data-editor-markdown]'), toolbar: $('.editor-toolbar'), body: $('[data-editor-body]'), rendered: $('[data-editor-rendered]'), publish: $('[data-editor-publish]'),
    live: $('[data-editor-live-preview]'), page: $('[data-editor-page]'), frame: $('[data-editor-page-frame]'),
  };
  const state = { csrf: '', data: null, tab: 'copy', active: null, dirty: false, busy: false, metadata: {}, latestCommit: '', poll: null };
  const sourceLabels = file => file.replace(/^src\/(?:pages|components|data)\//, '').replace(/\.astro$/, '').replace(/^index$/, 'Home').replace(/\/index$/, '').replace(/^mapgl\/tutorial\.html$/, 'Mapgl tutorial');
  const human = value => value.replace(/([A-Z])/g, ' $1').replaceAll('-', ' ').replace(/^\w/, letter => letter.toUpperCase());
  const slug = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  const notice = (text, error = false) => { elements.notice.textContent = text; elements.notice.dataset.error = String(error); };

  async function api(action, payload, query = '') {
    const response = await fetch(`/api/editor?action=${encodeURIComponent(action)}${query}`, {
      cache: 'no-store', credentials: 'same-origin',
      ...(payload ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Editor-CSRF': state.csrf }, body: JSON.stringify(payload) } : {}),
    });
    const value = await response.json();
    if (!response.ok) {
      if (response.status === 401 && action !== 'login') { elements.login.hidden = false; notice('Your session expired. Log in again; your unsaved text is still here.', true); }
      throw new Error(value.error || `Request failed (${response.status}).`);
    }
    return value;
  }
  function setBusy(busy) {
    state.busy = busy; elements.publish.disabled = busy || !state.active; elements.publish.textContent = busy ? 'Publishing…' : 'Publish changes';
    elements.form.querySelectorAll('input,textarea,select').forEach(input => { input.disabled = busy; });
    elements.body.disabled = busy;
    document.querySelectorAll('[data-markdown]').forEach(button => { button.disabled = busy; });
  }
  function markDirty() { state.dirty = true; }
  function canChange() { return !state.busy && (!state.dirty || window.confirm('Leave this unsaved edit?')); }

  async function bootstrap(preserve = false) {
    const data = await api('bootstrap');
    state.data = data; state.csrf = data.csrf;
    elements.login.hidden = true; elements.workspace.hidden = false; elements.account.hidden = false; elements.live.hidden = false;
    elements.user.textContent = data.username;
    const sources = [...new Set(Object.values(data.copy.entries).map(entry => entry.source))].sort();
    const chosen = elements.source.value;
    elements.source.replaceChildren(new Option('All text', ''), ...sources.map(file => new Option(sourceLabels(file), file)));
    if (sources.includes(chosen)) elements.source.value = chosen;
    renderList();
    if (!elements.frame.src) loadPage();
    if (!preserve) notice('Select text from the list or click an outlined block in the page preview.');
  }
  function items() {
    if (!state.data) return [];
    if (state.tab === 'copy') return Object.entries(state.data.copy.entries).map(([id, entry]) => ({ id, title: entry.label, detail: sourceLabels(entry.source), source: entry.source, entry }));
    if (['publications', 'projects'].includes(state.tab)) return state.data.research.entries[state.tab].map(entry => ({ id: entry.id, title: entry.title, detail: state.tab === 'publications' ? `${entry.year} · ${entry.journal}` : entry.status, entry }));
    return state.data.documents.filter(entry => entry.kind === (state.tab === 'posts' ? 'post' : 'resource')).map(entry => ({ id: entry.path, title: human(entry.name.replace(/\.md$/, '')), detail: entry.kind === 'post' ? 'Post or LinkedIn update' : 'Markdown resource', entry }));
  }
  function renderList() {
    const query = elements.search.value.trim().toLowerCase();
    const values = items().filter(item => (!query || `${item.title} ${item.detail} ${item.entry.markdown ?? ''}`.toLowerCase().includes(query)) && (state.tab !== 'copy' || !elements.source.value || item.source === elements.source.value));
    elements.list.replaceChildren();
    for (const item of values) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'editor-item'; button.setAttribute('aria-current', String(state.active?.id === item.id));
      const name = document.createElement('span'); name.textContent = item.title;
      const detail = document.createElement('small'); detail.textContent = item.detail;
      button.append(name, detail); button.addEventListener('click', () => { if (canChange()) void openItem(item); }); elements.list.append(button);
    }
    if (!values.length) { const empty = document.createElement('p'); empty.className = 'editor-empty'; empty.textContent = 'No matching content.'; elements.list.append(empty); }
    elements.filter.hidden = state.tab !== 'copy'; elements.add.hidden = state.tab === 'copy';
    elements.add.textContent = state.tab === 'publications' ? 'Add publication' : state.tab === 'projects' ? 'Add research project' : state.tab === 'posts' ? 'Add post / LinkedIn update' : 'Add resource';
  }

  function field(name, label, value, options = {}) {
    const wrapper = document.createElement('label'); wrapper.className = 'editor-field';
    const title = document.createElement('span'); title.textContent = label;
    let input;
    if (options.choices) { input = document.createElement('select'); options.choices.forEach(choice => input.add(new Option(choice, choice))); }
    else if (options.multiline || options.array) input = document.createElement('textarea');
    else { input = document.createElement('input'); input.type = options.type ?? 'text'; }
    input.name = name;
    if (options.type === 'checkbox') { wrapper.classList.add('editor-field--checkbox'); input.checked = Boolean(value); }
    else input.value = options.array ? (value ?? []).join('\n') : String(value ?? '');
    if (options.readonly) input.readOnly = true;
    input.dataset.kind = options.array ? 'array' : options.type ?? 'text';
    input.addEventListener('input', markDirty); wrapper.append(title, input);
    if (options.help) { const help = document.createElement('small'); help.className = 'editor-field__help'; help.textContent = options.help; wrapper.append(help); }
    elements.form.append(wrapper); return input;
  }
  function showMarkdown(text, plain = false) { elements.markdown.hidden = false; elements.toolbar.hidden = plain; elements.body.dataset.plain = String(plain); elements.body.value = text ?? ''; void renderMarkdown(); }
  function blankForm() { elements.form.replaceChildren(); elements.markdown.hidden = true; elements.body.value = ''; elements.rendered.srcdoc = ''; }
  async function openItem(item) {
    blankForm(); state.dirty = false;
    state.active = { id: item.id, create: false, kind: state.tab, sha: state.tab === 'copy' ? state.data.copy.sha : state.data.research.sha };
    elements.title.textContent = item.title; elements.detail.textContent = item.detail;
    setBusy(false);
    if (state.tab === 'copy') { showMarkdown(item.entry.markdown, item.entry.element === 'plain'); elements.detail.textContent += item.entry.element === 'plain' ? ' · This profile field uses plain text.' : /^h[1-6]$/.test(item.entry.element) ? ' · This heading accepts inline formatting.' : ''; }
    else if (['publications', 'projects'].includes(state.tab)) researchForm(item.entry, false);
    else {
      setBusy(true);
      try {
        const content = await api('document', null, `&path=${encodeURIComponent(item.id)}`);
        state.active.sha = content.sha; state.metadata = content.metadata; documentForm(content.metadata, content.body, item.id, false);
      } catch (error) { state.active = null; notice(error.message, true); }
      finally { setBusy(false); }
    }
    renderList();
  }
  function researchForm(value, create) {
    field('id', 'Record ID', value.id, { readonly: !create, help: 'Letters, numbers and hyphens. This stays stable after publication.' });
    const title = field('title', 'Title', value.title);
    if (create) title.addEventListener('input', () => { if (!elements.form.querySelector('[name=id]').dataset.manual) elements.form.querySelector('[name=id]').value = slug(title.value); });
    elements.form.querySelector('[name=id]').addEventListener('input', event => { event.target.dataset.manual = 'true'; });
    field('selected', 'Selected / featured', value.selected ?? false, { type: 'checkbox' });
    if (state.tab === 'publications') {
      field('publicationType', 'Publication type', value.publicationType ?? 'Journal article', { choices: ['Journal article', 'Review article', 'Conference abstract', 'Other'] });
      field('authors', 'Authors — one per line', value.authors ?? [], { array: true });
      field('journal', 'Journal or proceedings', value.journal);
      field('year', 'Year', value.year ?? new Date().getFullYear(), { type: 'number' });
      field('doi', 'DOI', value.doi, { help: 'Paste the DOI or its doi.org link.' });
      field('pubmedUrl', 'PubMed link', value.pubmedUrl, { type: 'url' });
      elements.detail.textContent = 'The text below is the citation. Markdown formatting is supported.';
      showMarkdown(value.citation ?? '');
    } else {
      field('status', 'Status', value.status ?? 'Active', { choices: ['Active', 'Completed', 'Planned', 'Paused'] });
      field('researchArea', 'Research area', value.researchArea);
      field('role', 'Your role', value.role); field('institution', 'Institution / group', value.institution);
      field('collaborators', 'Collaborators — one per line', value.collaborators ?? [], { array: true });
      field('startYear', 'Start year', value.startYear, { type: 'number' }); field('endYear', 'End year (optional)', value.endYear, { type: 'number' });
      field('outputs', 'Outputs — one per line', value.outputs ?? [], { array: true });
      elements.detail.textContent = 'The text below is the project description. Markdown formatting is supported.';
      showMarkdown(value.shortDescription ?? '');
    }
  }
  function documentForm(metadata, body, path, create) {
    state.metadata = structuredClone(metadata);
    field('slug', 'URL slug', path.split('/').pop().replace(/\.md$/, ''), { readonly: !create });
    const title = field('title', 'Title', metadata.title);
    if (create) title.addEventListener('input', () => { const input = elements.form.querySelector('[name=slug]'); if (!input.dataset.manual) input.value = slug(title.value); });
    elements.form.querySelector('[name=slug]').addEventListener('input', event => { event.target.dataset.manual = 'true'; });
    field('published', 'Publication date', metadata.published ?? '', { type: 'date' }); field('draft', 'Save as draft (not displayed on the website)', metadata.draft ?? false, { type: 'checkbox' });
    if (state.tab === 'posts') {
      field('summary', 'Short summary', metadata.summary, { multiline: true });
      const source = field('source', 'Post type', metadata.source ?? 'site', { choices: ['site', 'linkedin'] });
      const original = field('linkedinUrl', 'LinkedIn post link', metadata.linkedinUrl, { type: 'url' });
      const embed = field('linkedinEmbedUrl', 'LinkedIn embed URL or iframe code', metadata.linkedinEmbedUrl, { multiline: true, help: 'For an embedded post, paste LinkedIn’s “Embed this post” code here. A normal post link is also kept.' });
      const showLinkedIn = () => { original.closest('label').hidden = embed.closest('label').hidden = source.value !== 'linkedin'; }; source.addEventListener('change', showLinkedIn); showLinkedIn();
      field('collapsed', 'Show a short summary with “Read the full post”', metadata.collapsed ?? false, { type: 'checkbox' });
      field('sortOrder', 'Display order (higher appears first)', metadata.sortOrder ?? Math.floor(Date.now() / 1000), { type: 'number' });
    } else {
      field('description', 'Description', metadata.description, { multiline: true });
      field('category', 'Category', metadata.category ?? 'Statistics', { choices: ['Statistics', 'R', 'Data Science', 'Visualisation', 'Reproducible Research', 'Statistical Thinking', 'Academic Skills'] });
      field('level', 'Level', metadata.level ?? 'Introductory', { choices: ['Introductory', 'Intermediate', 'Advanced'] });
      field('estimatedMinutes', 'Reading time in minutes', metadata.estimatedMinutes ?? 10, { type: 'number' });
      field('tags', 'Tags — one per line', metadata.tags ?? [], { array: true }); field('software', 'Software — one per line', metadata.software ?? [], { array: true });
      field('updated', 'Updated date (optional)', metadata.updated ?? '', { type: 'date' });
      field('featured', 'Featured resource', metadata.featured ?? false, { type: 'checkbox' });
      const details = document.createElement('details'); details.className = 'editor-advanced';
      const summary = document.createElement('summary'); summary.textContent = 'Additional resource settings';
      const textarea = document.createElement('textarea'); textarea.name = 'advanced';
      const displayed = ['title', 'published', 'draft', 'description', 'category', 'level', 'estimatedMinutes', 'tags', 'software', 'updated', 'featured'];
      textarea.value = JSON.stringify(Object.fromEntries(Object.entries(metadata).filter(([key]) => !displayed.includes(key))), null, 2);
      textarea.addEventListener('input', markDirty); details.append(summary, textarea); elements.form.append(details);
    }
    showMarkdown(body);
    if (path.endsWith('interactive-maps-in-r-with-mapgl.md')) elements.detail.textContent = 'This edits the resource details. Edit the full embedded tutorial through Page text → Mapgl tutorial, or its highlighted text blocks.';
  }
  function values() {
    const value = {};
    for (const input of elements.form.querySelectorAll('[name]')) {
      if (input.name === 'advanced') continue;
      value[input.name] = input.type === 'checkbox' ? input.checked : input.dataset.kind === 'array' ? input.value.split('\n').map(line => line.trim()).filter(Boolean) : input.type === 'number' ? (input.value ? Number(input.value) : undefined) : input.value;
    }
    return value;
  }
  function addNew() {
    if (!canChange()) return;
    blankForm(); state.dirty = false; state.active = { id: '', create: true, kind: state.tab, sha: ['publications', 'projects'].includes(state.tab) ? state.data.research.sha : null }; setBusy(false);
    elements.title.textContent = state.tab === 'publications' ? 'New publication' : state.tab === 'projects' ? 'New research project' : state.tab === 'posts' ? 'New post' : 'New resource';
    elements.detail.textContent = 'Complete the fields, preview your Markdown, then publish.';
    if (['publications', 'projects'].includes(state.tab)) researchForm({}, true);
    else {
      const metadata = { published: new Date().toISOString().slice(0, 10), draft: false, sortOrder: Math.floor(Date.now() / 1000) };
      documentForm(metadata, '', `src/content/${state.tab === 'posts' ? 'updates' : 'resources'}/new-entry.md`, true);
      elements.form.querySelector('[name=slug]').value = '';
    }
  }
  async function publish() {
    if (!state.active || state.busy) return;
    setBusy(true);
    try {
      let result;
      if (state.tab === 'copy') {
        result = await api('save-copy', { id: state.active.id, markdown: elements.body.value, sha: state.active.sha });
        state.active.sha = state.data.copy.sha = result.sha; state.data.copy.entries[state.active.id] = result.entry;
      } else if (['publications', 'projects'].includes(state.tab)) {
        const record = values(); record[state.tab === 'publications' ? 'citation' : 'shortDescription'] = elements.body.value;
        result = await api('save-research', { kind: state.tab, record, create: state.active.create, sha: state.active.sha });
        state.active.sha = state.data.research.sha = result.sha;
        const list = state.data.research.entries[state.tab], index = list.findIndex(entry => entry.id === record.id);
        if (index >= 0) list[index] = result.record; else list.push(result.record);
        state.active.id = record.id; state.active.create = false;
      } else {
        const input = values(); let metadata = { ...state.metadata, ...input }; delete metadata.slug;
        const advanced = elements.form.querySelector('[name=advanced]');
        if (advanced) { metadata = { ...JSON.parse(advanced.value), ...input }; delete metadata.slug; }
        if (!metadata.published) delete metadata.published; if (!metadata.updated) delete metadata.updated;
        const path = state.active.create ? `src/content/${state.tab === 'posts' ? 'updates' : 'resources'}/${input.slug}.md` : state.active.id;
        result = await api('save-document', { path, metadata, body: elements.body.value, sha: state.active.sha ?? null });
        state.active.id = path; state.active.sha = result.sha; state.active.create = false; state.metadata = result.metadata;
        if (!state.data.documents.some(entry => entry.path === path)) state.data.documents.push({ path, sha: result.sha, name: path.split('/').pop(), kind: state.tab === 'posts' ? 'post' : 'resource' });
      }
      state.dirty = false; notice(result.message); renderList();
      if (result.commit) trackDeployment(result);
    } catch (error) { notice(error.message, true); }
    finally { setBusy(false); }
  }
  function trackDeployment(result) {
    state.latestCommit = result.commit; window.clearInterval(state.poll);
    elements.deployment.hidden = false; elements.deployment.replaceChildren();
    const text = document.createElement('span'); text.textContent = 'Saved to GitHub. Waiting for the website deployment… ';
    elements.deployment.append(text);
    if (result.commitUrl) { const link = document.createElement('a'); link.href = result.commitUrl; link.textContent = 'View saved change'; link.target = '_blank'; link.rel = 'noreferrer'; elements.deployment.append(link); }
    const check = async () => {
      try {
        const response = await fetch(`/editor-build.json?check=${Date.now()}`, { cache: 'no-store' });
        const live = await response.json();
        if (live.revision === state.latestCommit) { text.textContent = 'Your changes are live. '; window.clearInterval(state.poll); loadPage(); }
      } catch {}
    };
    state.poll = window.setInterval(check, 8000); void check();
  }
  async function renderMarkdown() {
    try {
      const { html } = await api('preview', { markdown: elements.body.value });
      elements.rendered.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/admin/katex.min.css"><style>body{font:16px/1.7 system-ui,sans-serif;color:#2b2423;padding:20px;margin:0}p:first-child{margin-top:0}a{color:#831b37}img{max-width:100%}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}pre{background:#f5f2ef;padding:12px;overflow:auto}blockquote{border-left:3px solid #831b37;padding-left:16px}h1,h2,h3{line-height:1.25}.katex-mathml{position:absolute;clip:rect(1px,1px,1px,1px);padding:0;border:0;height:1px;width:1px;overflow:hidden}</style></head><body>${html}</body></html>`;
    } catch (error) { notice(error.message, true); }
  }
  function formatting(command) {
    if (state.busy || elements.body.dataset.plain === 'true') return;
    const area = elements.body, start = area.selectionStart, end = area.selectionEnd;
    const selected = area.value.slice(start, end), selectedOr = text => selected || text;
    const insert = {
      bold: `**${selectedOr('bold text')}**`, italic: `*${selectedOr('italic text')}*`, strike: `~~${selectedOr('text')}~~`,
      heading: `\n\n## ${selectedOr('Heading')}\n`, bullets: '\n\n' + selectedOr('First point\nSecond point').split('\n').map(line => '- ' + line).join('\n') + '\n',
      numbers: '\n\n' + selectedOr('First point\nSecond point').split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n') + '\n',
      quote: '\n\n' + selectedOr('Quoted text').split('\n').map(line => '> ' + line).join('\n') + '\n',
      link: `[${selectedOr('Link text')}](https://example.com)`, image: `![${selectedOr('Image description')}](https://example.com/image.jpg)`,
      code: '`' + selectedOr('code') + '`', fence: '\n\n```r\n' + selectedOr('# Your code here') + '\n```\n',
      table: '\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n', rule: '\n\n---\n\n',
      footnote: `${selectedOr('Statement')}[^1]\n\n[^1]: Footnote text.`, math: `$${selectedOr('x^2')}$`,
    }[command];
    if (insert === undefined) return;
    area.setRangeText(insert, start, end, 'select'); area.focus(); markDirty();
  }
  function loadPage() { elements.frame.src = `${elements.page.value}${elements.page.value.includes('?') ? '&' : '?'}edit=1&preview=${Date.now()}`; }

  elements.login.addEventListener('submit', async event => {
    event.preventDefault(); const button = elements.login.querySelector('button'); button.disabled = true;
    try { const result = await api('login', { username: elements.login.elements.username.value, password: elements.login.elements.password.value }); elements.login.elements.password.value = ''; state.csrf = result.csrf; await bootstrap(Boolean(state.active)); }
    catch (error) { notice(error.message, true); } finally { button.disabled = false; }
  });
  $('[data-editor-logout]').addEventListener('click', async () => {
    if (!canChange()) return;
    try { await api('logout', {}); window.clearInterval(state.poll); elements.deployment.hidden = true; state.data = null; state.csrf = ''; state.active = null; state.dirty = false; elements.workspace.hidden = true; elements.account.hidden = true; elements.live.hidden = true; elements.frame.src = 'about:blank'; elements.login.hidden = false; notice('Logged out.'); }
    catch (error) { notice(error.message, true); }
  });
  document.querySelectorAll('[data-editor-tab]').forEach(button => button.addEventListener('click', () => {
    if (!canChange()) return;
    state.tab = button.dataset.editorTab; state.active = null; state.dirty = false; blankForm(); elements.publish.disabled = true; elements.search.value = '';
    document.querySelectorAll('[data-editor-tab]').forEach(tab => tab.classList.toggle('is-active', tab === button)); renderList();
  }));
  elements.search.addEventListener('input', renderList); elements.source.addEventListener('change', renderList); elements.add.addEventListener('click', addNew);
  elements.publish.addEventListener('click', publish); elements.body.addEventListener('input', markDirty);
  $('[data-editor-render]').addEventListener('click', renderMarkdown);
  document.querySelectorAll('[data-markdown]').forEach(button => button.addEventListener('click', () => formatting(button.dataset.markdown)));
  elements.body.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && ['b', 'i'].includes(event.key.toLowerCase())) { event.preventDefault(); formatting(event.key.toLowerCase() === 'b' ? 'bold' : 'italic'); } });
  elements.page.addEventListener('change', loadPage); $('[data-editor-refresh-page]').addEventListener('click', loadPage);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== elements.frame.contentWindow || event.data?.type !== 'SITE_EDITOR_COPY' || !state.data?.copy.entries[event.data.id]) return;
    if (!canChange()) return;
    state.tab = 'copy'; elements.source.value = ''; elements.search.value = ''; document.querySelectorAll('[data-editor-tab]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.editorTab === 'copy'));
    const entry = state.data.copy.entries[event.data.id]; void openItem({ id: event.data.id, title: entry.label, detail: sourceLabels(entry.source), entry }); elements.title.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  window.addEventListener('beforeunload', event => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } });
  void api('session').then(session => { if (session.authenticated) { state.csrf = session.csrf; return bootstrap(); } }).catch(error => notice(error.message, true));
})();

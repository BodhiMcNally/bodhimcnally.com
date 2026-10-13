import yaml from 'js-yaml';
import { parseFragment } from 'parse5';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { EditorError } from './repository.mjs';
import { renderEditorMarkdown, inlineParagraph } from './markdown.mjs';

export const publicationTypes = ['Journal article', 'Review article', 'Conference abstract', 'Other'];
export const presentationTypes = ['Oral presentation', 'Poster presentation', 'Conference abstract', 'Invited talk'];
export const projectStatuses = ['Active', 'Completed', 'Planned', 'Paused'];
const resourceCategories = ['Statistics', 'R', 'Data Science', 'Visualisation', 'Reproducible Research', 'Statistical Thinking', 'Academic Skills'];
export function string(value, name, max = 10000, optional = false) {
  if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) throw new EditorError(400, `${name} is required and must be valid text.`);
  return value.trim();
}
function number(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new EditorError(400, `${name} must be a whole number between ${min} and ${max}.`);
  return value;
}
function choice(value, choices, name) {
  if (!choices.includes(value)) throw new EditorError(400, `Choose a valid ${name}.`);
  return value;
}
function strings(value, name, required = false) {
  if (!Array.isArray(value) || value.length > 150 || (required && !value.length)) throw new EditorError(400, `${name} must be a list.`);
  return value.map(item => string(item, name, 1000));
}
function url(value, name, hosts) {
  if (!value) return undefined;
  let parsed;
  try { parsed = new URL(string(value, name, 2000)); } catch { throw new EditorError(400, `${name} must be a valid public web URL.`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || (hosts && !hosts.includes(parsed.hostname))) throw new EditorError(400, `${name} must be a valid public web URL.`);
  return parsed.href;
}
function boolean(value) { if (typeof value !== 'boolean') throw new EditorError(400, 'Expected a checkbox value.'); return value; }

export async function validateCopy(entry, markdown) {
  string(markdown, 'Text', 60000, true);
  if (!/^h[1-6]$/.test(entry.element)) {
    const tree = unified().use(remarkParse).parse(markdown);
    const inspect = node => { if (node.type === 'heading' && node.depth === 1) throw new EditorError(400, 'The page already has a title. Use headings starting at level 2 in paragraph content.'); node.children?.forEach(inspect); };
    inspect(tree);
  }
  if (entry.element === 'plain') {
    if (/[\n\r]/.test(markdown)) throw new EditorError(400, 'This profile field accepts a single line.');
    const parsed = unified().use(remarkParse).parse(markdown);
    if (parsed.children.some(node => node.type !== 'paragraph' || node.children.some(child => child.type !== 'text'))) throw new EditorError(400, 'This profile field accepts plain text. Use a paragraph block for Markdown formatting.');
  }
  if (/^h[1-6]$/.test(entry.element) || ['label', 'summary', 'dt'].includes(entry.element)) {
    const html = await renderEditorMarkdown(markdown);
    if (markdown.trim() && inlineParagraph(html) === null) throw new EditorError(400, 'This heading or label accepts inline formatting. Use a paragraph block for lists, tables or multiple paragraphs.');
  }
  return markdown;
}
export function validateResearch(kind, value) {
  if (!['publications', 'projects', 'presentations'].includes(kind) || !value || typeof value !== 'object' || Array.isArray(value)) throw new EditorError(400, 'Choose a valid research record.');
  const id = string(value.id, 'ID', 100);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new EditorError(400, 'Use letters, numbers and hyphens for the record ID.');
  const basic = { id, title: string(value.title, 'Title', 2000), selected: boolean(value.selected ?? false) };
  if (kind === 'publications') {
    const doi = (value.doi ?? '').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').trim();
    if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi)) throw new EditorError(400, 'Enter a valid DOI or leave it blank.');
    return { ...basic, authors: strings(value.authors, 'Authors', true), journal: string(value.journal, 'Journal or proceedings', 1000), year: number(value.year, 'Year', 1800, 2300), citation: string(value.citation, 'Citation', 10000), publicationType: choice(value.publicationType, publicationTypes, 'publication type'), ...(doi ? { doi } : {}), ...(value.pubmedUrl ? { pubmedUrl: url(value.pubmedUrl, 'PubMed URL', ['pubmed.ncbi.nlm.nih.gov']) } : {}) };
  }
  if (kind === 'projects') return { ...basic, status: choice(value.status, projectStatuses, 'project status'), researchArea: string(value.researchArea, 'Research area', 2000), shortDescription: string(value.shortDescription, 'Description', 30000), collaborators: strings(value.collaborators ?? [], 'Collaborators'), outputs: strings(value.outputs ?? [], 'Outputs'), ...(value.institution ? { institution: string(value.institution, 'Institution', 2000) } : {}), ...(value.role ? { role: string(value.role, 'Role', 2000) } : {}), ...(value.startYear ? { startYear: number(value.startYear, 'Start year', 1800, 2300) } : {}), ...(value.endYear ? { endYear: number(value.endYear, 'End year', 1800, 2300) } : {}) };
  return { ...basic, conference: string(value.conference, 'Conference', 2000), date: date(value.date, 'Presentation date'), presentationType: choice(value.presentationType, presentationTypes, 'presentation type'), ...(value.location ? { location: string(value.location, 'Location', 2000) } : {}), ...(value.citation ? { citation: string(value.citation, 'Citation', 10000) } : {}), ...(value.link ? { link: url(value.link, 'Presentation URL') } : {}) };
}
function date(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new EditorError(400, `${label} must use a valid YYYY-MM-DD date.`);
  return value;
}

export function parseDocument(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new EditorError(400, 'This Markdown file needs a frontmatter header.');
  const metadata = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new EditorError(400, 'The content header must contain fields.');
  return { metadata, body: match[2].replace(/^\n/, '') };
}
export function linkedinEmbed(value, sourceUrl) {
  if (!value) {
    const activity = sourceUrl?.match(/(?:activity-|urn:li:activity:)(\d{10,})/);
    return activity ? `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activity[1]}` : undefined;
  }
  let supplied = value.trim();
  if (supplied.startsWith('<')) {
    const tree = parseFragment(supplied);
    const iframe = tree.childNodes.find(node => node.tagName === 'iframe');
    supplied = iframe?.attrs.find(attr => attr.name === 'src')?.value ?? '';
  }
  let parsed;
  try { parsed = new URL(supplied); } catch { throw new EditorError(400, 'Paste the LinkedIn embed URL or its iframe code.'); }
  if (parsed.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(parsed.hostname) || !/^\/embed\/feed\/update\/urn:li:(?:activity|share|ugcPost):\d+$/.test(parsed.pathname) || parsed.username || parsed.password) throw new EditorError(400, 'Use an official LinkedIn post embed URL.');
  return parsed.href;
}
export function validateDocument(path, metadata, body) {
  string(body, 'Markdown body', 250000, true);
  const tree = unified().use(remarkParse).parse(body);
  function inspect(node) {
    if (node.type === 'heading' && node.depth === 1) throw new EditorError(400, 'Use the title field for the page title. Headings inside the Markdown body start at level 2.');
    if (node.type === 'html') {
      const fragment = parseFragment(node.value);
      function check(element) {
        if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'base', 'button', 'input', 'textarea', 'select'].includes(element.tagName)) throw new EditorError(400, 'Use Markdown for the body. Put a LinkedIn embed in the dedicated embed field.');
        for (const attribute of element.attrs ?? []) {
          if (attribute.name.startsWith('on') || attribute.name === 'style' || (['href', 'src'].includes(attribute.name) && /^(?:javascript|vbscript|data):/i.test(attribute.value.replace(/[\u0000-\u0020]/g, '')))) throw new EditorError(400, 'Active HTML is not supported in Markdown content.');
        }
        element.childNodes?.forEach(check);
      }
      fragment.childNodes.forEach(check);
    }
    node.children?.forEach(inspect);
  }
  inspect(tree);
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new EditorError(400, 'Content details must be an object.');
  const data = { ...metadata, title: string(metadata.title, 'Title', 2000), draft: boolean(metadata.draft ?? false) };
  if (metadata.published) data.published = date(metadata.published, 'Publication date');
  if (path.startsWith('src/content/updates/')) {
    data.summary = string(metadata.summary, 'Summary', 5000);
    data.source = choice(metadata.source ?? 'site', ['site', 'linkedin'], 'post source');
    data.collapsed = boolean(metadata.collapsed ?? false);
    data.sortOrder = number(metadata.sortOrder ?? 0, 'Sort order', -2147483648, 2147483647);
    if (data.source === 'linkedin') {
      data.linkedinUrl = url(string(metadata.linkedinUrl, 'LinkedIn URL', 2000), 'LinkedIn URL', ['www.linkedin.com', 'linkedin.com', 'lnkd.in']);
      data.linkedinEmbedUrl = linkedinEmbed(metadata.linkedinEmbedUrl, data.linkedinUrl);
    } else { delete data.linkedinUrl; delete data.linkedinEmbedUrl; }
  } else {
    data.description = string(metadata.description, 'Description', 5000);
    data.category = choice(metadata.category, resourceCategories, 'resource category');
    data.level = choice(metadata.level, ['Introductory', 'Intermediate', 'Advanced'], 'level');
    data.estimatedMinutes = number(metadata.estimatedMinutes, 'Reading time', 1, 1440);
    data.tags = strings(metadata.tags ?? [], 'Tags'); data.software = strings(metadata.software ?? [], 'Software');
    if (!data.published) throw new EditorError(400, 'A resource needs a publication date.');
    if (metadata.updated) data.updated = date(metadata.updated, 'Updated date');
    for (const key of ['featured', 'template', 'browserR']) if (key in metadata) data[key] = boolean(metadata[key]);
  }
  const header = yaml.dump(data, { lineWidth: -1, noRefs: true });
  return `---\n${header}---\n\n${body.trim()}\n`;
}

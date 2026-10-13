import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { parseFragment, serialize } from 'parse5';

let processor;
const allowed = new Set('p a h1 h2 h3 h4 h5 h6 strong b em i del s ul ol li blockquote pre code img hr br table thead tbody tr th td div span details summary sup sub input math semantics mrow annotation mi mo mn mtext msup msub msubsup mfrac msqrt mroot mtable mtr mtd mspace mover munder munderover mfenced'.split(' '));
const remove = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'button', 'textarea', 'select', 'link', 'meta']);
const attributes = new Set('class id title href src alt width height colspan rowspan align start type checked disabled role aria-label aria-hidden aria-describedby tabindex rel target encoding display mathvariant stretchy fence separator accent accentunder linethickness columnalign rowalign columnspacing rowspacing style'.split(' '));

function safeUrl(value, image = false) {
  try {
    const parsed = new URL(value.replace(/[\u0000-\u0020]/g, ''), 'https://bodhimcnally.com');
    return (image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']).includes(parsed.protocol);
  } catch { return false; }
}

export function sanitiseHtml(html) {
  const tree = parseFragment(html);
  function clean(node) {
    const result = [];
    for (const child of node.childNodes ?? []) {
      if (child.nodeName === '#comment') continue;
      if (remove.has(child.tagName)) continue;
      clean(child);
      if (child.tagName && !allowed.has(child.tagName)) { result.push(...(child.childNodes ?? [])); continue; }
      if (child.attrs) child.attrs = child.attrs.filter(({ name, value }) => {
        if (!attributes.has(name) || name.startsWith('on')) return false;
        if (name === 'href' || name === 'src') return safeUrl(value, name === 'src');
        if (name === 'style') return !/url\s*\(|expression\s*\(|@import|[{}<>]|behavior\s*:|javascript|vbscript/i.test(value);
        if (name === 'type') return child.tagName === 'input' && value === 'checkbox';
        return true;
      });
      if (child.tagName === 'input' && !child.attrs?.some(attr => attr.name === 'type' && attr.value === 'checkbox')) continue;
      if (child.tagName === 'input' && !child.attrs.some(attr => attr.name === 'disabled')) child.attrs.push({ name: 'disabled', value: '' });
      result.push(child);
    }
    node.childNodes = result;
  }
  clean(tree);
  return serialize(tree);
}

export async function renderEditorMarkdown(markdown) {
  processor ??= createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { strict: false }]] });
  const result = await (await processor).render(markdown);
  return sanitiseHtml(result.code);
}

export function inlineParagraph(html) {
  const tree = parseFragment(html);
  const meaningful = tree.childNodes.filter(node => node.nodeName !== '#text' || node.value.trim());
  return meaningful.length === 1 && meaningful[0].tagName === 'p' ? serialize(meaningful[0]) : null;
}

export async function markdownText(markdown) {
  const tree = parseFragment(await renderEditorMarkdown(markdown));
  const parts = [];
  function visit(node) {
    if (node.nodeName === '#text') parts.push(node.value);
    node.childNodes?.forEach(visit);
  }
  visit(tree);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export async function applyHtmlCopies(html, copies) {
  const tree = parseFragment(html, { sourceCodeLocationInfo: true });
  const changes = [];
  async function visit(node) {
    const key = node.attrs?.find(attr => attr.name === 'data-edit-copy')?.value;
    const entry = key && copies[key];
    const location = node.sourceCodeLocation;
    if (entry && location?.startTag && location?.endTag) {
      const rendered = await renderEditorMarkdown(entry.markdown);
      const inline = inlineParagraph(rendered);
      if (/^h[1-6]$/.test(node.tagName) || node.tagName === 'li') {
        changes.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, value: inline ?? rendered });
      } else if (node.tagName === 'p' && inline !== null) {
        changes.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, value: inline });
      } else {
        const open = html.slice(location.startOffset, location.startTag.endOffset).replace(/^<p\b/, '<div');
        const close = node.tagName === 'p' ? '</div>' : html.slice(location.endTag.startOffset, location.endOffset);
        changes.push({ start: location.startOffset, end: location.endOffset, value: open + rendered + close });
      }
      return;
    }
    for (const child of node.childNodes ?? []) await visit(child);
  }
  await visit(tree);
  changes.sort((a, b) => b.start - a.start).forEach(change => { html = html.slice(0, change.start) + change.value + html.slice(change.end); });
  return html;
}

export async function editableHeadings(headings, copies) {
  return Promise.all(headings.map(async heading => {
    const entry = Object.values(copies).find(copy => copy.headingId === heading.slug);
    return entry ? { ...heading, text: await markdownText(entry.markdown) } : heading;
  }));
}

// Convert an executed, self-contained Quarto document into native Astro content.
// parse5 is already present in the website's locked Astro dependencies.
import { parse, parseFragment, serializeOuter } from 'parse5';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
function setAttr(node, name, value) {
  node.attrs ||= [];
  const existing = node.attrs.find(item => item.name === name);
  if (existing) existing.value = value;
  else node.attrs.push({ name, value });
}
function remove(node) {
  const siblings = node.parentNode?.childNodes;
  if (siblings) siblings.splice(siblings.indexOf(node), 1);
}
function all(node) { return [node, ...(node.childNodes || []).flatMap(all)]; }

export async function embedMapgl(html, root) {
  const document = parse(html);
  const nodes = all(document);
  const head = nodes.find(node => node.tagName === 'head');
  const main = nodes.find(node => node.tagName === 'main');
  if (!head || !main) throw new Error('Expected an executed Quarto HTML document.');
  const firstDependency = head.childNodes.findIndex(node => node.tagName === 'script' && text(node).includes('If window.HTMLWidgets is already defined'));
  if (firstDependency < 0) throw new Error('Missing embedded htmlwidgets runtime. Use embed-resources: true.');
  const dependencies = head.childNodes.slice(firstDependency);
  const scripts = dependencies.filter(node => node.tagName === 'script' && attr(node, 'type') !== 'application/json');
  if (scripts.some(node => attr(node, 'src'))) throw new Error('Expected embedded widget scripts.');
  const styles = dependencies.filter(node => node.tagName === 'style' && !text(node).includes('--lesson-ink:'));
  const assetRoot = path.join(root, 'public/resources/mapgl');
  const fragmentRoot = path.join(root, 'src/data/mapgl');
  await mkdir(path.join(assetRoot, 'runtime'), { recursive: true });
  await mkdir(fragmentRoot, { recursive: true });
  await writeFile(path.join(assetRoot, 'runtime/mapgl.js'), '// @ts-nocheck\n// R htmlwidget dependencies; upstream licence notices are retained.\n' + scripts.map(text).join('\n;\n'));
  await writeFile(path.join(assetRoot, 'runtime/mapgl.css'), styles.map(text).join('\n'));

  // Website title, navigation, copy buttons, and downloads use the native layout.
  for (const node of all(main)) {
    if (attr(node, 'id') === 'title-block-header' || hasClass(node, 'lesson-downloads') || hasClass(node, 'code-copy-button') || hasClass(node, 'callout-icon-container')) remove(node);
    if (node.tagName === 'p' && text(node).startsWith('The Project 2 starter')) remove(node);
    if (node.nodeName === '#text') node.value = node.value.replaceAll('project2-starter.qmd', 'index.qmd').replace('For example, the starter report uses this pattern:', 'For example, a report can use this pattern:');
  }
  const headings = [];
  for (const node of all(main)) {
    if (/^h[2-4]$/.test(node.tagName || '')) {
      const slug = attr(node, 'id') || attr(node.parentNode, 'id');
      if (!slug) throw new Error('A tutorial heading is missing its anchor.');
      setAttr(node, 'id', slug);
      if (attr(node.parentNode, 'id') === slug) node.parentNode.attrs = node.parentNode.attrs.filter(item => item.name !== 'id');
      headings.push({ depth: Number(node.tagName[1]), slug, text: text(node).trim() });
    }
    if (node.tagName === 'a') {
      const href = attr(node, 'href');
      if (href && !/^(?:#|https?:|mailto:|data:|\/)/.test(href)) setAttr(node, 'href', new URL(href, 'https://bodhimcnally.com/resources/mapgl/').pathname);
    }
  }

  await rm(path.join(assetRoot, 'widgets'), { recursive: true, force: true });
  await mkdir(path.join(assetRoot, 'widgets'), { recursive: true });
  const widgets = all(main).filter(node => hasClass(node, 'html-widget'));
  const manifest = [];
  for (const widget of widgets) {
    const id = attr(widget, 'id');
    const payload = all(main).find(node => node.tagName === 'script' && attr(node, 'data-for') === id && attr(node, 'type') === 'application/json');
    if (!id || !payload) throw new Error('A displayed map is missing its R-generated payload.');
    const json = text(payload);
    JSON.parse(json); // Fail publication rather than shipping invalid widget data.
    const url = `/resources/mapgl/widgets/${id}.json`;
    await writeFile(path.join(assetRoot, 'widgets', `${id}.json`), json);
    setAttr(payload, 'data-mapgl-src', url);
    payload.childNodes = [];
    const binding = hasClass(widget, 'maplibregl_compare') ? 'maplibregl_compare' : 'maplibregl';
    // htmlwidgets discovers widgets by the binding class, even without html-widget.
    // Keep both classes off the placeholder until its own JSON has arrived.
    setAttr(widget, 'class', (attr(widget, 'class') || '').split(/\s+/).filter(item => item !== 'html-widget' && item !== binding).concat('mapgl-widget-pending').join(' '));
    setAttr(widget, 'data-mapgl-binding', binding);
    setAttr(widget, 'data-mapgl-widget', '');
    setAttr(widget, 'role', 'region');
    setAttr(widget, 'aria-label', 'Interactive Sydney map');
    // A visible, keyboard-operable fallback also works when IntersectionObserver is unavailable.
    const status = parseFragment(`<div class="mapgl-widget-status" data-mapgl-status="${id}"><span role="status">Interactive map loads as you scroll.</span> <button type="button" class="button button--quiet" data-load-map="${id}">Load map</button></div>`).childNodes[0];
    const siblings = widget.parentNode.childNodes;
    siblings.splice(siblings.indexOf(widget), 0, status);
    status.parentNode = widget.parentNode;
    manifest.push({ id, url });
  }
  if (widgets.length === 0) throw new Error('The tutorial contains no executed maps.');
  await writeFile(path.join(fragmentRoot, 'tutorial.html'), main.childNodes.map(serializeOuter).join(''));
  await writeFile(path.join(fragmentRoot, 'headings.json'), JSON.stringify(headings, null, 2) + '\n');
  await writeFile(path.join(fragmentRoot, 'maps.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { maps: widgets.length, headings: headings.filter(item => item.depth === 2).length };
}

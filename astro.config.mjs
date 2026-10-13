import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

export default defineConfig({
  site: 'https://bodhimcnally.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [sitemap({ filter: page => !new URL(page).pathname.startsWith('/admin/') }) /* SITE_EDITOR_ADMIN_SITEMAP */],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
    }),
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
  compressHTML: true,
});

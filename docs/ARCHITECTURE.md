# Architecture summary

## Framework and rendering

- Astro 7.3 with strict TypeScript and fully static output.
- No React, Vue or Svelte islands.
- Astro's image pipeline produces responsive AVIF, WebP and JPEG versions of the portrait.
- The site has no database, analytics, contact form or required secrets.

## Design system

- `src/styles/global.scss` loads separate SCSS files for tokens, base rules, layout, components, long-form teaching content and print output.
- Source Serif 4 and Inter are bundled locally.
- Warm paper, oxblood and mineral blue provide a restrained editorial palette. Colour marks page boundaries and the student-resource prompt; it does not decorate headings or create branded slogans.
- Content is arranged with rules, spacing and readable prose rather than numbered cards.
- Motion is limited to a short page entry and interaction feedback, with a complete reduced-motion override.

## Profile and document data

`src/data/site.ts` is the source of truth for:

- current role and institutional details;
- the homepage introduction and research summary;
- the Google Drive CV and local document paths;
- both public email addresses;
- LinkedIn, University, GitHub and ORCID links; and
- the chronological “I’ll be here…” conference list.

The current PDFs live in `public/cv/` and `public/teaching/`.

## Research outputs

`src/data/research.ts` retains typed arrays for publications, presentations and projects. The present Research page displays only publications, as requested. Its search and filters work against the statically rendered publication list and require no service or database.

## Teaching resources

- Resource files live in `src/content/resources/` as Markdown or MDX.
- `src/content.config.ts` validates taxonomy, dates, level, software, reading time, assets and draft state.
- `src/pages/resources/[id].astro` builds one static page per published resource.
- KaTeX renders equations and Shiki highlights code.
- Copy controls are added to code blocks in the browser.
- R blocks receive an additional **Run R** control. The official webR 0.6.0 runtime is loaded from `webr.r-wasm.org` only after a reader asks to run code; R then executes locally in that browser. The fixed version keeps the teaching notes reproducible and avoids silent runtime changes.
- Resource search and filtering appear automatically once the library contains at least four published resources.

## SEO and deployment

- `BaseLayout.astro` provides canonical URLs, page descriptions and Open Graph fields.
- The homepage adds Person and WebSite JSON-LD; resource pages add LearningResource JSON-LD.
- `@astrojs/sitemap`, `robots.txt` and directory-style routes support indexing.
- `vercel.json` adds portable security headers without creating a Vercel runtime dependency.

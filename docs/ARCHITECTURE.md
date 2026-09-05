# Architecture summary

## Framework and rendering

- Astro 7.3, configured for fully static output.
- Strictest Astro/TypeScript configuration.
- No React, Vue or Svelte islands.
- Vanilla JavaScript is limited to resource filtering, printing and copy-code controls.
- Astro’s image pipeline generates responsive AVIF, WebP and JPEG headshot variants.

## Design system

- `src/styles/global.scss` loads focused SCSS partials for tokens, base rules, layout, components, long-form content and print output.
- CSS custom properties hold the palette, typography scale, spacing and layout measurements.
- Source Serif 4 and Inter are installed as local package assets, so the site does not depend on a third-party font request at runtime.
- Motion is a single quiet page-entry transition and small interaction feedback. All motion is neutralised under `prefers-reduced-motion: reduce`.

## Profile data

`src/data/site.ts` is the source of truth for the name, current role, institution, canonical domain, brief homepage introduction, CV state, professional email and profile links. Nullable values remain hidden until verified.

## Teaching resources

- Resource files live in `src/content/resources/` as Markdown or MDX.
- `src/content.config.ts` validates the taxonomy, dates, level, software, reading time, assets, draft state and optional repository link.
- A dynamic static route at `src/pages/resources/[id].astro` creates one page per published resource.
- The index filter works entirely in the browser against already-rendered HTML and remains usable when JavaScript is unavailable.
- Remark/rehype processing adds KaTeX equations; Astro/Shiki supplies syntax highlighting.

## Research outputs

Projects, publications and presentations use explicit TypeScript types and arrays in `src/data/research.ts`. Empty arrays render no invented entries. Adding the first verified record automatically exposes the relevant section on the Research page.

## Leadership data

Selected roles live in `src/data/leadership.json` and are loaded through an Astro content collection with a validation schema. The page markup does not duplicate role data.

## SEO and deployment

- `BaseLayout.astro` provides canonical URLs, page-specific metadata and Open Graph fields.
- The homepage adds Person and WebSite JSON-LD; resource pages add LearningResource JSON-LD.
- `@astrojs/sitemap`, `robots.txt` and stable directory-style routes support indexing.
- The project is portable static output. `vercel.json` adds production security headers without introducing a Vercel runtime dependency; the `www` redirect is configured with the production domains in Vercel.

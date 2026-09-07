# bodhimcnally.com

Source code for my personal academic website, [bodhimcnally.com](https://bodhimcnally.com).

The site is built with Astro, TypeScript and SCSS and deployed as a static site through Vercel.

## Running the site locally

Install [Node.js](https://nodejs.org/) 22 or later, open this folder in VS Code and run:

```bash
npm install
npm run dev
```

Astro will print a local address, usually `http://localhost:4321`.

Before pushing a change, run:

```bash
npm run verify
```

This builds the site and checks its internal links and basic metadata.

## Editing the main details

Most information that changes over time is kept in `src/data/site.ts`, including:

- my current role and institution;
- the homepage introduction;
- email addresses and profile links;
- CV and teaching portfolio links; and
- the conference list on the About page.

Longer text is kept on the page where it appears:

- `src/pages/about.astro`
- `src/pages/research.astro`
- `src/pages/teaching.astro`

The headshot is `src/assets/images/Bodhi_McNally_Portrait.jpg`. Replacing that file without changing its name is enough; Astro creates the web-sized versions automatically.

## CV and teaching portfolio

The downloadable CV is:

```text
public/cv/Bodhi_McNally_Master_CV.pdf
```

The About page displays WebP page images from `public/cv/pages/`, avoiding browser-specific PDF embedding. Replace the master PDF using the same filename, then run either `npm run dev` or `npm run build`. The site will detect that the PDF contents changed, regenerate every page image and update the page list automatically. Old page images are removed if the replacement CV is shorter.

The conversion is handled by `scripts/render-cv-pages.mjs`. Its generated manifest, `src/data/cv-pages.json`, and the WebP files should be committed with the replacement PDF. If the PDF has not changed, the conversion step is skipped.

The Google Drive URL and the displayed update date also live in `src/data/site.ts`. When replacing the CV, update `cv.updated` and check that the Drive file is still shared for public viewing.

The teaching portfolio is:

```text
public/teaching/Bodhi_McNally_Teaching_Portfolio.pdf
```

## Homepage posts

Posts shown on the homepage live in `src/content/updates/`. `sortOrder` controls their position: higher numbers appear first. Add `published` only when the exact date is known. Ordinary website posts use Markdown:

```md
---
title: Post title
summary: One-sentence description.
published: 2026-09-06
sortOrder: 400
source: site
draft: false
---

Write the post here.
```

LinkedIn supports embedding individual public posts rather than an unrestricted profile feed. In LinkedIn, open the public post, choose **Embed this post**, and copy the `src` URL from the supplied iframe code. Then add an entry using:

```md
---
title: Post title
summary: One-sentence description.
published: 2026-09-06
sortOrder: 300
source: linkedin
linkedinUrl: https://www.linkedin.com/feed/update/...
linkedinEmbedUrl: https://www.linkedin.com/embed/feed/update/...
draft: false
---
```

The embed fields are optional. If LinkedIn does not provide an embed URL, omit `linkedinEmbedUrl`; the post will be rendered from the Markdown file and retain its link to LinkedIn. Add `collapsed: true` to a long entry to show a short introduction with an expandable full post.

## Publications

Publication records live in `src/data/research.ts`.

```ts
{
  id: 'short-stable-slug',
  title: 'Exact publication title',
  authors: ['Author One', 'Bodhi McNally'],
  journal: 'Journal name',
  year: 2027,
  doi: '10.xxxx/example',
  pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/00000000/',
  citation: 'Preferred full citation.',
  publicationType: 'Journal article',
  selected: true,
}
```

Remove the DOI or PubMed fields if they do not exist. Presentations and projects can be stored in the typed arrays in the same file if they are needed later.

## Teaching resources

Resources are Markdown or MDX files in `src/content/resources/`. The confidence-interval note is a working example of the format.

To add another resource:

1. Copy an existing file and give it a short lowercase filename.
2. Replace its frontmatter and body.
3. Keep `draft: true` while working on it.
4. Change this to `draft: false` when it is ready to publish.

The available metadata fields and categories are defined in `src/content.config.ts`. Equations use standard `$...$` or `$$...$$` notation. Fenced code blocks receive syntax highlighting and a copy button.

R code blocks also receive a **Run R** button. The site loads webR 0.6.0 from its official distribution only when that button is used, and the calculation runs in the reader's browser.

The exact Ubuntu font files used by the plotting environment are stored in `public/fonts/`. Keep their filenames unchanged: the resource runner copies them into webR and registers them with its plotting worker when a code block uses Ubuntu.

Files offered for download from a resource belong under `public/resources/` and can be linked through the resource's `downloadableAssets` frontmatter.

## Site search and navigation

The search palette is available from the header, by pressing `/`, or with `Ctrl+K` on Windows and `Command+K` on macOS. Its index is assembled automatically from the navigation, the full text and metadata of published teaching resources, and any future records in `src/data/research.ts`. Headings from the page currently open are added in the browser.

The palette also contains page actions for copying a link, sharing and printing. Teaching resources include a generated citation action. The palette, heading links, page actions and return-to-top control are implemented in `src/components/CommandPalette.astro`; their styles are in `src/styles/_command-palette.scss`. Recently viewed pages are kept only in the visitor's browser.

The table of contents on a teaching resource follows the reader's position and marks the section currently being read. That behaviour lives in `src/components/TableOfContents.astro`.

## Updating the live site

The Vercel project is connected to the GitHub repository. Once a change is ready:

```bash
git status
git add -A
git commit -m "Describe the change"
git push
```

Vercel should build and deploy the new commit automatically. Its build command is `npm run build` and its output directory is `dist`.

If applying a downloaded full-site revision over an older local copy, keep the existing `.git` folder. Copy the new files over the old ones, then check `git status` carefully for files that the revision intentionally removed.

## Useful files

- `src/data/site.ts` — personal details and external links
- `src/data/research.ts` — publications, presentations and projects
- `src/content/resources/` — teaching resources
- `src/styles/` — typography, colour and layout

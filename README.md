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

The About page also uses the Google Drive URL in `src/data/site.ts`. When replacing the CV, update both the PDF and the `cv.updated` value. Check that the Drive file is still shared for public viewing.

The teaching portfolio is:

```text
public/teaching/Bodhi_McNally_Teaching_Portfolio.pdf
```

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

Files offered for download from a resource belong under `public/resources/` and can be linked through the resource's `downloadableAssets` frontmatter.

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

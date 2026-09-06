# bodhimcnally.com

The source for [bodhimcnally.com](https://bodhimcnally.com), Bodhi McNally's personal academic website.

The site is built with Astro 7, strict TypeScript and SCSS. It is deliberately static, has no database, analytics, tracking, contact form or required environment secrets, and can be hosted on Vercel, Netlify, Cloudflare Pages or any ordinary static host.

## Run locally

You need Node.js 22 or later. If you use `nvm`, run `nvm use` from this folder.

```bash
npm install
npm run dev
```

Astro will print the local address, normally `http://localhost:4321`.

## Apply this revision to an existing repository

This download is a complete clean source tree. If an earlier version of the site is already connected to GitHub and Vercel:

1. Keep the existing repository folder and its hidden `.git` directory.
2. Copy the contents of this download's `bodhimcnally.com` folder into that repository, allowing matching files to be replaced.
3. Delete the following three files from the existing repository if they remain. They are intentionally absent from this revision, but extracting an archive over an old folder may not remove them:

   ```text
   src/pages/leadership.astro
   src/data/leadership.json
   src/content/resources/how-to-interpret-a-regression-coefficient.md
   ```

4. Run `npm install`, then `npm run verify`.
5. Review `git status`, commit the changes and push `main`. The connected Vercel project should deploy the push automatically.

## Build and verify

```bash
npm run build
```

The production site is written to `dist/`.

For a production build followed by internal-link, metadata and baseline accessibility audits:

```bash
npm run verify
```

To inspect the built site locally:

```bash
npm run preview
```

## Where things live

```text
src/
├── assets/images/                 Headshot source image
├── components/                    Shared page components
├── content/resources/             Teaching resources in Markdown or MDX
├── content.config.ts              Teaching-resource schema
├── data/site.ts                   Bio, current details, links and navigation
├── data/research.ts               Projects, publications and presentations
├── layouts/BaseLayout.astro       Metadata, header and footer shell
├── pages/                          Routes
└── styles/                         SCSS design system
public/
├── cv/                             Downloadable CV PDF
├── favicon.svg                     BM favicon
├── robots.txt                      Search-engine instructions
├── resources/                      Downloadable teaching attachments
├── teaching/                       Teaching portfolio PDF
└── site.webmanifest                Basic site manifest
```

The generated `dist/`, `.astro/` and `node_modules/` folders are ignored by Git.

The reasoning behind the site's current information architecture and colour direction is recorded in `docs/DESIGN_RESEARCH.md`.

## Update the bio, titles or current roles

Edit:

```text
src/data/site.ts
```

This is the central profile file. It contains the site name, current role, institution, clinical school, homepage introduction, research summary, contact details, document links, conference appearances and external profiles. Update current information there before editing individual pages.

Longer narrative copy is intentionally page-specific:

- `src/pages/about.astro`
- `src/pages/research.astro`
- `src/pages/teaching.astro`

Search those pages for any time-sensitive wording when your role or training stage changes.

## Update profile links and contact details

Edit `src/data/site.ts`.

- Update either address in `emails`.
- Update a verified profile in `profiles`.
- Add a verified Google Scholar URL to `optionalProfiles.googleScholar` when one exists.

Keep the Google Scholar field as `null` until the exact profile is public.

## Update the conference list

Edit the `appearances` array in `src/data/site.ts`. Each entry requires only a year, event name and location. Keep the entries in chronological order.

## Replace the headshot

Replace this file while keeping the filename unchanged:

```text
src/assets/images/Bodhi_McNally_Portrait.jpg
```

Use a high-quality square or near-square JPEG. Astro automatically creates responsive AVIF, WebP and JPEG versions during the build. The current image is not stylised; CSS only controls its crop and presentation.

If you change the filename, update the import in `src/components/Portrait.astro`.

## Update the CV

The About page provides both the current Google Drive link and a downloadable copy.

1. Replace `public/cv/Bodhi_McNally_Master_CV.pdf` with the new PDF, keeping the filename unchanged.
2. Replace `cv.driveHref` in `src/data/site.ts` if the Google Drive file itself changes.
3. Update `cv.updated` in the same file.
4. Confirm the Drive sharing setting allows anyone with the link to view the file.
5. Run `npm run verify` and test both links.

## Update the teaching portfolio

Replace `public/teaching/Bodhi_McNally_Teaching_Portfolio.pdf`, keeping the filename unchanged. Its link is configured in `src/data/site.ts`.

## Add a teaching resource

Resources are Markdown or MDX files in:

```text
src/content/resources/
```

Copy `understanding-confidence-intervals.md`, rename the copy with a short lowercase slug, and replace all frontmatter and body content. A minimal example is:

```md
---
title: Understanding confidence intervals
description: A concise guide to estimating and interpreting uncertainty.
category: Statistics
tags:
  - confidence intervals
  - uncertainty
published: 2026-10-01
updated: 2026-10-01
level: Introductory
software: []
estimatedMinutes: 10
featured: false
template: false
draft: true
downloadableAssets: []
---

Write the resource here.
```

Set `draft: false` only when the resource is ready to publish. The filename becomes its URL, for example:

```text
src/content/resources/understanding-confidence-intervals.md
→ /resources/understanding-confidence-intervals/
```

The available categories and validated metadata fields are defined in `src/content.config.ts`. Add a new category there only when at least one real resource needs it.

The search and filter controls appear automatically once four or more published resources are available. With a smaller library, the page keeps a simpler editorial list.

### Equations, code, tables and callouts

- Use `$...$` for inline equations and `$$...$$` for display equations.
- Use fenced Markdown code blocks with a language such as ```` ```r ```` or ```` ```python ````. Syntax highlighting and copy buttons are automatic.
- R blocks also receive a **Run R** button. R is downloaded from the official webR distribution only when a reader selects that button; execution then occurs in the reader's browser.
- Use normal Markdown tables; they scroll horizontally on narrow screens.
- Use a blockquote beginning with a bold label for a callout.

### Downloads and external repositories

Put downloadable files under a clear subfolder of `public/resources/`, then list them in the resource frontmatter:

```yaml
downloadableAssets:
  - label: Worked example PDF
    href: /resources/confidence-intervals/worked-example.pdf
    description: A two-page printable exercise.
externalRepository:
  label: View code on GitHub
  href: https://github.com/REPLACE_WITH_VERIFIED_ACCOUNT/REPLACE_WITH_REPOSITORY
```

Never publish an unverified repository URL.

## Add a publication

Edit `src/data/research.ts` and add a verified object to the `publications` array:

```ts
{
  id: 'short-stable-slug',
  title: 'Replace with the exact published title',
  authors: ['Author One', 'Bodhi McNally'],
  journal: 'Replace with journal name',
  year: 2027,
  doi: '10.xxxx/replace-with-verified-doi',
  pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/REPLACE_WITH_ID/',
  citation: 'Replace with the final preferred citation.',
  publicationType: 'Journal article',
  selected: true,
},
```

Remove optional DOI or PubMed fields if they do not exist. Never add an accepted, in-press or published status until it is accurate and public.

## Add a presentation or conference abstract

Add a verified object to the `presentations` array in `src/data/research.ts`:

```ts
{
  id: 'short-stable-slug',
  title: 'Replace with the exact presentation title',
  conference: 'Replace with conference name',
  location: 'City, Country',
  date: '2027-03-01',
  presentationType: 'Poster presentation',
  citation: 'Replace with a verified citation if one exists.',
  link: 'https://example.org/replace-with-public-program-or-abstract',
  selected: false,
},
```

Allowed presentation types are listed in the `Presentation` type immediately above the array. Presentations are retained as structured data for future use but are not displayed on the current Research page.

## Add a research project

Add a verified object to the `projects` array in `src/data/research.ts`:

```ts
{
  id: 'short-stable-slug',
  title: 'Replace with the approved public project title',
  institution: 'Replace with the verified institution',
  collaborators: [],
  role: 'Replace with the verified role',
  researchArea: 'Urological oncology',
  status: 'Active',
  shortDescription: 'Replace with a concise, accurate public description.',
  outputs: [],
  startYear: 2027,
  selected: true,
},
```

Confirm that the project title, collaborators, institution and status are suitable to publish before adding them. Projects are retained as structured data for future use but are not displayed on the current Research page.

## Deploy with GitHub and Vercel

### 1. Create the GitHub repository

Create an empty repository named `bodhimcnally.com` in your GitHub account. Do not ask GitHub to add a README, licence or `.gitignore`; those files already exist here.

From this project folder, run:

```bash
git init
git add .
git commit -m "Initial academic website"
git branch -M main
git remote add origin git@github.com:BodhiMcNally/bodhimcnally.com.git
git push -u origin main
```

### 2. Import into Vercel

1. In Vercel, choose **Add New → Project**.
2. Import the GitHub repository.
3. Vercel should detect Astro automatically.
4. Confirm the build command is `npm run build` and the output directory is `dist`.
5. No environment variables or secrets are required.
6. Deploy.

Every push to `main` will then create a new production deployment. Pull requests can receive preview deployments if enabled in Vercel.

### 3. Connect `bodhimcnally.com`

1. Buy the domain from your preferred registrar if you do not already own it.
2. In the Vercel project, open **Settings → Domains**.
3. Add both `bodhimcnally.com` and `www.bodhimcnally.com`.
4. Copy the DNS records Vercel shows into the registrar’s DNS panel. Use Vercel’s current values rather than copying an old IP address from a guide.
5. In the Domains settings, configure `www.bodhimcnally.com` to redirect permanently to `bodhimcnally.com` and keep the apex domain primary.
6. Wait for DNS verification and HTTPS certificate issuance.

Astro’s canonical metadata and sitemap already use `https://bodhimcnally.com`. The redirect belongs in Vercel’s Domains settings because it is tied to the attached production domains rather than the application routes.

### Other static hosts

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22 or later
- Required secrets: none

For Netlify or Cloudflare Pages, connect the same GitHub repository and use those values. If your host has a “primary domain” setting, keep the apex domain primary and redirect `www` to it.

## Academic integrity and copyright

The Resources section should contain only material that you own or have explicit permission to publish. Do **not** upload:

- solutions to active assessments;
- restricted learning-management-system content;
- lecturer slides, question banks or notes you do not own;
- copyrighted resources without permission;
- confidential or identifiable student material;
- private datasets, project files or unpublished collaborator material.

Where a resource relates to teaching you undertake at the University, keep the existing independent-resource disclaimer and check any applicable University, school and course requirements before publication.

## SEO, privacy and maintenance

- Page titles, descriptions, canonical URLs, Open Graph metadata, Person/WebSite structured data, `robots.txt` and an XML sitemap are included.
- No social-preview image is configured. Add one only when you have an approved image and clear rights to publish it.
- No analytics are installed. This avoids tracking and any analytics-related cookie requirements in the initial site.
- Review `src/data/site.ts` and all public biography copy whenever your training stage, role or institutional affiliation changes.
- Run `npm run verify` before every important deployment.

See `docs/ARCHITECTURE.md`, `docs/CONTENT_AUDIT.md` and `docs/NEXT_STEPS.md` for a compact technical map, the initial accuracy audit and a deployment checklist.

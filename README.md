# bodhimcnally.com

The source for [bodhimcnally.com](https://bodhimcnally.com): a static academic website for medicine, research, teaching and student resources.

The site is built with Astro 7, strict TypeScript and SCSS. It is deliberately static, has no database, analytics, tracking, contact form or required environment secrets, and can be hosted on Vercel, Netlify, Cloudflare Pages or any ordinary static host.

## Run locally

You need Node.js 22 or later. If you use `nvm`, run `nvm use` from this folder.

```bash
npm install
npm run dev
```

Astro will print the local address, normally `http://localhost:4321`.

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
├── cv/                             Public CV PDF
├── favicon.svg                     BM favicon
├── robots.txt                      Search-engine instructions
├── resources/                      Downloadable teaching attachments
└── site.webmanifest                Basic site manifest
```

The generated `dist/`, `.astro/` and `node_modules/` folders are ignored by Git.

The reasoning behind the site's current information architecture and colour direction is recorded in `docs/DESIGN_RESEARCH.md`.

## Update the bio, titles or current roles

Edit:

```text
src/data/site.ts
```

This is the central profile file. It contains the site name, current role, institution, clinical school, homepage descriptor, short introduction, canonical URL and external links. Update current information there before editing individual pages.

Longer narrative copy is intentionally page-specific:

- `src/pages/about.astro`
- `src/pages/research.astro`
- `src/pages/teaching.astro`

Search those pages for any time-sensitive wording when your role or training stage changes.

## Update profile links and contact details

Edit `src/data/site.ts`.

- Add a verified GitHub URL to `optionalProfiles.github`.
- Add a verified Google Scholar URL to `optionalProfiles.googleScholar`.
- Add a professional email address to `email`.

Keep an unavailable field as `null`. The site will not display or invent it.

## Replace the headshot

Replace this file while keeping the filename unchanged:

```text
src/assets/images/Bodhi_McNally_Portrait.jpg
```

Use a high-quality square or near-square JPEG. Astro automatically creates responsive AVIF, WebP and JPEG versions during the build. The current image is not stylised; CSS only controls its crop and presentation.

If you change the filename, update the import in `src/components/Portrait.astro`.

## Add the CV

1. Add the PDF at exactly:

   ```text
   public/cv/Bodhi_McNally_CV.pdf
   ```

2. In `src/data/site.ts`, change:

   ```ts
   href: null as string | null,
   ```

   to:

   ```ts
   href: '/cv/Bodhi_McNally_CV.pdf',
   ```

3. Run `npm run verify` and open the About page to confirm the download link.

Until both steps are complete, the About page shows a restrained unavailable state and no broken button.

## Add a teaching resource

Resources are Markdown or MDX files in:

```text
src/content/resources/
```

Copy `how-to-interpret-a-regression-coefficient.md`, rename the copy with a short lowercase slug, and replace all frontmatter and body content. A minimal example is:

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
  publicationType: 'Original research',
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

Allowed presentation types are listed in the `Presentation` type immediately above the array.

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

Confirm that the project title, collaborators, institution and status are suitable to publish before adding them. Keep the RISE description general until the specific project details are verified and shareable.

## Deploy with GitHub and Vercel

### 1. Create the GitHub repository

Create an empty repository named `bodhimcnally.com` in your GitHub account. Do not ask GitHub to add a README, licence or `.gitignore`; those files already exist here.

From this project folder, run:

```bash
git init
git add .
git commit -m "Initial academic website"
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/bodhimcnally.com.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with the verified account name.

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

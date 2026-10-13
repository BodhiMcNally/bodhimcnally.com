# bodhimcnally.com

Source for [my academic website](https://bodhimcnally.com): research, teaching, publications and a collection of interactive resources for students.

The site uses Astro, TypeScript and SCSS, with Markdown content collections and a small set of Vercel functions. Most pages are generated at build time. R exercises, statistical tools and maps run in the browser; the server handles authenticated publishing and retrieval of the current CV.

## Architecture

Content, presentation and computation have separate responsibilities:

- **Astro** builds the pages, search index, metadata, sitemap and responsive images. Content schemas live in `src/content.config.ts`.
- **Browser code** provides webR execution, Plotly rendering, mapgl widgets, study tools, annotations and offline reading. Heavier runtimes load when needed.
- **Vercel functions** expose `/api/editor` for authenticated GitHub writes and `/api/cv` for the live PDF. Credentials remain on the server.

GitHub is the source of truth. Both VS Code changes and browser edits become commits in the same repository, and Vercel deploys `main`. There is no separate CMS database to reconcile with the source tree.

## Development

Use Node.js **22.12 or later** and the committed npm lockfile:

```bash
npm ci
npm run dev
```

The development server normally runs at `http://localhost:4321`. Before committing:

```bash
npm run verify
node --test tests/site-editor.test.mjs
```

`verify` runs Astro's diagnostics, builds the site, checks internal links and audits the generated HTML for baseline accessibility and metadata issues. The editor tests cover authentication, source-file boundaries, conflicting writes, content validation, Markdown rendering and cache behaviour.

The build hooks prepare the PDF.js renderer, editor preview assets, deployment revision, saved CV previews and PWA icons. Generated runtime assets are recreated during deployment. `scripts/configure-mapgl-build.mjs` excludes static vendor assets and Quarto authoring files from TypeScript's scan; application source remains checked.

The public site can be developed without publishing credentials. Astro's dev server does not run the root Vercel functions. To exercise the editor locally with its API:

```bash
npm run build
node scripts/preview-site-editor.mjs
```

This serves the editor at `http://127.0.0.1:4323/admin/` and reads `.env.editor.local`. Publishing from that preview writes to the configured GitHub branch.

## Content and browser editing

The private editor is available at `/admin/`. It supports selecting text from a page preview, editing existing copy, adding publications and research projects, and creating posts or teaching resources. Markdown provides formatting, lists, links, images, tables, code, footnotes and mathematics. Headings accept inline formatting; profile metadata uses plain text.

| Content | Source |
| --- | --- |
| Editable page text, profile strings and mapgl lesson prose | `src/data/site-copy.json` |
| Publications, presentations and research projects | `src/data/research-content.json` |
| Posts and LinkedIn updates | `src/content/updates/` |
| Teaching resources and their metadata | `src/content/resources/` |
| Navigation, external links, appearances and profile configuration | `src/data/site.ts` |
| Layouts, components and interactive behaviour | `src/pages/`, `src/components/`, `src/scripts/` |

`EditableCopy.astro` connects page elements to stable copy IDs. `research.ts` supplies the types and exports for the JSON research records. Layout changes, application logic, media assets and presentation records are maintained in VS Code.

A browser publish validates the content and writes it through GitHub's Contents API. Each save includes the file SHA from when the edit was opened. If the source has changed, the write is rejected and the unsaved draft remains available. The editor then tracks the deployed commit through the generated `editor-build.json`.

Authentication uses a scrypt password hash, signed sessions, HttpOnly cookies and Origin/CSRF checks. Only the configured content paths are writable. Markdown previews are sanitised, document bodies reject active HTML, and LinkedIn embeds use a dedicated validated field.

For a new installation, run `node scripts/apply-site-editor.mjs`, then `node scripts/setup-site-editor.mjs`. The setup script creates an ignored `.env.editor.local` file. Add its values to Vercel's Production environment:

```text
CMS_USERNAME
CMS_PASSWORD_HASH
CMS_SESSION_SECRET
CMS_GITHUB_TOKEN
CMS_REPOSITORY
CMS_BRANCH
CMS_ORIGIN
```

The GitHub token needs Contents read/write permission for this repository. `CMS_ORIGIN` must match the production origin. Keep secrets out of Git and client-side variables. Redeploy after changing the environment. `node scripts/check-site-editor.mjs https://bodhimcnally.com` checks the deployed login, assets, anonymous session endpoint, revision marker and footer.

## Keeping the local checkout current

Browser publishing updates GitHub. A local helper brings those commits into the laptop checkout:

```bash
node scripts/sync-site.mjs --watch
```

It checks every 30 seconds and fast-forwards a clean `main` branch. Saved tracked changes, divergent commits or another branch pause synchronization. Git also refuses an incoming change that would overwrite a colliding untracked file. The helper does not reset, stash or discard local work. Unsaved editor buffers are outside Git's view.

On Windows, install the background helper at login with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Install-SiteSync.ps1
```

It uses the existing Git remote and credentials. Logs are written to `site-sync.log` and `site-sync-errors.log`. `Stop-SiteSync.ps1` stops the helper and removes its startup shortcut. Run `node scripts/sync-site.mjs` for a single update.

For larger changes, use the normal VS Code workflow: save and commit local work, reconcile incoming browser commits, verify, then push.

## Live CV

The About page retrieves the current PDF from a fixed Google Drive file through `/api/cv`. PDF.js renders its pages in the browser, replacing the saved preview images when the live document loads. Updating the existing Drive file therefore updates the displayed CV without a repository commit or site rebuild.

The file must remain publicly viewable and retain its Drive ID. Upload a new version of that file rather than deleting it and creating a replacement. Configuration is in `config/live-cv.mjs`.

The endpoint validates the PDF, enforces a size limit and derives an ETag from its contents. Vercel may cache the response for five minutes. The browser refreshes while the page is visible and when it becomes visible again. CV requests bypass the offline cache, so a previously saved response cannot pin the preview to an old version.

The local PDF at `public/cv/Bodhi_McNally_Master_CV.pdf` and WebP images under `public/cv/pages/` provide the saved fallback. Updating the Drive file does not update that fallback. `scripts/render-cv-pages.mjs` regenerates it when the local PDF changes; commit the PDF, page images and `src/data/cv-pages.json` together when refreshing the fallback. PDF.js libraries and workers are prepared automatically by `scripts/prepare-live-cv.mjs`.

The teaching portfolio remains at `public/teaching/Bodhi_McNally_Teaching_Portfolio.pdf`. Astro generates responsive versions of the portrait from `src/assets/images/Bodhi_McNally_Portrait.jpg`.

## Teaching resources

The teaching library combines Markdown explanations with executable examples and browser-based exercises. Resources support equations, highlighted code, copy controls, downloadable assets, reading progress and a section-aware table of contents.

R blocks can run through **webR** in the reader's browser. The runtime loads on demand. Table results are converted to sanitised HTML; Plotly results are converted to JSON and rendered with Plotly.js. The plotting environment also registers the bundled Ubuntu fonts. Set `browserR: false` when a lesson requires packages or outputs the browser runner cannot reproduce.

The interactive workbench includes:

| Tool | Purpose |
| --- | --- |
| Statistical simulation studio | Seeded experiments for confidence intervals, sampling distributions and power, with data exports, equivalent R code and shareable settings |
| Clinical prediction laboratory | Sensitivity, specificity, predictive values, likelihood ratios, thresholds and net benefit |
| Statistical interpretation clinic | Exercises in interpreting statistical output |
| Quarto laboratory | Editable QMD examples, a guided document preview and source downloads |
| Git practice environment | A virtual filesystem and repository for learning staging, commits, branches and remotes |
| Additional workspaces | Method comparison, reproducibility inspection, visualisation critique, result explanation and research protocol planning |

The Git environment does not execute system commands or access visitors' files. The Quarto laboratory models supported document features; a full Quarto render still belongs in the local authoring environment.

## mapgl tutorial

The mapgl lesson supports DATA1X01 Project 2 and the use of interactive maps in Quarto reports. It is embedded directly in `/resources/interactive-maps-in-r-with-mapgl/`, using the site's navigation, typography, table of contents and copy controls. Its 13 interactive maps initialise as the reader reaches them.

Examples use real Greater Sydney data: 373 ABS SA2 polygons with population estimates, 1,033 NSW government education locations and the ABS population grid. The lesson progresses from spatial data preparation and coordinate systems to layered maps, choropleths, legends and more advanced interaction. Data provenance and preparation are documented alongside the source.

The executable lesson is `teaching/mapgl-source/index.qmd`. R computes the examples during Quarto rendering; the published site serves the resulting HTML, widget payloads and JavaScript dependencies. Vercel does not need R or Quarto. Maps require WebGL, and external basemaps require network access.

To change the calculations or map definitions, install the lesson's R dependencies and Quarto locally, then run:

```bash
node scripts/update-mapgl.mjs
node scripts/apply-site-editor.mjs
npm run verify
```

The update script renders the lesson, extracts its native content and widgets, and rebuilds the student source download. Commit the authoring source, generated `src/data/mapgl/` content, `public/resources/mapgl/` assets and copy changes together. Browser edits to lesson prose live in `site-copy.json`; they are not written back into the QMD, so reconcile them when regenerating the lesson.

Students can download the complete source and prepared data, then render the same lesson independently. See [the lesson README](teaching/mapgl-source/README.md) and [data documentation](teaching/mapgl-source/data/README.md).

## Posts and research records

Posts appear in the homepage feed, `/posts/` archive and individual `/posts/<slug>/` pages. Higher `sortOrder` values appear first; `draft: true` excludes an entry from public pages. `collapsed: true` keeps a long homepage entry compact.

LinkedIn entries retain the original post link and can include an official embed URL. The editor accepts the supplied iframe code and extracts its permitted source. Embeds depend on LinkedIn's availability and the visitor's browser settings.

Publications record the title, authors, journal, year, citation and publication type, with optional DOI and PubMed links. Citations and research project descriptions support Markdown. Stable IDs keep records identifiable when their titles change.

## Reading, search and offline use

The command palette opens with `/`, `Ctrl+K` or `Command+K`. Its build-time index includes navigation, published resource text and research records; headings on the current page are added in the browser. It also provides sharing, printing, page links and build/storage diagnostics. The footer no longer includes the Site details action.

Readers can save resources, highlight passages and attach notes. The notebook at `/resources/notebook/` exports Markdown or JSON and can restore a JSON backup. These records are stored in that browser, not in server-side accounts.

**Save resources offline** caches teaching pages and assets through `public/sw.js`. First-time package downloads, external basemaps and third-party embeds still need a connection. The live CV, editor endpoints, editor code and deployment marker bypass offline storage. Bump the worker's cache name when changing its caching policy.

## Deployment

Vercel builds commits to `main` using `npm run build`, with `dist` as the static output directory. The root `api/` directory supplies the two serverless endpoints.

For source changes, review and stage the intended files, then commit and push:

```bash
git status
git diff
git add <changed-files>
git diff --cached
git commit -m "Describe the change"
git push origin main
```

Content changes follow the same deployment path whether they originate in VS Code or the browser editor. Failed builds leave the previous successful deployment in place; a GitHub save and a live deployment are separate states.

# Put the full mapgl lesson into the native website

This revision replaces the previous introduction-plus-links arrangement with the full executed tutorial at **`/resources/interactive-maps-in-r-with-mapgl/`**. All 13 map outputs appear directly in the page. The website supplies its existing navigation, title, table of contents, typography, code-copy controls, notes and reading progress. There is no iframe, separate lesson page or Project 2 starter.

## Install over the previous mapgl additions

1. Extract the ZIP into a temporary folder.
2. Copy its `src`, `public`, `teaching`, `scripts` and `docs` contents into your existing website root (the folder containing `package.json`). **Merge folders**; do not replace whole existing folders. Overwrite the previous mapgl files when prompted.
3. From that root run:

```bash
node scripts/apply-mapgl-update.mjs
npm run verify
```

The first command is a one-time migration, using only Node's built-in modules. It inserts a small mapgl-only branch into `src/pages/resources/[id].astro`, preserving the rest of your template. It also appends `public/resources/mapgl` to the existing `tsconfig.json` exclude list so prebuilt browser dependencies and large map data are not checked as application source. It removes only the exact obsolete paths supplied in the earlier mapgl package: the standalone HTML pages, starter source/downloads, and redundant copies of authoring files. Other resource pages, configuration values and content are preserved. Running it again is safe.

The ZIP deliberately contains neither a replacement resource template nor a replacement TypeScript configuration. The migration edits your existing versions. If your template has been substantially customised and its insertion points cannot be found, the script stops before changing files. See the manual integration below.

If npm dependencies have not been installed, run `npm ci` before verification. No new npm dependencies are added. Hosting does not need R or Quarto; commit and push using your existing deployment workflow.

Stage the update, including the obsolete-file deletions, with:

```bash
git add src/content/resources/interactive-maps-in-r-with-mapgl.md src/components/MapglTutorial.astro src/data/mapgl/ ':(literal)src/pages/resources/[id].astro' tsconfig.json public/resources/mapgl/ teaching/mapgl-source/ scripts/update-mapgl.mjs scripts/embed-mapgl.mjs scripts/apply-mapgl-update.mjs docs/MAPGL_INTEGRATION.md
git diff --cached --stat
git commit -m "Embed the full mapgl tutorial in the website resource page"
git push
```

## Files in the update

| Path | Purpose |
|---|---|
| `src/content/resources/interactive-maps-in-r-with-mapgl.md` | Native resource metadata and one complete source download |
| `src/components/MapglTutorial.astro` | Native lesson presentation and lazy map loading |
| `src/data/mapgl/` | Executed lesson body, native section anchors and map manifest |
| `public/resources/mapgl/runtime/` | R-generated widget JavaScript and CSS, with original licence notices |
| `public/resources/mapgl/widgets/` | The actual R-generated map payloads |
| `public/resources/mapgl/data/` and `downloads/` | Real data, provenance and executable student source bundle |
| `teaching/mapgl-source/` | Editable single-lesson Quarto project and real Sydney data |
| `scripts/apply-mapgl-update.mjs` | Safe one-time migration from the earlier package |
| `scripts/update-mapgl.mjs` and `scripts/embed-mapgl.mjs` | Optional local rendering and native publication |

The resource remains automatically discoverable in the existing listing, filters and search. Only one download is shown after the full lesson: the executable tutorial and Sydney data. Data-source and documentation references remain inside the lesson.

## Edit the lesson later

Edit `teaching/mapgl-source/index.qmd`. With R, Quarto and the listed R packages installed locally, run from the website root:

```bash
node scripts/update-mapgl.mjs
npm run verify
```

Commit the changed source, native lesson data and public assets. The update command uses the site's existing locked `fflate` and Astro/parse5 dependencies. It keeps temporary Quarto libraries outside the Astro project. For an already executed self-contained HTML file, `node scripts/update-mapgl.mjs --from-html /path/to/index.html` republishes the actual map outputs without rerunning R. `--downloads-only` refreshes the student bundle after edits to its README or validation notes.

R runs when Quarto renders the lesson; readers can pan, zoom, click and use filters and sliders directly on the website. Editing and rerunning R takes place in the downloaded Quarto project. The existing browser R runner does not support this complete mapgl/sf workflow and remains disabled only for this resource.

## Manual integration for a customised template

In `src/pages/resources/[id].astro`, import `MapglTutorial` from `@/components/MapglTutorial.astro` and the generated `@/data/mapgl/headings.json`. Define `isMapglTutorial` from the resource ID `interactive-maps-in-r-with-mapgl`. Pass the generated headings to `TableOfContents` for this resource. Inside the existing prose wrapper, render `MapglTutorial` when that ID matches and keep `Content` for all other resources. Append `public/resources/mapgl` to your existing `tsconfig.json` exclude array. Do not replace your custom template or config with whole files from another site.

## Validation

`teaching/mapgl-source/VALIDATION.md` records the actual executed R outputs, native page checks and preservation comparison. The maps use the same real Greater Sydney datasets as the previous version. All 25 R chunks are unchanged; the starter references and duplicate published pages have been removed.

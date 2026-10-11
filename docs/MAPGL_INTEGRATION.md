# Add the mapgl tutorial to your existing website

The supplied `mapgl-website-additions.zip` contains **new paths only**, designed for the academic website source ZIP you supplied. It does not replace existing pages, configuration, dependencies, or navigation.

## Copy, merge, and push

1. Extract `mapgl-website-additions.zip` into a temporary folder.
2. Open your existing website root — the folder containing `package.json`, `src`, and `public`. Copy the extracted `src`, `public`, `teaching`, `scripts`, and `docs` folders **into that root**, merging the folders. Do not replace an entire existing folder. The files inside these additions have new names; your file manager should not need to overwrite an existing file.
3. Commit the new files and push using your usual workflow. The supplied rendered maps deploy with the existing Astro build; you do **not** need R or Quarto on your hosting service.

If an overwrite prompt names a mapgl file, you may already have installed these additions; compare that file before replacing it. If it names an existing non-mapgl file, cancel and check that you are merging folder contents rather than replacing folders.

Optional local verification, using your existing Node setup:

```bash
npm run verify
```

If dependencies are not installed, run `npm ci` first. No new npm dependency is added.

## What appears on the site

- Native resource page: `/resources/interactive-maps-in-r-with-mapgl/`
- Full executable tutorial, already rendered: `/resources/mapgl/index.html`
- Rendered Project 2 starter: `/resources/mapgl/project2-starter.html`
- Standalone interactive SA2 preview: `/resources/mapgl/sydney-sa2-preview.html`

The new resource is discovered automatically by the existing resource listing, category filters, and search. Existing content files are unchanged.

## Files you are adding

| New path | Purpose |
|---|---|
| `src/content/resources/interactive-maps-in-r-with-mapgl.md` | Native resource introduction and live preview |
| `public/resources/mapgl/` | Rendered HTML, supporting assets, data guide, and student downloads |
| `teaching/mapgl-source/` | Editable Quarto sources, real Sydney data, scripts, and validation notes |
| `scripts/update-mapgl.mjs` | Optional local command to rebuild and refresh the published tutorial |
| `docs/MAPGL_INTEGRATION.md` | These instructions |

The whole site, its build output, dependency folder, and repository history are deliberately not included in the additions archive.

## Editing the tutorial later

Edit `teaching/mapgl-source/index.qmd` or `project2-starter.qmd`. On your own computer, install R 4.1+, Quarto, and the R packages listed in `scripts/install-packages.R` inside that source folder. Then from the **website root** run:

```bash
node scripts/update-mapgl.mjs
npm run verify
```

Commit the changed source and generated `public/resources/mapgl` files, then push. The update helper uses the website's existing `fflate` dependency; no Python or hosting-side R installation is required. The data are bundled, so ordinary rendering does not download them.

The full lesson shows executable R code and maps produced by that code. The map controls run on the website as JavaScript. Editing and rerunning R happens locally in RStudio/Quarto; this resource does not use the site's browser R runner because that runner does not support this complete mapgl/sf workflow.

The basemap needs internet access and WebGL. Embedded HTML assets preserve widget dependencies but do not cache remote basemap tiles. For PDF or Word, use the documented static-export pattern.

## Real data and reproducibility

The tutorial uses 373 real Greater Sydney SA2 polygons, ABS population estimates for 2021–2025, 1,033 NSW government education locations, and the real ABS population raster for 2025. All sources, periods, licences, exclusions, and transformations are documented in `teaching/mapgl-source/data/README.md` and in the downloadable student source bundle. Full-resolution boundaries are retained for analysis; maps use a smaller display copy.

The copy-and-paste additions were tested against the source website you supplied. `teaching/mapgl-source/VALIDATION.md` records R rendering, browser interactions, website build checks, and the preservation comparison.

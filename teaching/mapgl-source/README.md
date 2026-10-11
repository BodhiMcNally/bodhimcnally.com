# Interactive maps in R with mapgl

A complete, executable Quarto tutorial for DATA1X01 Project 2, using real Greater Sydney data: 373 ABS SA2 polygons and population estimates, 1,033 NSW government education locations, and the ABS 2025 population grid. Prepared data and original-source snapshots are included. See `data/README.md` for citations, licences, periods, and preparation.

## Run the tutorial locally

1. Open this folder as your RStudio project, or make it your working directory.
2. Install R 4.1+ and the Quarto CLI. Run `Rscript scripts/install-packages.R` once, or install the listed packages in the R Console.
3. Run `quarto preview` to explore, or `quarto render` to rebuild both reports.

The executable sources are `index.qmd` and `project2-starter.qmd`. All displayed R examples execute at render time. The maps then run as JavaScript htmlwidgets in an ordinary browser; the static page does not run a live R kernel. OpenFreeMap supplies remote basemap tiles without an API key, so map viewing needs internet access and WebGL.

The starter uses real ABS population data and contains an interactive choropleth, a supporting bar chart, and a table. Adapt it to your question and the assessment instructions.

## Website integration

The supplied website additions already contain rendered HTML at `public/resources/mapgl/`. The Astro deployment does not need R or Quarto. The native resource page links to the full lesson and automatically appears in the website resource library and search.

For a future content update, edit these sources, then from the **website root** run:

```bash
node scripts/update-mapgl.mjs
npm run verify
```

This optional update command requires local R and Quarto. It rebuilds the reports and standalone preview, refreshes the downloadable source ZIP, adds canonical URLs, and copies the rendered files into `public/resources/mapgl/`. Commit the source changes and generated public files, then push normally. It does not delete files or modify other site resources.

Read `docs/MAPGL_INTEGRATION.md` in the website additions for the copy-and-paste installation instructions.

## Data preparation

The reports use prepared local files, so they do not fetch data during rendering. `Rscript R/prepare-sydney-data.R` rebuilds them from the bundled snapshots. `scripts/fetch-sydney-data.R` is an optional source-refresh script requiring `readxl`. Review provenance and any changed counts after refreshing the live NSW data. Keep full analytical boundaries separate from the simplified display copy.

The original tutorial sources and prepared data are in `downloads/mapgl-tutorial-source.zip` on the published website. Individual `.qmd.txt` links download as `.qmd` to avoid Quarto rewriting source links into rendered-page links.

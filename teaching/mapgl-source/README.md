# Interactive maps in R with mapgl

One complete, executable Quarto lesson for DATA1X01 Project 2, using real Greater Sydney data: 373 ABS SA2 polygons and annual population estimates, 1,033 NSW government education locations, and the ABS 2025 population grid. See `data/README.md` for sources, licences, periods and preparation.

## Run the lesson locally

1. Extract this entire folder and open it in RStudio as your project.
2. Install R 4.1+ and the Quarto CLI. Run `Rscript scripts/install-packages.R` once, or install the packages listed in the lesson in the R Console.
3. Run `quarto preview index.qmd` to work through it, or `quarto render index.qmd --to html` to generate the full report.

`index.qmd` is the full tutorial. All displayed R examples execute during rendering. The resulting maps run as JavaScript htmlwidgets in a browser. To change an example's calculations or mapping code, edit the QMD and render again. OpenFreeMap basemaps require internet access; viewing maps requires WebGL.

## Academic website

The full lesson appears directly at `/resources/interactive-maps-in-r-with-mapgl/`, inside the academic website's existing resource layout. It has the website's navigation, typography, table of contents and code-copy controls. Each map loads as the reader reaches its example. There is no iframe, separate published lesson page or starter report.

The website uses prebuilt content and requires no R or Quarto on the hosting service. For a later content edit, change this QMD and run these commands from the website root:

```bash
node scripts/update-mapgl.mjs
npm run verify
```

The optional update command requires local R and Quarto. It renders this single lesson in a temporary directory, extracts the lesson body and widget dependencies, writes the native content and map payloads, and refreshes the student source download. Commit the changed sources, `src/data/mapgl/`, and `public/resources/mapgl/`, then push normally.

For the initial website update, follow `docs/MAPGL_INTEGRATION.md`. The downloadable standalone source project does not need the Astro website to run.

## Data preparation

Rendering reads the bundled prepared data and does not fetch live data. `Rscript R/prepare-sydney-data.R` rebuilds prepared files from the original snapshots. `scripts/fetch-sydney-data.R` is an optional refresh script requiring `readxl`; review provenance, reference periods and changed counts after refreshing a source. Keep the full analytical boundaries separate from the simplified display copy.

The website supplies this complete folder in `downloads/mapgl-tutorial-source.zip`. The individual `.qmd.txt` download can be saved as `index.qmd`, but needs the data and configuration from the complete bundle.

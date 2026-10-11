# Validation record

Native website integration, **11 October 2026**. Tested against the academic website source ZIP supplied by Bodhi McNally, with the previous real-Sydney mapgl additions installed.

## Executed R outputs

The previous revision executed the complete tutorial with R 4.3.3, Quarto 1.8.27, mapgl 0.5.2, sf 1.0-15 and terra 1.7-65. The package versions and session information are retained alongside this file. This revision leaves **all 25 R chunks byte-for-byte unchanged**: 22 executed chunks and three intentionally unexecuted examples (package installation, custom-file imports and optional static export).

This migration used the already executed self-contained Quarto lesson to generate the native page. Each of its **13 map payloads was compared byte-for-byte** with the original R-generated JSON. All match exactly. The starter report, standalone preview and their references have been removed. The source now defines one Quarto document rather than a second website navigation layer.

`node scripts/update-mapgl.mjs --from-html ...` was exercised end to end: HTML parsing, native content and section anchors, dependency publication, lazy payload extraction, obsolete-file migration, checksums and student source ZIP generation. The default fresh-R-render path uses `quarto render` in a temporary directory and was not rerun during this document-only integration revision. The original unchanged R chunks were already executed successfully. Hosting builds use supplied assets and do not execute R.

## Real data

The same checked real data are retained: 373 unique, valid Greater Sydney SA2s; 2025 resident population total **5,638,830**; **1,865** unique area/year records; **1,033** government education locations, all matched to exactly one full-resolution SA2; **29** missing latest-reported FTE values, explicitly excluded from quantitative point views. The original population grid is 1 km in EPSG:3577. Display classes and nearest-neighbour resampling are unchanged. Full provenance, periods, exclusions, preparation and licences remain in `data/README.md`.

## Native browser checks

Chrome for Testing 131 with Playwright, desktop **1440 × 1000** and mobile **390 × 844**.

- All **13 native map outputs** rendered: 12 single widgets plus a swipe comparison with two contexts.
- One native page title, one main landmark, the existing website navigation, all **20** tutorial section anchors, and no iframe or starter links.
- Maps load as the reader approaches their example. No maps or widget runtime are loaded at the top of the lesson before an example approaches the viewport.
- Real Glebe Public School popup: **193 latest reported FTE**. Actual click and zoom verified.
- Native code-copy control writes the package-installation example to the clipboard.
- Category legend changes its enabled state; SA2 boundary toggle hides the line layer.
- School cluster count labels render, using Noto Sans Regular.
- Time slider filters the layer to numeric **2025**, confirmed after its scheduled update.
- Swipe divider responds to a real pointer drag. Raster uses **nearest** resampling.
- Student source ZIP, QMD and data guide return HTTP 200.
- Desktop and mobile pages have no horizontal overflow. Mobile map width is **350 px** in a 390 px viewport. Legends, units, attribution and code were visually inspected.
- No page errors, console errors or HTTP error responses in the final browser checks.

The existing browser R runner remains disabled only for this resource because it does not support the full mapgl/sf pipeline. Interactive maps run directly on the website; students execute changed R code in the downloadable Quarto project.

## Website checks

`npm run verify` passes: Astro reports **0 errors, 0 warnings and 0 hints**, builds **26 routes**, resolves all internal links in **27 HTML files**, and passes the existing baseline accessibility/metadata audit. The three duplicate HTML pages are no longer published.

## Preservation and installation

Compared every original website source file against the supplied ZIP. **119 of 121** remain byte-for-byte unchanged. The only original files changed by migration are:

1. `src/pages/resources/[id].astro`: two imports, a mapgl resource condition, native section selection and conditional lesson content. All existing resource behaviour is retained.
2. `tsconfig.json`: appends `public/resources/mapgl` to the existing exclude list. All other settings are retained.

The update ZIP contains neither original file. Its one-time installer patches the user's existing versions rather than overwriting them. Tests with a customised template and an extra TypeScript exclusion confirmed that local customisations and unrelated files survive, only exact obsolete mapgl paths are removed, and rerunning the installer is idempotent. An unrecognised template causes a clean stop before either original file is written.

No original page content, dependencies, build configuration values, navigation entries or repository history are replaced. The installer performs no git or deployment actions. The source archive omits the starter, temporary Quarto output, exports, caches and redundant libraries.

## Optional examples

The PDF/Word static-export pattern still requires chromote and Chrome/Chromium and was not executed. The optional live-data refresh script was previously syntax-checked and was not rerun. It additionally requires readxl and internet access. The supplied lesson reads the bundled prepared data during rendering. Viewing its basemap requires internet access and WebGL; embedded dependencies do not cache remote tiles.

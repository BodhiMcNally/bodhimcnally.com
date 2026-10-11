# Validation record

Real Sydney revision, **11 October 2026**. The tutorial targets mapgl **0.5.2**. These checks were completed against the academic website source ZIP supplied by Bodhi McNally.

## Executed R and Quarto

- R 4.3.3; Quarto 1.8.27; mapgl 0.5.2; sf 1.0-15; terra 1.7-65. Complete package versions and session information are supplied alongside this file.
- Tutorial: 25 R chunks, with 22 executed. Installation, custom-file import templates, and optional static export are intentionally unexecuted examples.
- Starter: all 6 R chunks executed, producing an interactive SA2 choropleth, bar chart, and supporting table. Figure captions and cross-references resolve without warnings, and the chart has meaningful alternative text.
- The standalone SA2 preview was generated with R and exported as a self-contained htmlwidget.
- The local update helper was exercised end to end, including rendering to a temporary directory, source ZIP generation, canonical URLs, publication, and removal of redundant generated libraries. Normal Astro builds use the supplied rendered HTML and require no R installation.

## Data checks

373 unique, valid, non-empty Greater Sydney SA2 geometries. All population codes match in both directions; the 2025 sum is **5,638,830**, matching the published ABS total. The annual series has **1,865 unique area/year records**. All **1,033** retained school points match exactly one full-resolution SA2; **29** lack reported FTE and are explicitly excluded from quantitative point views. No invalid school coordinates or multiple polygon memberships were found in the source selection. The original raster resolution is **1,000 metres in EPSG:3577**. Raster display classes use documented thresholds, a categorical colour table, and nearest-neighbour rendering.

## Browser checks

Chrome for Testing 131 with Playwright, desktop 1440 × 1000 and mobile 390 × 844. All **13 tutorial map outputs** rendered: 12 individual widgets and a swipe comparison with two map contexts. The native resource-page preview and starter map also rendered.

Checked a real Glebe Public School popup (193 latest reported FTE), category filtering, SA2 boundary visibility, the year slider filtering to 2025, numbered school clusters and click-to-zoom, the 2021/2025 swipe handle, and raster nearest-neighbour sampling. Source and data downloads resolve; the tutorial source download matches the authored QMD. Full legend units and reference years remain visible, and the tutorial and native resource fit mobile screens.

The resource appears automatically in the existing resource listing and search index. Its unsupported browser-R buttons are disabled; the published maps remain interactive JavaScript widgets. R editing and execution take place in the downloadable Quarto project.

No page errors, console errors, or HTTP error responses occurred. One Google Fonts request was cancelled during page navigation; no basemap or map-control error occurred.

## Website and preservation

`npm run verify` completed successfully: Astro check reported **0 errors, 0 warnings, and 0 hints**; the site built; all internal links in **30 HTML files** resolved; and the existing baseline accessibility/metadata audit passed for all 30. The legend presentation adjustment was followed by another HTML audit and browser interaction check.

All **121 original website source files** were compared by SHA-256 against the supplied ZIP and remain byte-for-byte identical. The installation ZIP contains only new paths; it contains no original website files, repository history, dependencies, or build directory. Native listing/search updates come from the existing content-collection mechanism.

## Scope of optional examples

The optional PDF/Word static-export pattern needs chromote and Chrome/Chromium and was not executed. The optional live-source refresh script was syntax-checked but not rerun; it additionally requires readxl and internet access. Later NSW snapshots may change. The supplied reports render from bundled prepared data without refreshing sources.

Maps require browser WebGL and internet access for the remote basemap. Embedded dependencies do not make remote tiles available offline. See the data guide for source periods, licences, preparation, and interpretive limits.

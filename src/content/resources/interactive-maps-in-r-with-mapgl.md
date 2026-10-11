---
title: "Interactive maps in R with mapgl"
description: "Use real Greater Sydney SA2 polygons, ABS population data, and NSW school locations to build interactive maps for a DATA1X01 Project 2 Quarto report, from your first map to advanced controls."
category: Visualisation
tags: [R, mapgl, geospatial, SA2, Sydney, Quarto, DATA1X01]
published: 2026-10-11
level: Introductory
software: [R, Quarto]
estimatedMinutes: 90
featured: true
template: true
draft: false
browserR: false
downloadableAssets:
  - label: "Complete executable tutorial and Sydney data"
    href: /resources/mapgl/downloads/mapgl-tutorial-source.zip
    description: "Quarto sources, prepared real data, source snapshots, and scripts. Extract the whole folder before running the examples."
  - label: "Tutorial Quarto source (.qmd.txt)"
    href: /resources/mapgl/downloads/index.qmd.txt
    description: "Save as index.qmd. The source bundle also supplies the data and configuration it requires."
  - label: "Project 2 starter (.qmd.txt)"
    href: /resources/mapgl/downloads/project2-starter.qmd.txt
    description: "Save as project2-starter.qmd inside the extracted source folder. Includes a real SA2 map, chart, and table."
  - label: "Sydney data guide and source attribution"
    href: /resources/mapgl/data/README.md
    description: "Sources, licences, fields, periods, missing values, and preparation steps."
---

I discovered **mapgl** while working with geospatial data at AstraZeneca, where I was building an in-house solution for sales territory and workforce planning for a new product and team launch. Interactive maps helped connect the analysis to decisions about where a team needed to work and how to organise its territory.

This tutorial brings those mapping techniques into **DATA1X01 Project 2**. You will start with a single location and progress to points, real SA2 polygons, choropleths, spatial joins, heatmaps, clustering, time sliders, swipe comparisons, 3D extrusion, and raster data. Each example includes executable R code and an actual interactive map.

**[Open the full tutorial and run through the maps →](/resources/mapgl/index.html)**

**[Open the rendered Project 2 starter report →](/resources/mapgl/project2-starter.html)**

## A real Sydney example

The preview below shows estimated resident population density across **373 Greater Sydney SA2s**, using the ABS June 2025 population estimates and matching ASGS 2021 boundaries. Drag to pan, zoom towards central Sydney, and click a polygon to inspect its values.

<iframe src="/resources/mapgl/sydney-sa2-preview.html" title="Interactive map of June 2025 population density by Greater Sydney SA2" loading="lazy" allow="fullscreen" style="width:100%;height:510px;border:1px solid #d4cabb;border-radius:12px;"></iframe>

[Open this map in its own page](/resources/mapgl/sydney-sa2-preview.html). Sources: [ABS Regional population, 2024–25](https://www.abs.gov.au/statistics/people/population/regional-population/2024-25) and [ASGS Edition 3](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026). Population density is calculated as estimated residents divided by official ABS area in km². The 2025 estimates are preliminary.

Greater Sydney includes the Central Coast and Blue Mountains; it is broader than the City of Sydney council area. SA2s are statistical areas, rather than school catchments or necessarily suburbs. The source bundle retains full-resolution analytical boundaries and a smaller display copy.

The point examples use **1,033 real government education locations** from the [NSW Department of Education master dataset](https://data.nsw.gov.au/data/dataset/nsw-education-nsw-public-schools-master-dataset), extracted 2 October 2026. The raster example uses the **real ABS 2025 population grid**. The tutorial explains missing enrolment values, differing reference periods, and the limits of interpreting these datasets together.

## Run the R code in your own Quarto report

Download and extract the complete source bundle. Open its folder in RStudio, install the required packages once, then run `quarto preview` or `quarto render` from that folder. The included Project 2 starter is an executable HTML report with a choropleth, supporting chart, table, and interpretation scaffold.

For example, this code joins the real population table to the SA2 boundaries and draws a basic polygon map:

```r
library(mapgl)
library(sf)
library(dplyr)
library(readr)

areas <- st_read("data/greater-sydney-sa2-display.geojson", quiet = TRUE)
population <- read_csv("data/sydney-sa2-population.csv",
                       col_types = cols(sa2_code = col_character()))
areas <- left_join(areas, select(population, sa2_code, population_2025),
                   by = "sa2_code") |>
  mutate(density = population_2025 / area_km2)

maplibre(style = openfreemap_style("positron"), bounds = areas,
         projection = "mercator", height = 480, scrollZoom = FALSE) |>
  add_fill_layer(
    id = "sa2-density", source = areas,
    fill_color = interpolate("density", values = c(0, 5000, 25000),
                             stops = c("#f7fbff", "#6baed6", "#08306b")),
    fill_opacity = 0.85, fill_outline_color = "#526478", popup = "sa2_name"
  ) |>
  add_navigation_control()
```

The full tutorial adds join validation, units, a legend, informative popups, and guidance on interpretation. The published examples were generated by running R during Quarto rendering; their map controls run in your browser. To edit and rerun the R code, use the downloaded source in RStudio. An internet connection is needed for the OpenFreeMap basemap.

## Choose a useful extension

| Your question or data | Tutorial sections |
|---|---|
| Where are observations located? | First map, CSV coordinates, point layers, popups |
| How do categories and quantities vary? | Interactive category legends and proportional circle areas |
| How does an area statistic vary across Sydney? | SA2 joins, population density, continuous and classified choropleths |
| Which area contains each point? | Spatial joins using full-resolution boundaries |
| How can I inspect crowded points? | Heatmaps and count-labelled clustering |
| How does population change over time? | Annual population slider and 2021/2025 swipe comparison |
| What else can mapgl display? | 3D population extrusion and the ABS population raster |
| How do I submit a reproducible map? | Quarto rendering, captions, cross-references, static export, troubleshooting |

Use one map that helps answer your project question, and support it with a specific finding, a source citation, and a chart or table where precise comparison matters. Follow the assessment instructions for your data and submission format.

The tutorial is informed by [Kyle Walker's mapgl documentation](https://walker-data.com/mapgl/) and was tested with mapgl 0.5.2. Data attribution and preparation are documented in the downloadable bundle.

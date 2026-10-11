# Export a standalone, self-contained preview. Run from the tutorial folder.
library(mapgl)
library(sf)
library(dplyr)
library(readr)
areas <- st_read("data/greater-sydney-sa2-display.geojson", quiet = TRUE)
population <- read_csv("data/sydney-sa2-population.csv",
  col_types = cols(sa2_code = col_character()))
areas <- left_join(areas, select(population, sa2_code, population_2025),
                    by = "sa2_code") |>
  mutate(density = population_2025 / area_km2,
    popup_html = paste0("<strong>", htmltools::htmlEscape(sa2_name), "</strong><br>",
      "June 2025 population: ", population_2025,
      "<br>Density: ", sprintf("%.0f residents/km²", density)))
map <- maplibre(style = openfreemap_style("positron"),
  center = c(151.05, -33.88), zoom = 9.4, projection = "mercator",
  height = 390, scrollZoom = FALSE) |>
  add_fill_layer(id = "sa2-density-preview", source = areas,
    fill_color = interpolate("density", values = c(0, 5000, 25000),
      stops = c("#f7fbff", "#6baed6", "#08306b")),
    fill_opacity = 0.85, fill_outline_color = "#526478",
    tooltip = "sa2_name", popup = "popup_html") |>
  add_continuous_legend(legend_title = "June 2025 · residents per km²",
    values = c(0, 5000, 25000), colors = c("#f7fbff", "#6baed6", "#08306b"),
    position = "bottom-left") |>
  add_navigation_control() |>
  add_fullscreen_control()
dir.create("exports", showWarnings = FALSE)
htmlwidgets::saveWidget(map, "exports/sydney-sa2-preview.html", selfcontained = TRUE,
                         title = "Greater Sydney SA2 population density")

# The HTML embeds these dependencies; remove the redundant generated copy.
unlink("exports/sydney-sa2-preview_files", recursive = TRUE)

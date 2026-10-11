# Run from this source folder: Rscript R/prepare-sydney-data.R
# Rebuild teaching files from the bundled official-source snapshots.
library(sf)
library(dplyr)
library(readr)
dir.create("data", showWarnings = FALSE)
areas <- st_read("data/raw/sa2-original.geojson", quiet = TRUE) |>
  rename(sa2_code = sa2_code_2021, sa2_name = sa2_name_2021,
         sa3_name = sa3_name_2021, sa4_name = sa4_name_2021,
         area_km2 = area_albers_sqkm) |>
  st_transform(4326)
stopifnot(nrow(areas) == 373L, !anyDuplicated(areas$sa2_code),
          all(st_is_valid(areas)), !any(st_is_empty(areas)),
          all(areas$area_km2 > 0))
# Full resolution, before any display simplification, is used for spatial joins.
st_write(areas, "data/greater-sydney-sa2.gpkg", layer = "sa2",
         delete_dsn = TRUE, quiet = TRUE)
# A 25 m display tolerance reduces browser payload. Keep official ABS area values.
display <- areas |> st_transform(28356) |>
  st_simplify(dTolerance = 25, preserveTopology = TRUE) |> st_transform(4326)
stopifnot(all(st_is_valid(display)), !any(st_is_empty(display)))
st_write(display, "data/greater-sydney-sa2-display.geojson",
         delete_dsn = TRUE, quiet = TRUE)
population <- read_csv("data/raw/abs-population-wide.csv",
  col_types = cols(sa2_code = col_character()))
stopifnot(setequal(areas$sa2_code, population$sa2_code),
          !anyDuplicated(population$sa2_code),
          sum(population$population_2025) == 5638830L)
write_csv(population, "data/sydney-sa2-population.csv")
long <- bind_rows(lapply(2021:2025, function(y) {
  data.frame(sa2_code = population$sa2_code, year = y,
             population = population[[paste0("population_", y)]])
}))
write_csv(long, "data/sydney-sa2-population-long.csv")
raw <- read_csv("data/raw/schools-original.csv", show_col_types = FALSE,
                na = c("", "NA", "np"))
points_table <- raw |>
  transmute(school_code = as.character(School_code),
            name = School_name, school_type = Level_of_schooling,
            enrolment_fte = latest_year_enrolment_FTE,
            longitude = Longitude, latitude = Latitude,
            date_extracted = as.character(Date_extracted))
valid_xy <- with(points_table, is.finite(longitude) & is.finite(latitude) &
  longitude >= -180 & longitude <= 180 & latitude >= -90 & latitude <= 90)
points <- st_as_sf(points_table[valid_xy, ],
  coords = c("longitude", "latitude"), crs = 4326, remove = FALSE)
# Classify within projected original polygons, never the display copy.
links <- st_within(st_transform(points, 28356), st_transform(areas, 28356))
stopifnot(all(lengths(links) <= 1L))
in_sydney <- lengths(links) == 1L
schools <- points[in_sydney, ]
stopifnot(!anyDuplicated(schools$school_code))
write_csv(st_drop_geometry(schools), "data/sydney-public-schools.csv")
# Clip the original ABS 1 km grid on its native equal-area grid.
source_grid <- terra::rast("data/raw/abs-population-grid-2025.tif")
region <- terra::vect(st_transform(areas, terra::crs(source_grid)))
sydney_grid <- terra::crop(source_grid, region) |> terra::mask(region)
names(sydney_grid) <- "population_density_2025"
terra::writeRaster(sydney_grid, "data/sydney-population-grid-2025.tif",
                   overwrite = TRUE, gdal = "COMPRESS=LZW")
summary <- list(
  retrieved = jsonlite::fromJSON("data/raw/retrieval.json")$retrieved, sa2_areas = nrow(areas),
  population_2021 = sum(population$population_2021),
  population_2025 = sum(population$population_2025),
  schools_in_nsw_snapshot = nrow(raw), invalid_school_coordinates = sum(!valid_xy),
  schools_in_greater_sydney = nrow(schools),
  schools_outside_greater_sydney = sum(!in_sydney),
  school_types = as.list(table(schools$school_type)),
  missing_enrolment_fte = sum(is.na(schools$enrolment_fte)),
  school_snapshot_dates = sort(unique(schools$date_extracted)),
  original_grid_crs = "EPSG:3577", original_grid_resolution_metres = terra::res(source_grid),
  display_simplification_metres = 25,
  grid_max = as.numeric(terra::global(sydney_grid, "max", na.rm = TRUE)[1, 1])
)
jsonlite::write_json(summary, "data/preparation-summary.json", auto_unbox = TRUE,
                     pretty = TRUE)
print(summary)
print(schools |> filter(grepl("Glebe Public", name)) |> st_drop_geometry())
print(left_join(areas, population |> select(-sa2_name), by = "sa2_code") |>
  mutate(density = population_2025 / area_km2) |> st_drop_geometry() |>
  arrange(desc(density)) |> select(sa2_name, population_2025, area_km2, density) |> head(10))

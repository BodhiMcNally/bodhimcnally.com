# OPTIONAL: refresh source snapshots. Run from the mapgl-source folder.
# The report itself uses bundled prepared data and does not need readxl.
# Install once in the Console: install.packages("readxl")
library(sf)
library(dplyr)
library(readr)
if (!requireNamespace("readxl", quietly = TRUE))
  stop("Install the optional readxl package before refreshing original sources.")
dir.create("data/raw", recursive = TRUE, showWarnings = FALSE)
base <- "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/SA2/MapServer/0"
fields <- paste(c("sa2_code_2021", "sa2_name_2021", "sa3_name_2021",
                   "sa4_name_2021", "area_albers_sqkm"), collapse = ",")
query <- paste0(base, "/query?where=", URLencode("gccsa_code_2021='1GSYD'", reserved = TRUE),
  "&outFields=", URLencode(fields, reserved = TRUE),
  "&outSR=4326&f=geojson&returnGeometry=true&geometryPrecision=6",
  "&orderByFields=sa2_code_2021")
download.file(query, "data/raw/sa2-original.geojson", mode = "wb")
download.file(paste0(base, "?f=pjson"), "data/raw/sa2-service.json", mode = "wb")
abs_base <- "https://www.abs.gov.au/statistics/people/population/regional-population/2024-25/"
xlsx <- tempfile(fileext = ".xlsx")
download.file(paste0(abs_base, "32180DS0003_2001-25.xlsx"), xlsx, mode = "wb")
# Fixed-release layout: A:J identifies geography; K:AI contains 2001:2025.
x <- readxl::read_excel(xlsx, sheet = "Table 1", range = "A7:AI2465",
                        col_names = FALSE, col_types = "text")
x <- x |> filter(.data[[names(x)[3]]] == "1GSYD")
wide <- data.frame(sa2_code = x[[9]], sa2_name = x[[10]])
for (year in 2021:2025)
  wide[[paste0("population_", year)]] <- as.numeric(x[[year - 2001 + 11]])
stopifnot(nrow(wide) == 373, !anyDuplicated(wide$sa2_code))
write_csv(wide, "data/raw/abs-population-wide.csv")
catalogue <- jsonlite::fromJSON(
  "https://data.nsw.gov.au/data/api/3/action/package_show?id=nsw-education-nsw-public-schools-master-dataset",
  simplifyVector = FALSE)
jsonlite::write_json(catalogue, "data/raw/schools-metadata.json",
                     auto_unbox = TRUE, pretty = TRUE)
for (r in catalogue$result$resources) {
  if (r$id == "3e6d5f6a-055c-440d-a690-fc0537c31095")
    download.file(r$url, "data/raw/schools-original.csv", mode = "wb")
  if (r$id == "2464b669-1d48-439e-9e7c-cb8a229f5462")
    download.file(r$url, "data/raw/schools-dictionary.csv", mode = "wb")
}
grid_zip <- tempfile(fileext = ".zip")
grid_dir <- tempfile(); dir.create(grid_dir)
download.file(paste0(abs_base, "GEOTIFF.zip"), grid_zip, mode = "wb")
unzip(grid_zip, exdir = grid_dir)
file.copy(file.path(grid_dir, "apgr25_1_0_0.tif"),
          "data/raw/abs-population-grid-2025.tif", overwrite = TRUE)
file.copy(file.path(grid_dir, "apg25r_1_0_0_19115-3_metadata.xml"),
          "data/raw/abs-grid-metadata.xml", overwrite = TRUE)
jsonlite::write_json(list(retrieved = as.character(Sys.Date())),
                     "data/raw/retrieval.json", auto_unbox = TRUE, pretty = TRUE)
message("Sources refreshed. Run R/prepare-sydney-data.R, review counts/periods, then rerender.")

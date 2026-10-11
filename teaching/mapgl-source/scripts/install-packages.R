# Run once, from the tutorial folder: Rscript scripts/install-packages.R
# Quarto is a separate application: https://quarto.org/docs/get-started/
if (getRversion() < "4.1.0") stop("Use R 4.1 or later for the native |> pipe.")
options(repos = c(CRAN = "https://cloud.r-project.org"))
packages <- c("mapgl", "sf", "dplyr", "readr", "htmltools", "htmlwidgets",
              "terra", "viridisLite", "knitr", "rmarkdown", "jsonlite")
missing <- packages[!vapply(packages, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) install.packages(missing)
if (utils::packageVersion("mapgl") < "0.5.2") install.packages("mapgl")
if (utils::packageVersion("mapgl") < "0.5.2") {
  stop("mapgl 0.5.2 or later is required. Restart R and rerun this script.")
}
message("Required packages are installed. Run: quarto preview")

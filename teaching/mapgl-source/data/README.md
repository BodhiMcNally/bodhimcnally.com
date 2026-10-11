# Real Sydney data for the mapgl tutorial

Prepared by Bodhi McNally for DATA1X01 teaching. Source retrieval: **11 October 2026**. All observations, school locations, and boundaries are real. The tutorial adds derived densities, display radii, school groups, and raster classes; it does not simulate observations.

## Sources and attribution

1. **Australian Bureau of Statistics (ABS), ASGS Edition 3 SA2 boundaries (2021).**
   [ASGS standard](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026).
   [Boundary service](https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/SA2/MapServer/0).
   Query: `gccsa_code_2021 = '1GSYD'`, output WGS84 GeoJSON.
   This is Greater Sydney GCCSA, including the Central Coast and Blue Mountains, not the City of Sydney LGA. SA2s are statistical areas, not school catchments or necessarily suburbs.

2. **ABS, Regional population 2024–25**, released 31 March 2026.
   [Publication](https://www.abs.gov.au/statistics/people/population/regional-population/2024-25).
   [Original Excel table: Population estimates by SA2 and above, 2001 to 2025](https://www.abs.gov.au/statistics/people/population/regional-population/2024-25/32180DS0003_2001-25.xlsx).
   Table 1, Greater Sydney rows, 2021–2025 columns; population at **30 June** each year on ASGS 2021 geography. ERP is Estimated Resident Population, rather than a raw Census count. 2021 is final, 2022–2024 revised, and 2025 preliminary in this release.
   [Methodology](https://www.abs.gov.au/methodologies/regional-population-methodology/2024-25).

3. **NSW Department of Education, Master dataset: NSW government school locations and student enrolment numbers**.
   [Dataset and dictionary](https://data.nsw.gov.au/data/dataset/nsw-education-nsw-public-schools-master-dataset).
   [Original CSV](https://data.nsw.gov.au/data/dataset/78c10ea3-8d04-4c9c-b255-bbf8547e37e7/resource/3e6d5f6a-055c-440d-a690-fc0537c31095/download/master_dataset.csv).
   Snapshot extracted **2 October 2026**, downloaded 11 October. National Schools Collection enrolments are generally FTE and relate to an August census, updated annually in December. `Date_extracted` is not the observation date for all columns. The source contains **no enrolment-year field**, so the tutorial labels the quantity “latest reported FTE enrolment” and does not assert that it is a 2026 measurement. Environmental education centres, infants schools, schools for specific purposes, and other government sites are retained. Non-government schools are outside the source's coverage.

4. **ABS, Australian population grid 2025**, accompanying Regional population 2024–25.
   [Original GeoTIFF ZIP](https://www.abs.gov.au/statistics/people/population/regional-population/2024-25/GEOTIFF.zip).
   Original file `apgr25_1_0_0.tif`: one continuous band of modelled **residents/km²**, 1,000 × 1,000 metre cells in GDA94 / Australian Albers (EPSG:3577). The ABS apportions SA1 ERP using residential address information and related locations, then sums to grid cells. This is modelled data, not an observation of each household. Its original metadata is retained in `raw/abs-grid-metadata.xml`.

ABS data are attributed under **Creative Commons Attribution 4.0**, subject to the [ABS copyright policy](https://www.abs.gov.au/website-privacy-copyright-and-disclaimer). The school catalogue lists **Creative Commons Attribution**; its catalogue metadata is preserved in `raw/schools-metadata.json`. Prepared subsets and display transformations are by Bodhi McNally. Retain both source attribution and the description of modifications when reusing the files. Basemap attribution is separate: OpenFreeMap/OpenStreetMap, as displayed on each map.

## Prepared files and fields

| File | Contents |
|---|---|
| `greater-sydney-sa2.gpkg` | Full-resolution boundaries in layer `sa2`, WGS84, for analytical spatial joins |
| `greater-sydney-sa2-display.geojson` | Same 373 areas, simplified by 25 metres in EPSG:28356 and returned to WGS84, for display |
| `sydney-sa2-population.csv` | One record per SA2; `sa2_code`, `sa2_name`, `population_2021` through `population_2025` |
| `sydney-sa2-population-long.csv` | 1,865 records: `sa2_code`, numeric `year`, `population`; one area/year pair per record |
| `sydney-public-schools.csv` | 1,033 locations: `school_code`, `name`, `school_type`, `enrolment_fte`, `longitude`, `latitude`, `date_extracted` |
| `sydney-population-grid-2025.tif` | Cropped and masked numeric ABS grid, retaining original values and native 1 km grid |
| `preparation-summary.json` | Record counts, missing values, dates, and grid information |
| `SHA256SUMS.txt` | Checksums for all bundled data and source snapshots |
| `raw/` | Official-source snapshots and the extracted ABS population table, included in the downloadable source ZIP |

Boundary attributes are `sa2_code` (character identifier), `sa2_name`, `sa3_name`, `sa4_name`, and `area_km2` (official ABS `area_albers_sqkm`). **Use that official area field** for density; display simplification is not a replacement analytical geometry.

School coordinates are published as latitude/longitude in decimal degrees. The dictionary does not specify a geodetic datum; the tutorial treats them as WGS84 web coordinates for teaching. This assumption is unsuitable for surveying or legal boundary determinations. Published locations can also contain ordinary source inaccuracies.

## Processing and exclusions

Run `Rscript R/prepare-sydney-data.R` from the source folder to rebuild prepared files from the bundled snapshots. To fetch sources again, install the optional `readxl` package and run `Rscript scripts/fetch-sydney-data.R`, then rerun preparation. The school source is live: a later download may differ, so record a new snapshot date and review the tutorial's fixed counts and findings before publishing an update.

- Selected 373 ABS polygons belonging to Greater Sydney; no polygon was dropped. All codes are unique and geometries valid and non-empty.
- Extracted exactly the corresponding Greater Sydney population rows. Both directions of the code join match; the 2025 population sum is **5,638,830**, matching the published Greater Sydney total.
- School source has **2,210 rows** and no invalid coordinates under the tutorial's finite/range checks. Spatial selection with `st_within()` in EPSG:28356 retained 1,033 Greater Sydney locations; 1,177 outside the region were excluded. No source point matched multiple SA2s. Kept a small set of public fields and preserved the source school types.
- **29 retained locations have no enrolment figure**. They remain in location maps, heatmaps, clustering, and spatial counts; they are excluded from the proportional-enrolment and quick quantitative maps. Missing enrolment is never replaced with zero.
- School display groups are derived explicitly: primary/infants, secondary, and all other government education types. Popups retain the original type.
- Cropped/masked the population grid in its native equal-area CRS; no resampling of the analytical GeoTIFF. Region edges remain approximate at cell resolution; totals need not match exact polygon totals.
- Raster display classes are zero, >0–<500, 500–<2,000, 2,000–<5,000, 5,000–<8,000, and ≥8,000 residents/km². Classification occurs before display reprojection and uses nearest-neighbour rendering. Missing/masked cells are transparent.

Population density is an area average. School counts and resident population concern different populations and periods; their ratio alone is not a measure of school access, adequacy, capacity, or individual demand.

---
title: "Beautiful tables in R: kable, kableExtra, gt, gtsummary and gtExtras"
description: Choose the right R table system, format numbers and labels deliberately, build descriptive and regression tables, and export accessible publication-ready output.
category: R
tags: [tables, kable, kableExtra, gt, gtsummary, gtExtras]
published: 2026-09-07
level: Intermediate
software: [R, Quarto]
estimatedMinutes: 65
featured: true
template: false
draft: false
browserR: false
downloadableAssets: []
---

A good table is an argument made visible. It should let the reader identify the population, comparison, units, denominators and uncertainty without reverse-engineering the data frame that produced it.

This resource covers five related tools:

- `knitr::kable()` for small, portable tables;
- `kableExtra` for styling and structure around a `kable` table;
- `gt` for composing a display table from defined parts;
- `gtsummary` for analytical summaries and model results; and
- `gtExtras` for optional visual elements added to `gt` tables.

Package-heavy examples are intended primarily for RStudio and Quarto. The browser R runner can execute ordinary R, but availability and rendering of HTML table packages may vary.

## Begin with table-ready data

Formatting cannot repair an unclear analysis table. Construct one row per intended table row and one column per displayed quantity.

```r
summary_data <- data.frame(
  group = c("Control", "Intervention"),
  n = c(120, 118),
  age_mean = c(61.24, 60.87),
  age_sd = c(8.91, 9.16),
  event_n = c(24, 15)
)

summary_data$event_percent <- 100 * summary_data$event_n / summary_data$n
summary_data
```

Keep numeric columns numeric until presentation. Early conversion to strings such as `"20.0%"` prevents correct sorting, colour scales and later calculations.

## Choosing a table system

| Need | Sensible starting point |
| --- | --- |
| A compact data frame in HTML, PDF or Word | `knitr::kable()` |
| Spanners, grouped rows and styling around `kable()` | `kableExtra` |
| A carefully composed display table | `gt` |
| Baseline characteristics or regression results | `gtsummary` |
| Sparklines, bars and other in-cell additions | `gtExtras` |

Do not combine packages merely to make the pipeline longer. Choose the system whose data model matches the table.

## `knitr::kable()`: a dependable foundation

```r
knitr::kable(
  summary_data,
  digits = c(0, 0, 1, 1, 0, 1),
  col.names = c("Group", "N", "Mean age", "SD", "Events", "Events (%)"),
  caption = "Participant characteristics by study group",
  align = c("l", "r", "r", "r", "r", "r")
)
```

Useful arguments include:

- `digits` for numeric precision;
- `col.names` for reader-facing labels;
- `align` for column alignment;
- `caption` for the table title; and
- `format` when output must be forced to HTML, LaTeX, pipe or another supported form.

Right-align quantities so readers can compare magnitudes. Left-align prose. Use decimal places to represent meaningful precision, not the precision stored by the computer.

## Extend `kable()` with `kableExtra`

```r
library(kableExtra)

summary_data |>
  knitr::kable(
    format = "html",
    digits = 1,
    col.names = c("Group", "N", "Mean", "SD", "n", "%"),
    caption = "Participant characteristics by study group"
  ) |>
  add_header_above(c(" " = 2, "Age (years)" = 2, "Outcome" = 2)) |>
  kable_styling(
    bootstrap_options = c("striped", "hover"),
    full_width = FALSE,
    position = "left"
  ) |>
  column_spec(1, bold = TRUE)
```

The pipe reads as a sequence: make the table, add a grouped header, choose broad styling, then target a column. Keep the styling restrained; repeated borders, colour and bolding compete with the values.

### Conditional formatting

```r
summary_data |>
  transform(
    event_percent = cell_spec(
      round(event_percent, 1),
      color = ifelse(event_percent > 15, "#6e2538", "#214c57"),
      bold = TRUE
    )
  ) |>
  knitr::kable(format = "html", escape = FALSE) |>
  kable_styling(full_width = FALSE)
```

When `escape = FALSE`, HTML is allowed through. Use it only with content you control; untrusted text could contain unwanted markup.

### HTML and PDF are different targets

Some `kableExtra` styling maps to both HTML and LaTeX, while other behaviour is format-specific. Test the actual output format early. A table that works in an HTML preview may overflow or need LaTeX packages in PDF.

## The anatomy of a `gt` table

`gt` starts with data and builds a display table from components: header, column labels, body, stub, row groups, spanners, footnotes and source notes.

```r
library(gt)

summary_data |>
  gt(rowname_col = "group") |>
  tab_header(
    title = "Participant characteristics",
    subtitle = "Summary by allocated group"
  ) |>
  tab_spanner(
    label = "Age (years)",
    columns = c(age_mean, age_sd)
  ) |>
  tab_spanner(
    label = "Primary event",
    columns = c(event_n, event_percent)
  ) |>
  cols_label(
    n = "N",
    age_mean = "Mean",
    age_sd = "SD",
    event_n = "n",
    event_percent = "%"
  ) |>
  fmt_number(columns = c(age_mean, age_sd, event_percent), decimals = 1) |>
  tab_source_note("Values are illustrative.")
```

### Format by meaning

```r
financial <- data.frame(
  service = c("A", "B", "C"),
  cost = c(1203.4, 987.2, 1510.8),
  proportion = c(0.42, 0.37, 0.21),
  date = as.Date(c("2026-01-10", "2026-02-14", "2026-03-03"))
)

financial |>
  gt() |>
  fmt_currency(columns = cost, currency = "AUD") |>
  fmt_percent(columns = proportion, decimals = 0) |>
  fmt_date(columns = date, date_style = "d MMM y")
```

The stored proportions remain 0–1; `fmt_percent()` controls display. This is preferable to multiplying and pasting percent symbols into the underlying data.

### Footnotes and missing values

```r
summary_data |>
  gt() |>
  sub_missing(missing_text = "Not available") |>
  tab_footnote(
    footnote = "SD = standard deviation.",
    locations = cells_column_labels(columns = age_sd)
  )
```

Do not silently convert missing values to zero. “Not measured”, “not applicable” and “suppressed” may require different labels.

### Targeted styling

```r
summary_data |>
  gt() |>
  tab_style(
    style = cell_text(weight = "bold", color = "#6e2538"),
    locations = cells_body(columns = event_percent, rows = event_percent > 15)
  ) |>
  tab_options(
    table.font.names = c("Ubuntu", "Arial", "sans-serif"),
    table.border.top.color = "#6e2538",
    data_row.padding = px(7)
  )
```

Conditional styling should encode a meaningful rule that is stated or obvious. Avoid colouring cells merely because the package can.

## `gtsummary` for descriptive Table 1

```r
library(gtsummary)

trial |>
  select(trt, age, grade, response) |>
  tbl_summary(
    by = trt,
    missing = "ifany",
    statistic = list(
      all_continuous() ~ "{mean} ({sd})",
      all_categorical() ~ "{n} ({p}%)"
    ),
    label = list(
      age ~ "Age (years)",
      grade ~ "Tumour grade",
      response ~ "Treatment response"
    )
  ) |>
  add_overall() |>
  bold_labels()
```

`tbl_summary()` chooses summaries according to variable type. Inspect those types and override defaults deliberately. A numeric variable containing category codes should usually be converted to a factor before summarising.

### Adding comparisons

```r
trial |>
  select(trt, age, grade, response) |>
  tbl_summary(by = trt) |>
  add_p() |>
  add_n() |>
  bold_labels()
```

`add_p()` is not automatically desirable. Baseline significance testing in a randomised trial is generally uninformative because allocation generated the groups. In an observational table, p-values do not measure confounding or decide adjustment. Include comparisons only when they answer a stated question.

### Regression tables

```r
fit <- glm(response ~ age + grade + trt, data = trial, family = binomial)

fit |>
  tbl_regression(
    exponentiate = TRUE,
    label = list(age ~ "Age (years)", grade ~ "Tumour grade", trt ~ "Treatment")
  ) |>
  bold_labels()
```

With a logistic model and `exponentiate = TRUE`, coefficients appear as odds ratios. The display transformation does not change what the model estimates. State the reference categories and adjustment set.

### Combine models

```r
model_1 <- lm(marker ~ age + trt, data = trial)
model_2 <- glm(response ~ age + trt, data = trial, family = binomial)

tbl_merge(
  tbls = list(
    tbl_regression(model_1),
    tbl_regression(model_2, exponentiate = TRUE)
  ),
  tab_spanner = c("**Continuous outcome**", "**Binary outcome**")
)
```

Combine models only when side-by-side comparison helps. A dense wall of coefficients is not made clearer merely by placing it inside one table.

## Additions with `gtExtras`

`gtExtras` extends `gt` with functions such as in-cell bars, point plots and sparklines. These can be useful for compact descriptive displays.

```r
library(gt)
library(gtExtras)

summary_data |>
  gt() |>
  gt_plt_bar(
    column = event_percent,
    color = "#214c57",
    keep_column = TRUE
  ) |>
  cols_label(event_percent = "Events (%)")
```

An in-cell graphic should support the exact numeric value, not replace it. Consider whether the result still works in PDF, grayscale, screen readers and narrow layouts.

## Exporting tables

```r
table_object <- summary_data |>
  gt() |>
  fmt_number(columns = where(is.numeric), decimals = 1)

gtsave(table_object, "participant-table.html")
# gtsave(table_object, "participant-table.png")
# gtsave(table_object, "participant-table.docx")
```

Available export types and dependencies vary. Inspect the saved file rather than assuming it matches the Viewer pane.

## Accessibility and editorial checks

Before publishing, ask:

- Does the caption state what population and comparison the table represents?
- Are counts accompanied by denominators where needed?
- Are units in labels rather than repeated in every cell?
- Are abbreviations expanded in footnotes?
- Are reference groups explicit?
- Can colour-coded meaning also be understood from text or symbols?
- Is rounding consistent with measurement precision?
- Are suppressed or missing values explained?
- Does the table remain usable on a phone and when printed?

## Useful official references

- [The `gt` reference](https://gt.rstudio.com/reference/index.html)
- [`gtsummary` table-summary tutorial](https://www.danieldsjoberg.com/gtsummary/articles/tbl_summary.html)
- [`knitr::kable()` and `kableExtra`](https://bookdown.org/yihui/rmarkdown-cookbook/tables.html)

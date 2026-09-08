---
title: "Interactive visualisation with Plotly in R"
description: Build purposeful interactive charts in R with plot_ly() and ggplotly(), customise hover information, compose figures and publish self-contained HTML widgets.
category: Visualisation
tags: [Plotly, R, interactive visualisation, ggplot2, htmlwidgets]
published: 2026-09-07
level: Intermediate
software: [R, Quarto]
estimatedMinutes: 55
featured: true
template: false
draft: false
browserR: true
downloadableAssets: []
---

Interactivity is useful when it helps a reader inspect values, compare subsets or navigate dense data. It is not automatically an improvement over a clear static figure. Plotly’s R package creates browser-based graphics using Plotly.js and the `htmlwidgets` framework.

Select **Run R** above a code block to execute it with R in the browser. The resulting Plotly widget is then handed to Plotly.js and rendered as a genuinely interactive chart beneath the code. The first run is slower because the browser must load R, the packages and the JavaScript renderer. PDF and printed copies still need a static alternative.

## Two routes into Plotly

1. `plot_ly()` builds a Plotly figure directly.
2. `ggplotly()` converts a ggplot object into an interactive widget.

Use `plot_ly()` when interaction is central and you want direct control over traces. Use `ggplotly()` when an existing ggplot already expresses the figure well and you need modest interactivity.

## Your first direct figure

```r
library(plotly)

plot_ly(
  data = mtcars,
  x = ~wt,
  y = ~mpg,
  type = "scatter",
  mode = "markers"
)
```

The tilde tells Plotly to evaluate a variable inside `data`. A **trace** is one visual layer or series.

## Map variables and write useful hover text

Default hover labels often expose internal variable names or irrelevant precision. Construct the text deliberately.

```r
cars <- transform(
  mtcars,
  model = row.names(mtcars),
  transmission = ifelse(am == 1, "Manual", "Automatic")
)

plot_ly(
  cars,
  x = ~wt,
  y = ~mpg,
  color = ~transmission,
  colors = c("#6e2538", "#214c57"),
  text = ~paste0(
    "<b>", model, "</b>",
    "<br>Weight: ", round(wt, 2), " (1,000 lb)",
    "<br>Fuel economy: ", mpg, " mpg"
  ),
  hoverinfo = "text",
  type = "scatter",
  mode = "markers",
  marker = list(size = 10, opacity = 0.8)
)
```

Avoid placing confidential identifiers in hover text. They remain present in the HTML widget even when not immediately visible.

## Titles, axes and layout

```r
figure <- plot_ly(cars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers") |>
  layout(
    title = list(text = "Fuel economy decreases as vehicle weight rises", x = 0.05),
    xaxis = list(title = "Weight (1,000 lb)", zeroline = FALSE),
    yaxis = list(title = "Fuel economy (mpg)", zeroline = FALSE),
    font = list(family = "Ubuntu, Arial, sans-serif", color = "#1c1918"),
    paper_bgcolor = "#f7f4ee",
    plot_bgcolor = "#f7f4ee",
    margin = list(l = 70, r = 25, t = 70, b = 65)
  )

figure
```

Plotly layout objects are nested lists. Use browser inspection and the official figure reference when you need an unfamiliar attribute.

## Add traces

```r
automatic <- subset(cars, transmission == "Automatic")
manual <- subset(cars, transmission == "Manual")

plot_ly() |>
  add_markers(
    data = automatic, x = ~wt, y = ~mpg,
    name = "Automatic", marker = list(color = "#6e2538")
  ) |>
  add_markers(
    data = manual, x = ~wt, y = ~mpg,
    name = "Manual", marker = list(color = "#214c57")
  ) |>
  layout(
    xaxis = list(title = "Weight (1,000 lb)"),
    yaxis = list(title = "Fuel economy (mpg)"),
    legend = list(orientation = "h", x = 0, y = 1.1)
  )
```

Layering explicit traces is useful when groups need different markers, hover templates or visibility controls.

## Convert a ggplot

```r
library(ggplot2)
library(plotly)

static_plot <- ggplot(
  cars,
  aes(
    x = wt,
    y = mpg,
    colour = transmission,
    text = paste0(model, "<br>", mpg, " mpg")
  )
) +
  geom_point(size = 3, alpha = 0.8) +
  scale_colour_manual(values = c("#6e2538", "#214c57")) +
  labs(x = "Weight (1,000 lb)", y = "Fuel economy (mpg)", colour = NULL) +
  theme_minimal(base_family = "Ubuntu")

ggplotly(static_plot, tooltip = "text")
```

`ggplotly()` translates rather than screenshots the plot. Some ggplot extensions and theme details do not translate exactly. Inspect the widget and adjust with Plotly’s `layout()` where necessary.

## Lines and time series

```r
set.seed(42)
weekly <- data.frame(
  week = rep(seq.Date(as.Date("2026-01-05"), by = "week", length.out = 12), 2),
  group = rep(c("A", "B"), each = 12),
  value = c(cumsum(rnorm(12, 0.4, 1)), cumsum(rnorm(12, 0.2, 1)))
)

plot_ly(
  weekly,
  x = ~week,
  y = ~value,
  color = ~group,
  colors = c("#6e2538", "#214c57"),
  type = "scatter",
  mode = "lines+markers"
)
```

Sort data by time within group before drawing lines. Otherwise a trace can connect observations in an unintended order.

## Bars, distributions and uncertainty

```r
estimates <- data.frame(
  outcome = c("Functional", "Perioperative", "Patient-reported"),
  estimate = c(0.72, 0.61, 0.78),
  lower = c(0.65, 0.54, 0.71),
  upper = c(0.79, 0.68, 0.85)
)

plot_ly(
  estimates,
  x = ~estimate,
  y = ~reorder(outcome, estimate),
  type = "scatter",
  mode = "markers",
  marker = list(color = "#6e2538", size = 10),
  error_x = list(
    type = "data",
    symmetric = FALSE,
    array = ~upper - estimate,
    arrayminus = ~estimate - lower
  )
) |>
  layout(xaxis = list(title = "Estimate"), yaxis = list(title = ""))
```

Hover does not replace visible uncertainty. A reader should not have to discover every confidence interval one point at a time.

## Facets and subplots

```r
p1 <- plot_ly(cars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers")
p2 <- plot_ly(cars, x = ~hp, y = ~mpg, type = "scatter", mode = "markers")

subplot(p1, p2, shareY = TRUE, titleX = TRUE, titleY = TRUE) |>
  layout(showlegend = FALSE)
```

Small multiples are often easier to compare than asking readers to toggle many traces. Preserve common scales when direct comparison matters.

## Control the mode bar

```r
figure |>
  config(
    displaylogo = FALSE,
    responsive = TRUE,
    modeBarButtonsToRemove = c("lasso2d", "select2d")
  )
```

Remove controls that do not serve the task, but retain zoom and image export when users genuinely need them. Avoid disabling interaction merely to make the chart look cleaner.

## Save and embed a widget

```r
htmlwidgets::saveWidget(
  figure,
  file = "fuel-economy.html",
  selfcontained = TRUE
)
```

A self-contained file is easy to share but can be large because its JavaScript dependencies are embedded. In Quarto, placing the widget as the final expression in a code cell usually renders it directly into HTML output.

## Accessibility and fallback output

Interactive charts require additional care:

- include an informative title, axis labels and units;
- provide a prose summary of the principal pattern;
- avoid depending on colour alone;
- keep hover targets large enough to acquire;
- limit decimal precision;
- provide a table or static figure where the exact values matter;
- test keyboard behaviour and zoomed layouts; and
- do not use interactivity to conceal an overcrowded figure.

PDF and Word cannot preserve an HTML widget’s interaction. Create a static ggplot or image for non-HTML output.

## Performance

Thousands of SVG points can become slow. Options include aggregation, sampling, hexagonal binning, or WebGL traces such as `scattergl`. Sampling must be transparent and should preserve the pattern relevant to the question.

```r
plot_ly(
  data = cars,
  x = ~wt,
  y = ~mpg,
  type = "scattergl",
  mode = "markers"
)
```

## Common mistakes

- Using hover labels instead of clear visible labels.
- Adding animation without a time or state question.
- Letting users compare values across changing axes.
- Embedding identifiable information in the widget source.
- Converting a complex ggplot and assuming every layer survived correctly.
- Publishing only an interactive output when the report also needs PDF or print.
- Using three-dimensional perspective for ordinary comparisons.

## Official references

- [Plotly for R](https://plotly.com/r/)
- [Plotly R figure reference](https://plotly.com/r/reference/)
- [Displaying Plotly figures](https://plotly.com/r/renderers/)

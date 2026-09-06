---
title: "ggplot2: from basics to publication-ready figures"
description: A practical guide to building, refining and reusing statistical graphics with ggplot2.
category: Visualisation
tags:
  - ggplot2
  - R
  - data visualisation
  - reproducibility
published: 2026-09-06
updated: 2026-09-06
level: Intermediate
software:
  - R
  - ggplot2
estimatedMinutes: 35
featured: true
template: false
draft: false
downloadableAssets: []
---

ggplot2 is easiest to learn as a system for constructing graphics rather than a collection of commands for making particular charts. Once the underlying grammar is clear, the same ideas transfer from a simple scatter plot to faceted distributions, model summaries and publication-ready figures.

The examples use datasets included with ggplot2. Select **Run R** above any code block to execute it in the browser. The first ggplot2 example may take a little longer because R and the package need to load.

## The basic grammar

Most ggplot2 figures contain at least three components:

1. **Data:** the data frame containing the observations.
2. **Aesthetic mappings:** the variables assigned to visual properties such as the x-position, y-position, colour or shape.
3. **A geometric layer:** the marks used to display the observations, such as points, lines or bars.

The components are joined with `+`.

```r
library(ggplot2)

p <- ggplot(
  data = mpg,
  mapping = aes(x = displ, y = hwy)
) +
  geom_point()

print(p)
```

Here, each row of `mpg` describes a car. Engine displacement is mapped to the horizontal position and highway fuel economy to the vertical position. `geom_point()` represents each row with a point.

The shorter form below is equivalent:

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point()

print(p)
```

The first form is useful while learning because it makes the role of each argument explicit. The shorter form is convenient once the structure is familiar.

## Mapping a variable versus setting a value

Code placed inside `aes()` creates a mapping from a variable to a visual property. Code placed outside `aes()` sets one appearance for the whole layer.

```r
library(ggplot2)

# Colour is mapped to the class variable
p_mapped <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2, alpha = 0.75) +
  labs(title = "Colour mapped to vehicle class")

# Colour is set to one value
p_set <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", size = 2, alpha = 0.75) +
  labs(title = "One colour set for every point")

print(p_mapped)
print(p_set)
```

The mapped version needs a legend because colour carries information. The set version does not. Accidentally writing `aes(colour = "blue")` asks ggplot2 to treat the word “blue” as a category; it does not simply colour the points blue.

Common aesthetics include:

- `x` and `y`;
- `colour` for lines and point borders;
- `fill` for the inside of bars, areas and many shapes;
- `shape`, `size` and `alpha`;
- `group` for observations that belong to the same line or polygon.

Use colour, shape and size deliberately. Mapping too many variables at once usually makes a figure harder to read.

## Choose a geometry for the question

The geometry should reflect both the type of variables and the comparison being made.

| Question | Useful starting geometry |
| --- | --- |
| How are two quantitative variables related? | `geom_point()` |
| How does a value change over an ordered variable or time? | `geom_line()` |
| What is the distribution of one quantitative variable? | `geom_histogram()` or `geom_density()` |
| How does a quantitative variable differ between groups? | `geom_boxplot()` or `geom_violin()` |
| How many observations belong to each category? | `geom_bar()` |
| How do already-calculated values compare? | `geom_col()` |

The distinction between `geom_bar()` and `geom_col()` matters. `geom_bar()` counts rows. `geom_col()` uses supplied y-values.

```r
library(ggplot2)

p_count <- ggplot(mpg, aes(class)) +
  geom_bar(fill = "#214c57") +
  labs(title = "Number of cars in each class", x = NULL, y = "Count")

mean_hwy <- aggregate(hwy ~ class, data = mpg, FUN = mean)

p_value <- ggplot(mean_hwy, aes(class, hwy)) +
  geom_col(fill = "#6e2538") +
  labs(title = "Mean highway fuel economy", x = NULL, y = "Mean MPG")

print(p_count)
print(p_value)
```

## Build figures in layers

Each geometry is a layer. Layers may use the plot's main aesthetic mappings or provide their own.

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", alpha = 0.45) +
  geom_smooth(
    method = "lm",
    formula = y ~ x,
    se = TRUE,
    colour = "#6e2538",
    fill = "#efe2e5"
  ) +
  labs(
    title = "Engine displacement and highway fuel economy",
    subtitle = "Linear fit with a 95% confidence band",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

The points show the observations. The line shows the fitted mean relationship, and the shaded band represents uncertainty in that estimated mean. It is not a prediction interval for individual cars.

Layer order matters. Later layers are drawn over earlier layers. Put broad intervals, reference regions and large marks first; put the observations or annotations that must remain visible later.

## Display distributions

A histogram divides a quantitative variable into bins and counts observations within each bin. The apparent shape can change when the bin width changes, so choose and report it rather than relying automatically on the default.

```r
library(ggplot2)

p <- ggplot(diamonds, aes(carat)) +
  geom_histogram(
    binwidth = 0.1,
    boundary = 0,
    fill = "#214c57",
    colour = "white"
  ) +
  coord_cartesian(xlim = c(0, 3)) +
  labs(
    title = "Distribution of diamond size",
    x = "Carat",
    y = "Count"
  )

print(p)
```

To compare a histogram with a density curve, map the histogram's y-axis to a computed density using `after_stat()`.

```r
library(ggplot2)

p <- ggplot(diamonds, aes(carat)) +
  geom_histogram(
    aes(y = after_stat(density)),
    binwidth = 0.1,
    boundary = 0,
    fill = "#abc1c4",
    colour = "white"
  ) +
  geom_density(colour = "#6e2538", linewidth = 1) +
  coord_cartesian(xlim = c(0, 3)) +
  labs(
    title = "Histogram and density estimate",
    x = "Carat",
    y = "Density"
  )

print(p)
```

Density curves are smooth summaries, not direct observations. Their appearance depends on the bandwidth, just as a histogram depends on its bin width.

## Compare groups

Box plots are compact summaries of the median, quartiles and potential outliers. They are useful for comparison, but can conceal sample size and distribution shape. Adding jittered observations often provides useful context.

```r
library(ggplot2)

small_mpg <- subset(mpg, class %in% c("compact", "midsize", "suv"))

p <- ggplot(small_mpg, aes(class, hwy, fill = class)) +
  geom_boxplot(width = 0.58, outlier.shape = NA, alpha = 0.65) +
  geom_jitter(width = 0.12, alpha = 0.45, size = 1.4) +
  scale_fill_manual(values = c(
    compact = "#214c57",
    midsize = "#6e2538",
    suv = "#abc1c4"
  )) +
  labs(
    title = "Fuel economy across vehicle classes",
    x = NULL,
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

If a grouping variable is mapped to `fill` or `colour`, ggplot2 usually infers the groups. Explicit `group` mappings are particularly important for line plots when colour or linetype does not already define the intended series.

## Use facets for small multiples

Faceting creates a consistent panel for each level of a variable. This is often clearer than placing many groups in one plotting area.

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", alpha = 0.55) +
  geom_smooth(
    method = "lm",
    formula = y ~ x,
    se = FALSE,
    colour = "#6e2538"
  ) +
  facet_wrap(vars(drv), nrow = 1) +
  labs(
    title = "The relationship differs by drivetrain",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

`facet_wrap()` arranges one faceting variable across rows and columns. `facet_grid(rows ~ columns)` is useful when two variables define a meaningful grid.

Keep common scales when direct comparisons between panels matter. Free scales can reveal within-panel patterns, but they make magnitudes harder to compare and should be used only for a clear reason.

## Control scales

Scales translate data values into visual properties and control axes and legends. They are where you change breaks, labels, limits, transformations and colour palettes.

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2, alpha = 0.75) +
  scale_x_continuous(
    breaks = seq(2, 7, by = 1),
    expand = expansion(mult = c(0.02, 0.06))
  ) +
  scale_colour_viridis_d(end = 0.88) +
  labs(
    title = "A discrete, perceptually ordered colour scale",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)",
    colour = "Vehicle class"
  )

print(p)
```

Use a continuous scale for quantitative variables and a discrete scale for categories. A sequential palette suits values progressing from low to high. A diverging palette suits meaningful deviations around a centre. Unrelated categories need distinguishable colours without implying an order.

Transformations such as `scale_x_log10()` change the visual scale and its axis labels while preserving the original data. Log scales are helpful for multiplicative relationships and strongly right-skewed positive variables, but they must be labelled and interpreted accordingly.

## Zoom without discarding data

Scale limits and coordinate limits behave differently. Setting `limits` on a scale removes observations before statistical layers are calculated. `coord_cartesian()` zooms the view after the calculations.

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", alpha = 0.5) +
  geom_smooth(
    method = "lm",
    formula = y ~ x,
    colour = "#6e2538"
  ) +
  coord_cartesian(xlim = c(2, 5), ylim = c(15, 40)) +
  labs(
    title = "Coordinate limits zoom without refitting the model",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

Use scale limits when excluded observations genuinely fall outside the data definition. Use coordinate limits when you simply want a closer view.

## Labels, reference lines and annotations

A reader should be able to understand the main comparison without consulting the surrounding text. Use `labs()` to state the subject, units and meaning of mapped aesthetics.

```r
library(ggplot2)

threshold <- 30

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", alpha = 0.6) +
  geom_hline(
    yintercept = threshold,
    linetype = "dashed",
    colour = "#6e2538"
  ) +
  annotate(
    "text",
    x = 6.8,
    y = threshold + 1,
    label = "30 MPG reference",
    hjust = 1,
    colour = "#6e2538"
  ) +
  labs(
    title = "Engine size and fuel economy",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

Annotations should clarify a comparison rather than decorate the plot. Direct labels are often preferable to a legend when only a few important series need identification.

## Combine raw data with summaries

Different layers can use different datasets. This is useful when raw observations and a calculated summary need to appear together.

```r
library(ggplot2)

class_means <- aggregate(hwy ~ class, data = mpg, FUN = mean)

p <- ggplot(mpg, aes(class, hwy)) +
  geom_jitter(
    width = 0.16,
    colour = "#214c57",
    alpha = 0.32
  ) +
  geom_point(
    data = class_means,
    mapping = aes(x = class, y = hwy),
    inherit.aes = FALSE,
    colour = "#6e2538",
    size = 3.2
  ) +
  labs(
    title = "Observations and group means",
    subtitle = "Large points show the mean within each class",
    x = NULL,
    y = "Highway fuel economy (MPG)"
  )

print(p)
```

`inherit.aes = FALSE` tells the summary layer not to inherit mappings from the main plot. This becomes important when the secondary dataset has different variable names or represents a different unit of observation.

## Write reusable plotting functions

When the same type of figure is produced repeatedly, place the common structure in a function. The `.data[[...]]` pronoun allows column names to be supplied as strings.

```r
library(ggplot2)

scatter_plot <- function(data, x, y, colour = "#214c57") {
  ggplot(data, aes(x = .data[[x]], y = .data[[y]])) +
    geom_point(colour = colour, alpha = 0.65) +
    geom_smooth(
      method = "lm",
      formula = y ~ x,
      se = FALSE,
      colour = "#6e2538"
    ) +
    labs(x = x, y = y)
}

p <- scatter_plot(mpg, "displ", "hwy") +
  labs(title = "A plot produced by a reusable function")

print(p)
```

A useful function should encode genuine repetition while leaving the important analytical choices visible. Avoid a single function with dozens of arguments that obscures what the final figure is doing.

## Export figures reproducibly

Use `ggsave()` rather than exporting manually from the plotting pane. State the dimensions and resolution in the script so the figure can be recreated.

```r
library(ggplot2)

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#214c57", alpha = 0.6) +
  labs(
    title = "Engine size and fuel economy",
    x = "Engine displacement (litres)",
    y = "Highway fuel economy (MPG)"
  ) +
  theme_minimal()

ggsave(
  filename = "engine-fuel-economy.png",
  plot = p,
  width = 7,
  height = 5,
  units = "in",
  dpi = 300,
  bg = "white"
)

print(p)
```

Use a vector format such as PDF or SVG when the journal or document workflow supports it. Use a high-resolution PNG when a raster image is required. Check the destination's size, font and file-format requirements before export.

## A final plotting checklist

Before treating a figure as finished, ask:

- Does the geometry match the question and variable types?
- Is the unit of observation clear?
- Are the axes labelled with meaningful names and units?
- Does each colour, shape or size mapping carry useful information?
- Could faceting or direct labels reduce legend-reading?
- Are uncertainty intervals identified and interpreted correctly?
- Have scale transformations, exclusions and missing values been made explicit?
- Is the figure still readable at its final printed or on-screen size?

## My reusable ggplot theme

My usual starting point is `theme_minimal()`, with bold axis titles, a centred bold plot title, angled category labels when needed and Ubuntu as the preferred font. Applying a 45-degree angle and removing the legend on every plot is too rigid: continuous x-axes generally do not need rotated labels, and some figures need a legend. The function below keeps the visual identity while making those choices adjustable.

```r
library(ggplot2)

theme_bodhi <- function(
  base_size = 11,
  base_family = "Ubuntu",
  rotate_x = FALSE,
  legend_position = "none",
  title_size = 14
) {
  x_angle <- if (rotate_x) 45 else 0
  x_hjust <- if (rotate_x) 1 else 0.5
  x_vjust <- if (rotate_x) 1 else 0.5

  theme_minimal(
    base_size = base_size,
    base_family = base_family
  ) +
    theme(
      axis.text.x = element_text(
        angle = x_angle,
        vjust = x_vjust,
        hjust = x_hjust
      ),
      axis.title = element_text(face = "bold"),
      plot.title = element_text(
        face = "bold",
        size = title_size,
        hjust = 0.5
      ),
      plot.subtitle = element_text(hjust = 0.5),
      plot.title.position = "plot",
      legend.position = legend_position,
      legend.box.background = element_rect(
        colour = "black",
        fill = NA
      ),
      panel.grid.minor = element_blank(),
      text = element_text(family = base_family)
    )
}

p <- ggplot(mpg, aes(class, hwy, colour = drv)) +
  geom_jitter(width = 0.14, alpha = 0.65) +
  labs(
    title = "Fuel economy by vehicle class",
    subtitle = "A categorical axis and a visible legend",
    x = "Vehicle class",
    y = "Highway fuel economy (MPG)",
    colour = "Drivetrain"
  ) +
  theme_bodhi(
    rotate_x = TRUE,
    legend_position = "bottom"
  )

print(p)
```

Use `theme_bodhi()` for a plot that does not need rotated labels or a legend. Use `theme_bodhi(rotate_x = TRUE)` for crowded categorical labels, and supply `legend_position = "right"` or `"bottom"` when colour, fill, shape or linetype needs explanation. Ubuntu must be available on the device producing the figure; otherwise pass an installed family such as `base_family = "sans"`.

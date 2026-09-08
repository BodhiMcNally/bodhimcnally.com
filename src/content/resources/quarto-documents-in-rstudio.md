---
title: "Quarto documents in RStudio: a complete practical guide"
description: Learn how a .qmd file becomes a reproducible report, from YAML and R code cells to figures, callouts, citations, themes and project-wide settings.
category: Reproducible Research
tags:
  - Quarto
  - RStudio
  - YAML
  - R
  - reproducible reporting
published: 2026-09-06
updated: 2026-09-06
level: Introductory
software:
  - R
  - RStudio
  - Quarto
estimatedMinutes: 70
featured: true
template: false
draft: false
downloadableAssets:
  - label: Complete starter project
    href: /resources/quarto/quarto-starter-project.zip
    description: A ready-to-open project containing the QMD report, project YAML, stylesheet and example bibliography.
  - label: Starter Quarto report
    href: /resources/quarto/report-template.qmd
    description: An editable .qmd file containing a title block, setup cell, figure, cross-reference and reproducibility section.
  - label: Starter report stylesheet
    href: /resources/quarto/styles.css
    description: A small CSS file designed to sit beside the starter report.
---

A Quarto document keeps explanation, code and results in one source file. When it is rendered, Quarto reads the document settings, runs the executable cells, converts the Markdown and assembles the requested output. The important skill is not memorising every option. It is learning which layer controls which part of the result.

Use the **QMD laboratory** above to change representative source and inspect the guided preview. It deliberately supports a limited set of features and does not replace the Quarto renderer. In the examples below, **Run R** executes an ordinary R code block in the browser; rendering a complete `.qmd` file still belongs in RStudio.

By the end of this resource, you should be able to create a Quarto report, diagnose common YAML problems, control what code and output readers see, add accessible figures and tables, organise citations, apply a restrained visual design and decide when settings belong in a document or a project.

## The Quarto mental model

A `.qmd` file usually contains three kinds of material:

1. **YAML metadata** describes the document: its title, author, output format and options.
2. **Markdown** contains the prose and structure: headings, paragraphs, lists, links, equations and references.
3. **Executable cells** contain R or another supported language and produce values, tables or figures.

Rendering is the process that joins these parts. For an R document, Quarto uses `knitr` to execute the R cells and Pandoc to turn the resulting document into HTML, PDF, Word or another format. The source remains plain text, so it works well with version control and can be regenerated when the data or analysis changes.

This is different from running selected lines in the R console. Console execution is useful while developing code, but it does not prove that the whole report works from beginning to end. A successful clean render is the stronger reproducibility test because it executes the document in a fresh R session.

> **Working rule:** develop individual expressions interactively, but render the entire document regularly. Objects that exist only in your Global Environment are not part of the report.

### Why this page does not embed RStudio

RStudio is an integrated development environment, while Quarto rendering is a command-line process that uses local files, R packages and a background preview server. Embedding a real working session would require a separately hosted RStudio Server, authenticated user sessions and isolated computing resources. It would no longer be a small static teaching page.

The laboratory therefore teaches the relationship between representative source and output without claiming to compile arbitrary documents. The **Run R** controls elsewhere on the page are different: they use a browser-based R runtime to execute the individual examples. For a complete and authoritative render, download the starter files and use RStudio.

## Create and render your first document

In a recent version of RStudio:

1. Select **File → New File → Quarto Document**.
2. Choose **Document** and **HTML**.
3. Enter a temporary title and author. These can be changed later.
4. Save the file with a short, meaningful name ending in `.qmd`, such as `week-03-analysis.qmd`.
5. Select **Render** in the editor toolbar.

RStudio can show the rendered result in the Viewer pane or a separate window. **Render on Save** is convenient once a document renders reliably, but manual rendering is often less distracting while resolving early errors.

A new document may include example prose and a code cell. Replace it gradually rather than deleting everything before the first render. Render once, change one part, then render again. This makes it much easier to identify the change that introduced an error.

The smallest useful document is:

```markdown
---
title: "My first Quarto document"
author: "Student Name"
format: html
---

## Question

What do these data tell us?
```

The lines containing exactly three hyphens mark the start and end of the YAML block. Everything after the second delimiter is the document body.

## YAML: the document control panel

YAML is a human-readable way to represent settings. In Quarto, it normally appears at the top of a document between `---` delimiters. YAML is compact, but it is sensitive to indentation.

### Keys, values and nesting

A simple setting has a key, a colon and a value:

```yaml
title: "Analysis of waiting times"
```

Related settings can be nested beneath a parent key:

```yaml
format:
  html:
    toc: true
    number-sections: true
```

Here, `toc` and `number-sections` apply to the HTML format. Their two extra levels of indentation communicate that hierarchy. Use spaces, not tabs, and keep sibling settings aligned.

Lists begin with hyphens:

```yaml
keywords:
  - regression
  - clinical data
  - reproducibility
```

Short lists can also be written in brackets:

```yaml
keywords: [regression, clinical data, reproducibility]
```

Both are valid. The multi-line form is easier to edit when items are long or structured.

### Strings, numbers, booleans and comments

YAML recognises several types of value:

| Type | Example | Meaning |
| --- | --- | --- |
| Text | `title: "Final report"` | A string of characters |
| Number | `toc-depth: 3` | A numeric value |
| Boolean | `toc: true` | An on/off value, without quotation marks |
| Empty value | `subtitle:` | No value has been supplied |
| Comment | `toc: true # page navigation` | Text after `#` is ignored |

Quoting ordinary text is a good habit, especially when it contains a colon, hash symbol, date-like value or leading punctuation. Do not quote booleans when you intend them to behave as booleans: write `true`, not `"true"`.

Common YAML errors include:

- a missing colon after a key;
- inconsistent indentation;
- a tab mixed with spaces;
- an opening quote without a closing quote;
- placing a document option under the wrong parent;
- writing two top-level keys with the same name;
- omitting the closing `---` delimiter.

When RStudio underlines a YAML entry, hover over it before rendering. Its YAML completion can also suggest valid options and expected values.

### Title, subtitle, author and date

The concise form is appropriate for one author:

```yaml
---
title: "Patterns of recovery after surgery"
subtitle: "An exploratory analysis"
author: "Student Name"
date: today
date-format: "D MMMM YYYY"
format: html
---
```

`date: today` inserts the render date. A fixed ISO date such as `2026-09-06` records a particular date even if the document is rendered later. `last-modified` is useful for material that is updated over time. Choose the meaning first; then choose the format.

Structured author metadata becomes useful for formal reports:

```yaml
author:
  - name: "First Author"
    email: "first.author@example.org"
    orcid: 0000-0000-0000-0000
    affiliations:
      - name: "Example University"
        department: "School of Example Studies"
  - name: "Second Author"
    affiliations:
      - name: "Example Hospital"
```

Do not add an ORCID, affiliation or credential unless it is accurate and relevant to the document. Metadata is part of the publication record, not decoration.

Other useful scholarly fields include `abstract`, `keywords`, `doi`, `license` and `bibliography`. The exact amount of metadata should match the purpose of the report.

### One complete HTML header

This is a practical starting point for a student report:

```yaml
---
title: "Analysis title"
subtitle: "A concise description"
author: "Student Name"
date: today
date-format: "D MMMM YYYY"
lang: en-AU
format:
  html:
    toc: true
    toc-depth: 3
    number-sections: true
    theme: cosmo
    code-fold: true
    code-summary: "Show the R code"
    code-copy: true
    code-overflow: wrap
execute:
  echo: true
  warning: false
  message: false
---
```

Notice the division of responsibility. Options beneath `format: html:` affect HTML presentation. Options beneath `execute:` affect computation and the visibility of code-related output.

## Write the document body with Markdown

Markdown uses small amounts of punctuation to describe structure. The source stays readable even before rendering.

```markdown
## Main section

This is a paragraph with **bold text**, *emphasis* and `inline code`.

### Subsection

- first item
- second item

1. first step
2. second step

[Descriptive link text](https://quarto.org/)
```

Use headings to communicate a hierarchy, not merely to make text larger. A document title is already the top-level heading, so the main sections in the body usually begin with `##`. Subsections then use `###`, followed by `####` only when needed.

Leave a blank line before and after lists, code blocks, figures and other block elements. Many confusing Markdown problems are really missing blank lines.

### Useful Markdown patterns

| Purpose | Source |
| --- | --- |
| Bold | `**important term**` |
| Emphasis | `*carefully qualified phrase*` |
| Inline code | `` `mean(x)` `` |
| Link | `[Quarto guide](https://quarto.org/docs/guide/)` |
| Block quotation | `> Quoted material` |
| Horizontal rule | `---` outside the YAML header |
| Footnote | `A statement.[^1]` and later `[^1]: The note.` |
| Inline equation | `$SE = s / \sqrt{n}$` |
| Display equation | `$$\bar{x} = \frac{1}{n}\sum x_i$$` |

Use link text that describes the destination. “Read the [Quarto figure guide](https://quarto.org/docs/authoring/figures.html)” is more useful than “click here”.

## Add executable R cells

An executable R cell starts with three backticks followed by `{r}` and ends with three backticks. Quarto cell options go at the top as specially formatted comments beginning with `#|`.

````markdown
```{r}
#| label: calculate-summary

values <- c(8, 11, 13, 13, 15)
mean(values)
sd(values)
```
````

The label should be unique within the document. Use short, meaningful labels with hyphens, such as `data-import`, `model-fit` or `fig-age-distribution`. Avoid spaces and underscores. Prefix figures with `fig-` and tables with `tbl-` when they will be cross-referenced.

Run the same calculation here:

```r
values <- c(8, 11, 13, 13, 15)
mean(values)
sd(values)
```

### Cell options belong before code

Place every `#|` option immediately after the opening fence, before executable statements:

````markdown
```{r}
#| label: model-summary
#| echo: false
#| warning: false

model <- lm(mpg ~ wt, data = mtcars)
summary(model)
```
````

Quarto also understands many older `knitr` chunk-header options, but the `#|` form is easier to read, supports YAML values and transfers more consistently between computational engines. Use it for new work.

### Global defaults and local exceptions

Document-wide defaults belong under `execute:`:

```yaml
execute:
  echo: true
  warning: false
  message: false
```

A cell can override a default:

````markdown
```{r}
#| echo: false

mean(values)
```
````

This hierarchy avoids repeating options in every cell. Set a sensible document default, then make exceptions deliberately.

## Control code, messages, warnings and output

Several options sound similar but answer different questions.

| Option | Question it answers | Typical use |
| --- | --- | --- |
| `eval: false` | Should this code run? | Show illustrative code without executing it |
| `echo: false` | Should readers see the source code? | Show only a result or figure |
| `output: false` | Should ordinary results appear? | Run code but omit its printed result |
| `warning: false` | Should warnings appear? | Remove understood, non-essential warnings from the final report |
| `message: false` | Should R messages appear? | Suppress package startup and informational messages in a `knitr` document |
| `include: false` | Should anything from this cell appear? | Run setup code invisibly |
| `error: true` | Should rendering continue after an error and display it? | Teaching or diagnostic demonstrations, not routine final reports |

Three distinctions matter:

- `echo: false` still runs the code and keeps its output.
- `output: false` can still show the code.
- `include: false` runs the cell but hides its code, text output, messages, warnings and figures.

A quiet setup cell is therefore usually:

````markdown
```{r}
#| label: setup
#| include: false

library(dplyr)
library(ggplot2)
set.seed(42)
```
````

Suppress warnings only after understanding them. A warning may identify missing values, failed model convergence or an unintended transformation. Removing it from the report does not solve the underlying issue.

### Folding and copying code in HTML

Code folding is an HTML presentation feature, not an execution option:

```yaml
format:
  html:
    code-fold: true
    code-summary: "Show the R code"
    code-copy: true
    code-overflow: wrap
```

The possible `code-fold` choices are:

- `false`: source is shown normally;
- `true`: source begins collapsed;
- `show`: source is placed in a disclosure panel but begins expanded.

`code-tools: true` adds document-level code controls. Use it when readers genuinely need to reveal, hide or obtain source across the report; it is unnecessary for a short assessment document.

## Insert images, captions and cross-references

Keep images in the project rather than pasting machine-specific absolute paths. A simple structure might be:

```text
analysis-project/
├── analysis.qmd
├── images/
│   └── study-flow.png
└── data/
    └── observations.csv
```

Insert a static image with Markdown:

```markdown
![Participant flow through the study.](images/study-flow.png)
```

The text in square brackets becomes a caption when the image stands alone in its paragraph. You can add attributes:

```markdown
![Participant flow through the study.](images/study-flow.png){#fig-study-flow fig-alt="A flow chart showing 320 recruited participants, 18 exclusions and 302 included in analysis." width="75%" fig-align="center"}
```

Each element has a different purpose:

- the caption tells the reader why the figure matters;
- `fig-alt` describes the visual content for someone who cannot see it;
- `#fig-study-flow` creates an identifier;
- `width="75%"` controls displayed size while preserving aspect ratio;
- `fig-align="center"` controls placement.

A caption is not automatically good alt text. “Study flow” may be an adequate short caption but does not convey the information in a diagram. Conversely, alt text should not repeat a long interpretation already explained next to the figure.

Reference the numbered figure in prose with its identifier:

```markdown
The exclusions and final analytic sample are summarised in @fig-study-flow.
```

Quarto replaces `@fig-study-flow` with the appropriate figure number and link. This remains correct if figures are rearranged. Cross-referenceable figure labels must begin with `fig-`.

### Figures produced by R

Give a computational figure its label, caption and alt text as cell options:

````markdown
```{r}
#| label: fig-waiting-time
#| fig-cap: "Distribution of waiting times in the sample."
#| fig-alt: "A right-skewed histogram with most waiting times below 30 minutes and a small number above 60 minutes."
#| fig-width: 7
#| fig-height: 4
#| fig-align: center

hist(
  faithful$waiting,
  col = "#214c57",
  border = "white",
  main = NULL,
  xlab = "Waiting time (minutes)"
)
```
````

Try the plot directly:

```r
hist(
  faithful$waiting,
  col = "#214c57",
  border = "white",
  main = NULL,
  xlab = "Waiting time (minutes)"
)
```

`fig-width` and `fig-height` describe the graphics device in inches for `knitr`; the rendered HTML can still resize the image responsively. Use `fig-dpi` when raster resolution matters. Prefer SVG for simple vector graphics when the target format and journal workflow support it; prefer PNG for complex raster output.

### Multiple figures and subcaptions

Quarto can arrange figures into a panel:

````markdown
```{r}
#| label: fig-diagnostics
#| fig-cap: "Selected model diagnostics."
#| fig-subcap:
#|   - "Residuals against fitted values."
#|   - "Normal quantile plot."
#| layout-ncol: 2

plot(model, which = 1)
plot(model, which = 2)
```
````

For static images, use a fenced div:

```markdown
::: {#fig-imaging-panel layout-ncol=2}

![Baseline image.](images/baseline.png){#fig-baseline}

![Follow-up image.](images/follow-up.png){#fig-follow-up}

Comparison of baseline and follow-up imaging.
:::
```

Blank lines inside the div matter. The final paragraph becomes the main caption.

## Create readable tables

A small fixed table can be written directly in Markdown:

```markdown
| Group | n | Mean (SD) |
| --- | ---: | ---: |
| Intervention | 48 | 12.4 (3.1) |
| Control | 51 | 13.0 (3.6) |
```

Use colons in the separator row to align columns. Markdown tables are best for small amounts of information; generate changing tables from data rather than copying calculated values into prose.

An R-generated table can be labelled and captioned:

````markdown
```{r}
#| label: tbl-cylinder-summary
#| tbl-cap: "Mean fuel economy by cylinder count."

summary_table <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
knitr::kable(summary_table, digits = 1)
```
````

Refer to it as `@tbl-cylinder-summary`. A cross-referenceable table label begins with `tbl-`.

Keep tables narrow enough to read. Round numbers consistently, include units in headings, define abbreviations and distinguish missing values from zero. Colour should not be the only way a table communicates meaning.

## Use callouts, tabs and layout carefully

Callouts separate a note from the main argument. Quarto provides `note`, `tip`, `warning`, `caution` and `important` types:

```markdown
::: {.callout-important}
## Check the denominator

A percentage is uninterpretable unless the population included in its denominator is clear.
:::
```

Make a callout expandable with `collapse="true"`, or expandable but initially open with `collapse="false"`:

```markdown
::: {.callout-tip collapse="true"}
## Show an optional derivation

Place supplementary detail here.
:::
```

You can choose `callout-appearance: default`, `simple` or `minimal`, and suppress icons with `callout-icon: false`. These can be set in YAML for the whole document or as attributes for one callout.

Callouts lose their value when every other paragraph is inside one. Reserve them for a genuine warning, definition, optional derivation or interpretive point.

### Tabsets

For HTML, a heading with the `.panel-tabset` class turns its child headings into tabs:

```markdown
## Results {.panel-tabset}

### Table

Tabular results appear here.

### Figure

Graphical results appear here.
```

The same idea can be scoped explicitly with a fenced div. This form is useful when the tabset should sit inside a larger section without turning every following heading into a tab:

```markdown
::: {.panel-tabset}
## Summary

The principal result appears here.

## R code

The code appears here.

## Interpretation

The prose interpretation appears here.
:::
```

Choose **Tabbed content** in the QMD laboratory to edit this form and test its rendered behaviour. The preview supports clicking the tabs as well as the Left Arrow, Right Arrow, Home and End keys.

Tabs can reduce scrolling but hide information. Avoid them when readers need to compare panels at the same time, when printing matters, or when the tab labels do not make the hidden content obvious.

### Columns and page layout

A simple two-column block is:

```markdown
::: {layout-ncol=2}

### Strengths

- clearly defined outcome
- reproducible code

### Limitations

- small sample
- incomplete follow-up

:::
```

HTML articles can also place selected content in margin or full-width columns, but a conventional single reading column is usually best for reports. Use layout to clarify relationships, not to fill blank space.

## Add equations, inline R and citations

LaTeX notation between dollar signs produces mathematics. Use one pair for inline mathematics and two pairs for a displayed equation:

```markdown
The standard error is $SE = s / \sqrt{n}$.

$$
CI = \hat{\theta} \pm z_{1-\alpha/2}SE(\hat{\theta})
$$
```

Do not use an image of an equation. Proper mathematical markup scales cleanly and is more accessible.

### Inline R

Inline code places a computed value inside a sentence. In a Quarto document using `knitr`, write an R expression after a backtick and `r`, then close the backtick. For example, the source below inserts the number of rows in `analysis_data`:

```markdown
The analytic sample contained `r nrow(analysis_data)` observations.
```

Inline values prevent the prose from drifting out of sync with the analysis. Format them deliberately:

```markdown
The mean was `r sprintf("%.1f", mean(analysis_data$outcome))` units.
```

Keep inline expressions short. Calculate complex results in a labelled cell, store them in clearly named objects, then insert those objects into the prose.

### Bibliographies and citations

Place a BibTeX file beside the document and declare it in YAML:

```yaml
bibliography: references.bib
csl: vancouver.csl
```

The `csl` line is optional; it selects a Citation Style Language file when a particular style is required. A BibTeX record resembles:

```bibtex
@article{smith2025,
  author  = {Smith, Alex and Jones, Priya},
  title   = {An example study},
  journal = {Example Journal},
  year    = {2025},
  volume  = {12},
  pages   = {100--108},
  doi     = {10.0000/example}
}
```

Use the citation key in the body:

```markdown
Previous work reached a similar conclusion [@smith2025].

Smith and Jones @smith2025 reported a similar result.

Several studies support this interpretation [@smith2025; @lee2026].
```

Quarto builds the reference list automatically. Add an explicit location with:

```markdown
## References

::: {#refs}
:::
```

Reference managers such as Zotero can export BibTeX, but exported metadata still needs checking. Capitalisation, page ranges, DOIs and author names are frequent sources of errors.

## Customise an HTML document

Start with structure and readability. A theme, table of contents and a few code controls usually achieve more than a large custom stylesheet.

### Navigation and section numbering

```yaml
format:
  html:
    toc: true
    toc-title: "On this page"
    toc-depth: 3
    toc-location: right
    number-sections: true
    number-depth: 2
    smooth-scroll: true
```

The default HTML table of contents sits on the right when space permits. Other supported locations include `left` and `body`. A deeper table of contents is not automatically better: include only the levels a reader needs for orientation.

### Themes and colour modes

Quarto's built-in HTML themes are based on Bootstrap. Supply one theme name:

```yaml
format:
  html:
    theme: cosmo
```

Or provide light and dark themes:

```yaml
format:
  html:
    theme:
      light: cosmo
      dark: darkly
```

Themes control many connected decisions—type, colour, spacing and components—so evaluate the entire document rather than the title alone. Check body contrast, links, code, callouts, tables and figures in every colour mode.

### Title blocks

HTML title blocks can be `default`, `plain` or `none`:

```yaml
format:
  html:
    title-block-style: plain
```

A banner can use the theme colour, an explicit CSS colour or an image:

```yaml
format:
  html:
    title-block-banner: "#214c57"
    title-block-banner-color: "#ffffff"
```

Use a banner only when it serves the document. A short analytical report rarely needs a large photographic header.

### CSS for targeted changes

Put `styles.css` beside the `.qmd` file and link it from YAML:

```yaml
format:
  html:
    theme: cosmo
    css: styles.css
```

Then make small, testable adjustments:

```css
:root {
  --report-accent: #214c57;
}

body {
  line-height: 1.65;
}

h2 {
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #d7d2ca;
}

a {
  color: var(--report-accent);
}

figcaption {
  color: #625d58;
  font-size: 0.92rem;
}
```

Use CSS for presentation, not to repair poor structure. Do not remove focus outlines, reduce body text to fit more on screen or use colour combinations without checking contrast. If a selector stops working after a Quarto update, inspect the rendered HTML before adding increasingly specific overrides.

For deeper Bootstrap customisation, use an SCSS theme file with Quarto's theme variables and rules. That is appropriate for a repeated publication style; it is unnecessary for changing one heading colour.

### A self-contained HTML file

When you need one portable HTML file, use:

```yaml
format:
  html:
    embed-resources: true
```

Quarto embeds supporting resources into the HTML where possible. The result is convenient to email or archive but can be much larger, and externally hosted or server-dependent content may not become self-contained. Always open the finished file on another machine or in a private browser window before relying on it.

## Render to HTML, PDF and Word

One source can request several formats:

```yaml
format:
  html:
    toc: true
    code-fold: true
  pdf:
    toc: true
  docx:
    toc: true
```

You can also render a particular format from the terminal:

```bash
quarto render report.qmd --to html
quarto render report.qmd --to docx
```

Multi-format authoring does not mean every feature behaves identically. Code folding, tabsets, hover citations and lightboxes are interactive HTML features. PDF has page breaks and typesetting constraints. Word output is designed for later editing and can use a reference document for styles.

If the final deliverable is PDF, inspect the PDF throughout development rather than designing in HTML and converting at the end. Use format-specific YAML when necessary and keep the analytical content shared.

PDF rendering may require a TeX installation. Quarto's TinyTeX tooling is a common lightweight route. Word output does not require Microsoft Word to render, although Word is useful for inspecting the result.

## Move from one file to a Quarto project

A project gives a group of documents a shared root and shared settings. In RStudio, create one with **File → New Project → New Directory → Quarto Project**. The key file is `_quarto.yml`.

```text
analysis-project/
├── _quarto.yml
├── report.qmd
├── appendix.qmd
├── references.bib
├── styles.css
├── data/
└── images/
```

Project-wide options go in `_quarto.yml`:

```yaml
project:
  type: default
  output-dir: _output

format:
  html:
    theme: cosmo
    css: styles.css
    toc: true

execute:
  warning: false
  message: false
```

Individual documents inherit those settings and can override them in their own YAML. This prevents copy-and-paste divergence across a series of reports.

Use relative paths from the project, keep raw data separate from derived output and avoid `setwd()` inside a document. Code such as `read.csv("data/observations.csv")` will work on another machine when the project structure is preserved; `read.csv("C:/Users/Name/Desktop/observations.csv")` will not.

## Reproducibility and render performance

A reproducible document needs more than visible code. Another person must be able to obtain the inputs, recreate the software environment and run the steps in the intended order.

A strong workflow includes:

- one project directory containing the document and permitted inputs;
- relative file paths;
- an explicit setup cell;
- a fixed random seed for stochastic work;
- code that does not rely on objects created manually in the console;
- recorded package versions, commonly with `renv`;
- data provenance and a clear distinction between raw and derived files;
- a final clean render after restarting R.

`sessionInfo()` records useful environment details:

```r
sessionInfo()
```

### Cache and freeze are different

`cache: true` caches computational results. It can speed up expensive cells, but cache invalidation is not omniscient: a cell may depend on an external file or object that did not change in the cell source. Use caching only when you understand the dependencies.

```yaml
execute:
  cache: true
```

`freeze` is primarily a project-rendering control. It reuses previously generated computational output during global project renders:

```yaml
execute:
  freeze: auto
```

With `auto`, Quarto recomputes a document when its source changes. `true` avoids recomputation during a global project render; `false` recomputes. Neither option excuses a deliberate fresh render before submission or release.

## Debug a failed render

Read the first meaningful error, not only the final “render failed” line. Later messages often describe consequences of the first problem.

### If the error points to YAML

Check:

1. opening and closing `---` delimiters;
2. colons after keys;
3. indentation using spaces;
4. matched quotation marks;
5. whether the option belongs under `format`, `html` or `execute`;
6. whether a filename containing spaces or punctuation needs quotes.

Reduce the header temporarily to `title` and `format: html`, render, then restore groups of options until the error returns.

### If R says an object does not exist

The object may have been created in the console but not in the document, a previous cell may have failed, cells may be in the wrong order, or a hidden setup cell may not have run. Restart R and render from the top. Do not solve the problem by saving and restoring a workspace image.

### If a package or function is missing

Install the package once in the console with `install.packages("packageName")`; load it in the document with `library(packageName)`. Package installation generally does not belong inside a report because it changes the user's library during rendering.

### If an image cannot be found

Check the spelling, capitalisation and extension, then verify the path relative to the project. File paths may appear to work on a case-insensitive local system and fail after publishing to a case-sensitive server.

### If the output is stale

Confirm that you are opening the newly rendered file, inspect the Background Jobs output, disable cache or freeze temporarily, and remove only the relevant generated cache after confirming its location. Do not assume that pressing Run on a cell updates the standalone HTML file.

### If rendering works only on your machine

Look for absolute paths, unrecorded packages, private files, environment variables, local fonts, external tools and data that were never included. Test the project from a fresh clone or a copied directory outside your usual working folder.

## A complete report pattern

The following pattern is deliberately plain. It separates setup, question, data, results and interpretation; hides setup noise; gives the figure accessible metadata; and records the R session.

````markdown
---
title: "Analysis of fuel economy"
subtitle: "A worked reproducible report"
author: "Student Name"
date: today
date-format: "D MMMM YYYY"
format:
  html:
    toc: true
    toc-depth: 3
    number-sections: true
    theme: cosmo
    code-fold: true
    code-summary: "Show the R code"
    code-copy: true
    code-overflow: wrap
execute:
  echo: true
  warning: false
  message: false
---

## Research question

How is vehicle weight associated with fuel economy in the example data?

## Setup

```{r}
#| label: setup
#| include: false

set.seed(42)
```

## Data

The analysis uses the built-in `mtcars` dataset. One row represents one vehicle model.

```{r}
#| label: inspect-data

head(mtcars[c("mpg", "wt")])
```

## Results

```{r}
#| label: fit-model

model <- lm(mpg ~ wt, data = mtcars)
coef(summary(model))
```

```{r}
#| label: fig-weight-mpg
#| echo: false
#| fig-cap: "Vehicle weight and fuel economy with a fitted linear relationship."
#| fig-alt: "A scatter plot showing lower miles per gallon among heavier vehicles, with a downward-sloping fitted line."
#| fig-width: 7
#| fig-height: 4.5

plot(
  mtcars$wt,
  mtcars$mpg,
  pch = 19,
  col = "#214c57",
  xlab = "Weight (1000 lb)",
  ylab = "Miles per gallon"
)
abline(model, col = "#6e2538", lwd = 2)
```

As shown in @fig-weight-mpg, heavier vehicles in this dataset tend to have lower fuel economy. This descriptive association does not by itself establish causation.

::: {.callout-note}
## Interpretation

Report the estimated change and uncertainty from the fitted model here, then explain its practical meaning and limits.
:::

## Reproducibility

```{r}
#| label: session-information
#| echo: false

sessionInfo()
```
````

The downloadable starter report below contains this broader structure and a matching stylesheet. Place the two files in the same folder, open the `.qmd` file in RStudio and render to HTML.

## Final checks before sharing

### Content

- Does the title identify the analysis?
- Is the research question stated before the results?
- Does every result have an interpretation rather than merely an output dump?
- Are limitations and uncertainty described in proportion to the evidence?
- Do citations point to the intended sources?

### Code and computation

- Does the document render after restarting R?
- Are all required objects created in the document?
- Are paths relative to the project?
- Have warnings been understood before being hidden?
- Are package installation commands excluded from the report?
- Is randomness controlled where required?

### Presentation and accessibility

- Is the heading hierarchy logical?
- Do figures have informative captions and appropriate alt text?
- Are units, denominators and abbreviations clear?
- Can tables be read without colour alone?
- Is long code folded or omitted when it distracts from the argument?
- Does the actual target format—HTML, PDF or Word—work at the intended size?

### Sharing

- Are the data and images permitted to be shared?
- Have names, identifiers, file paths and metadata been checked?
- If HTML is self-contained, has it been tested away from the project folder?
- If the work is submitted for assessment, does it comply with the relevant course instructions?

## Official references and next steps

Quarto evolves, so use its option reference when you move beyond the patterns in this lesson. The most useful official pages are:

- [RStudio's Quarto integration guide](https://docs.posit.co/ide/user/ide/guide/documents/quarto-project.html) for creating, rendering and previewing documents in the IDE;
- [Quarto HTML options](https://quarto.org/docs/reference/formats/html.html) for the complete current format reference;
- [execution options](https://quarto.org/docs/computations/execution-options.html) and the [knitr cell reference](https://quarto.org/docs/reference/cells/cells-knitr.html) for code and output control;
- [figures](https://quarto.org/docs/authoring/figures.html), [tables](https://quarto.org/docs/authoring/tables.html), [callouts](https://quarto.org/docs/authoring/callouts.html), [citations](https://quarto.org/docs/authoring/citations.html) and [cross-references](https://quarto.org/docs/authoring/cross-references.html) for scientific authoring; and
- [Quarto projects](https://quarto.org/docs/projects/quarto-projects.html) and [HTML themes](https://quarto.org/docs/output-formats/html-themes.html) when a single report grows into a repeated workflow.

Once the basic file renders, the best next exercise is to take a small analysis you already understand and rebuild it as a `.qmd` document. Add features only when the reader needs them. A clear question, reproducible computation and careful interpretation matter more than an elaborate template.

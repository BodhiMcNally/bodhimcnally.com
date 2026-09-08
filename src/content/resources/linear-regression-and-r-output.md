---
title: "Linear regression: understanding the model and R output"
description: Build, diagnose and interpret a linear regression model in R, from coefficients and confidence intervals to residuals, assumptions and adjusted predictions.
category: Statistics
tags: [linear regression, R, modelling, coefficients, diagnostics]
published: 2026-09-07
level: Intermediate
software: [R]
estimatedMinutes: 60
featured: true
template: false
draft: false
downloadableAssets: []
---

Linear regression describes how the expected value of a continuous outcome changes with one or more predictors. The calculation is easy to request in R. The harder—and more important—work is deciding what the coefficients mean, whether the model is appropriate and how much uncertainty remains.

Select **Run R** above any code block to fit the model and inspect the actual R output in the browser. Each example loads the data and prerequisite model objects it needs, so it can be run independently.

## The model

For one predictor, the population model is

$$Y_i = \beta_0 + \beta_1X_i + \varepsilon_i.$$

- $Y_i$ is the outcome for observation $i$.
- $X_i$ is its predictor value.
- $\beta_0$ is the expected outcome when $X=0$.
- $\beta_1$ is the expected change in $Y$ for a one-unit increase in $X$.
- $\varepsilon_i$ is the part not explained by the fitted line.

The fitted equation replaces the unknown parameters with estimates:

$$\widehat{Y}_i = b_0+b_1X_i.$$

The residual is $e_i=Y_i-\widehat{Y}_i$. Ordinary least squares chooses the coefficients that minimise the sum of squared residuals.

## Fit a simple model in R

The built-in `mtcars` data make the mechanics reproducible. Here, fuel consumption is the outcome and vehicle weight is the predictor.

```r
model_simple <- lm(mpg ~ wt, data = mtcars)
model_simple
summary(model_simple)
confint(model_simple)
```

The formula is read as “model `mpg` as a function of `wt`”. R measures `wt` in thousands of pounds, so a one-unit change is a 1,000-pound difference.

### Reading the coefficient table

`summary(model_simple)` reports:

| Column | Question it answers |
| --- | --- |
| Estimate | What coefficient did the sample produce? |
| Std. Error | How much sampling uncertainty is attached to that estimate? |
| t value | How many standard errors is the estimate from the null value of zero? |
| Pr(>|t|) | Under the null model, how surprising is a statistic at least this extreme? |

The slope is interpreted in the units of both variables: for each additional 1,000 pounds of vehicle weight, expected fuel economy is estimated to differ by the slope in miles per gallon. It is not a statement that every heavier vehicle changes by exactly that amount.

The intercept is the expected `mpg` when `wt = 0`. That value lies outside the meaningful range for a car, so the intercept is necessary for the line but not substantively useful. Centring the predictor can create a more interpretable intercept.

```r
mtcars$wt_centred <- mtcars$wt - mean(mtcars$wt)
model_centred <- lm(mpg ~ wt_centred, data = mtcars)
coef(model_centred)
```

The slope does not change. The new intercept is expected `mpg` at the sample’s mean weight.

## Confidence intervals and p-values

A 95% confidence interval gives the range of coefficient values compatible with the data and model under the interval procedure. Across repeated samples, 95% of intervals constructed this way would contain the population coefficient.

Do not write “there is a 95% probability that the true coefficient is in this interval” in a conventional frequentist analysis. After an interval is calculated, its endpoints are fixed; the long-run coverage belongs to the method.

A p-value does not give:

- the probability that the null hypothesis is true;
- the probability that the result occurred by chance;
- the size or importance of the association; or
- the probability that another study will replicate it.

Report the estimate and confidence interval first. Statistical compatibility with zero is only one part of interpretation.

## Multiple regression and adjustment

With several predictors,

$$Y_i=\beta_0+\beta_1X_{1i}+\beta_2X_{2i}+\cdots+\varepsilon_i.$$

Each slope is conditional on the other variables included in the model.

```r
model_adjusted <- lm(mpg ~ wt + hp + factor(am), data = mtcars)
summary(model_adjusted)
confint(model_adjusted)
```

The coefficient for `wt` now estimates the mean difference in `mpg` per 1,000-pound difference in weight, comparing vehicles with the same horsepower and transmission category in the fitted model. “Holding other variables constant” describes the mathematical comparison; it does not guarantee that confounding has been eliminated.

### Categorical predictors

R converts factors into indicator variables. One level becomes the reference category.

```r
mtcars$transmission <- factor(
  mtcars$am,
  levels = c(0, 1),
  labels = c("Automatic", "Manual")
)

model_factor <- lm(mpg ~ wt + transmission, data = mtcars)
summary(model_factor)
```

The `transmissionManual` coefficient compares manual with automatic vehicles at the same fitted value of weight. Change the reference category deliberately with `relevel()` when the default comparison is unhelpful.

## Predictions are not residuals

```r
new_vehicles <- data.frame(wt = c(2.5, 3.0, 3.5))

predict(model_simple, newdata = new_vehicles, interval = "confidence")
predict(model_simple, newdata = new_vehicles, interval = "prediction")
```

A confidence interval estimates the mean outcome at each predictor value. A prediction interval concerns a new individual outcome and is wider because it includes individual residual variation as well as uncertainty in the estimated mean.

## Model fit statistics

`summary()` also reports:

- **Residual standard error:** the typical residual scale in outcome units.
- **$R^2$:** the proportion of sample variation in the outcome accounted for by the fitted predictors.
- **Adjusted $R^2$:** an $R^2$ modified for the number of predictors.
- **F-statistic:** a joint test comparing the fitted model with an intercept-only model.

A high $R^2$ does not establish causality, good calibration, lack of bias or useful out-of-sample prediction. A low $R^2$ does not make a precisely estimated scientific association irrelevant.

```r
summary(model_adjusted)$r.squared
summary(model_adjusted)$adj.r.squared
sigma(model_adjusted)
AIC(model_adjusted)
```

Do not compare AIC values from models fitted to different outcomes or different sets of observations.

## Assumptions

Linear regression does not require the predictor or outcome to be normally distributed. The usual inferential procedures rely on assumptions about the model and errors.

1. **Linearity:** the expected outcome is represented adequately by the specified predictor functions.
2. **Independence:** residual dependence is addressed by the design or model.
3. **Constant variance:** the residual spread is reasonably stable across fitted values for conventional standard errors.
4. **Residual distribution:** approximate normality matters mainly for small-sample tests and intervals.
5. **No perfect multicollinearity:** no predictor is an exact linear combination of others.
6. **Correct specification:** important nonlinearities, interactions and design features have not been ignored.

## Diagnose the fitted model

```r
par(mfrow = c(2, 2))
plot(model_adjusted)
par(mfrow = c(1, 1))
```

Use the plots as questions, not pass/fail rituals:

- **Residuals versus fitted:** is the mean structure curved or funnel-shaped?
- **Normal Q–Q:** are residual tails markedly inconsistent with the reference distribution?
- **Scale–location:** does residual spread change with the fitted mean?
- **Residuals versus leverage:** are individual observations disproportionately influential?

```r
head(residuals(model_adjusted))
head(fitted(model_adjusted))
head(hatvalues(model_adjusted))
head(cooks.distance(model_adjusted))
```

An influential observation is not automatically an error. Check its provenance, assess whether the model is sensitive to it and report justified sensitivity analyses.

## Nonlinearity and interaction

```r
model_curve <- lm(mpg ~ wt + I(wt^2), data = mtcars)
model_interaction <- lm(mpg ~ wt * transmission, data = mtcars)

summary(model_curve)
summary(model_interaction)
```

With a squared term, the effect of weight is not one constant number. With an interaction, the slope for weight differs by transmission category. Interpret the combined equation or predicted values rather than reading one coefficient in isolation.

## Missing data and the analysis sample

By default, `lm()` omits rows missing any model variable. Confirm what was analysed.

```r
nrow(mtcars)
nobs(model_adjusted)
model.frame(model_adjusted) |> head()
```

Complete-case analysis is not automatically unbiased. Its consequences depend on why the data are missing and how missingness relates to variables in the analysis.

## A defensible reporting pattern

> After adjustment for horsepower and transmission category, each additional 1,000 pounds of vehicle weight was associated with an estimated **[coefficient] mpg difference** in mean fuel economy (95% CI **[lower] to [upper]**).

Then explain practical meaning, the population represented, important assumptions and whether the design supports causal language.

## Common mistakes

- Interpreting a coefficient without stating units or the comparison.
- Calling association “effect” in an observational analysis without sufficient justification.
- Treating non-significance as evidence of no association.
- Comparing coefficient magnitudes when predictors use different units.
- Selecting predictors solely because their univariable p-values are small.
- Reporting $R^2$ as proof that the model is correct.
- Extrapolating beyond the observed predictor range.
- Ignoring clustering, repeated measurements or study design.

## A complete reproducible example

```r
analysis_data <- transform(
  mtcars,
  transmission = factor(am, c(0, 1), c("Automatic", "Manual")),
  wt_centred = wt - mean(wt)
)

fit <- lm(mpg ~ wt_centred + hp + transmission, data = analysis_data)

summary(fit)
confint(fit)
nobs(fit)

new_data <- data.frame(
  wt_centred = c(-0.5, 0, 0.5),
  hp = 120,
  transmission = factor("Automatic", levels = levels(analysis_data$transmission))
)

predict(fit, newdata = new_data, interval = "confidence")
```

The statistical output is not the conclusion. The conclusion comes from connecting the estimand, design, model, uncertainty and subject matter.

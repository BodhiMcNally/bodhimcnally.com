---
title: "t-tests in R: one-sample, independent and paired"
description: Choose, run and interpret the correct t-test, understand Welch and pooled-variance methods, inspect assumptions and report estimates with confidence intervals.
category: Statistics
tags: [t-test, R, hypothesis testing, confidence intervals, assumptions]
published: 2026-09-07
level: Introductory
software: [R]
estimatedMinutes: 50
featured: true
template: false
draft: false
downloadableAssets: []
---

A t-test compares a mean with a reference value or compares means between two conditions. The three familiar forms answer different questions. Choosing among them depends on the study design, not on which command produces the smallest p-value.

Select **Run R** above any code block to calculate the test and inspect its actual output. The example data are restored automatically for each run, so students can begin at any point in the lesson.

## The common structure

Each t-statistic has the form

$$t=\frac{\text{estimated difference}-\text{null difference}}{\text{standard error of the estimated difference}}.$$

The test asks how far the estimate lies from the null value when measured in estimated standard errors. The t-distribution accounts for uncertainty introduced by estimating the population variance.

## Which t-test?

| Design | Question | R call |
| --- | --- | --- |
| One sample | Does one population mean differ from a reference value? | `t.test(x, mu = value)` |
| Two independent groups | Do two unrelated population means differ? | `t.test(outcome ~ group, data = data)` |
| Paired observations | Does the mean within-pair difference differ from zero? | `t.test(before, after, paired = TRUE)` |

The unit of analysis must remain clear. Two measurements from the same person are not independent groups.

## One-sample t-test

Suppose ten measurements are compared with a reference mean of 100.

```r
measurements <- c(98, 102, 101, 97, 105, 100, 103, 99, 104, 101)

mean(measurements)
sd(measurements)
t.test(measurements, mu = 100)
```

The output gives the t-statistic, degrees of freedom, p-value, confidence interval for the population mean and sample mean. The hypothesis concerns the population mean—not whether individual observations equal 100.

## Independent two-sample t-test

```r
trial <- data.frame(
  group = factor(rep(c("Control", "Intervention"), each = 10)),
  outcome = c(12, 14, 11, 13, 15, 10, 16, 12, 14, 13,
              9, 11, 10, 8, 12, 9, 10, 7, 11, 9)
)

aggregate(outcome ~ group, trial, function(x) c(n = length(x), mean = mean(x), sd = sd(x)))
t.test(outcome ~ group, data = trial)
```

R uses **Welch’s t-test by default**. Welch’s method does not assume equal population variances and adjusts the standard error and degrees of freedom accordingly. It is usually a sound default for independent groups.

Check the sign of the reported difference against the factor-level order. A negative difference is not intrinsically beneficial or harmful; its meaning depends on which group is subtracted from which and on the outcome.

### Pooled-variance t-test

```r
t.test(outcome ~ group, data = trial, var.equal = TRUE)
```

This form assumes equal population variances and pools the two sample variance estimates. Do not choose it merely because a preliminary variance test was non-significant. Such a pretest can have low power and creates an unnecessary two-stage decision. If equal variance is genuinely justified by design and scientific knowledge, state that reasoning.

## Paired t-test

Paired data contain a defensible one-to-one link: before and after measurements on the same participant, matched participants, or measurements on paired experimental units.

```r
before <- c(72, 84, 65, 90, 77, 81, 69, 88)
after  <- c(68, 80, 66, 83, 74, 76, 65, 82)

differences <- before - after
mean(differences)
sd(differences)
t.test(before, after, paired = TRUE)
```

The paired t-test is a one-sample t-test on the within-pair differences. Its distributional assumption concerns those differences, not the two marginal sets of scores separately.

Never remove the pairing and run an independent test. Doing so discards information and uses the wrong standard error.

## Confidence intervals are central

The confidence interval describes the range of mean differences reasonably compatible with the model and data. It conveys direction, magnitude and precision together.

```r
result <- t.test(outcome ~ group, data = trial)
result$estimate
result$conf.int
result$p.value
```

A wide interval spanning differences that would matter clinically indicates uncertainty, even when the p-value is greater than 0.05. A narrow interval around a trivial difference can be statistically incompatible with zero while remaining practically unimportant.

## Assumptions

### Independence

Independence comes primarily from the design. Repeated measures, clustering by class or hospital, and related participants require methods that represent that dependence.

### Outcome scale

The conventional t-test concerns means of a quantitative outcome. An ordinal scale with few categories or a highly bounded distribution may make a mean comparison difficult to defend.

### Distribution and sample size

The t-test is often reasonably robust to moderate non-normality, especially with balanced, adequately sized independent groups. It is less robust to severe skew, extreme outliers and very small samples.

Inspect the data rather than testing normality mechanically.

```r
par(mfrow = c(1, 2))
hist(differences, main = "Paired differences", xlab = "Before − after")
qqnorm(differences)
qqline(differences)
par(mfrow = c(1, 1))
```

A Shapiro–Wilk test does not make the decision for you: small samples may miss consequential departures, while large samples can detect inconsequential ones.

## One-sided and two-sided alternatives

```r
t.test(measurements, mu = 100, alternative = "two.sided")
t.test(measurements, mu = 100, alternative = "greater")
```

Use a one-sided test only when the directional hypothesis was specified before seeing the data and an effect in the opposite direction would be treated as irrelevant for the scientific decision. It is not a rescue operation for a two-sided p-value.

## Effect size

For independent groups, a standardised mean difference expresses the difference in standard-deviation units. It can help comparisons across scales but does not replace the original-unit estimate.

```r
control <- subset(trial, group == "Control")$outcome
intervention <- subset(trial, group == "Intervention")$outcome

pooled_sd <- sqrt(
  ((length(control) - 1) * var(control) +
   (length(intervention) - 1) * var(intervention)) /
  (length(control) + length(intervention) - 2)
)

d <- (mean(intervention) - mean(control)) / pooled_sd
d
```

Interpret standardised differences in context. Generic labels such as “small” and “large” cannot substitute for clinically or educationally meaningful thresholds.

## When a t-test is not enough

Use a model that matches the question when you need to:

- adjust for baseline variables or confounders;
- compare more than two groups;
- represent repeated observations or clusters;
- estimate interactions;
- model a non-continuous outcome;
- address informative missingness; or
- estimate a treatment effect under a more explicit causal framework.

For a randomised trial with baseline and follow-up measurements, modelling follow-up adjusted for baseline is often more efficient than testing raw change scores.

## Reporting templates

**One sample:**

> The sample mean was **[mean] units** (SD **[SD]**), corresponding to an estimated **[difference] unit** difference from the reference value of **[reference]** (95% CI **[lower] to [upper]**, $t(df)=[t]$, $p=[p]$).

**Independent groups:**

> Mean outcome was **[mean 1]** in group 1 and **[mean 2]** in group 2. The estimated mean difference was **[difference] units** (95% CI **[lower] to [upper]**, Welch $t(df)=[t]$, $p=[p]$).

**Paired:**

> The mean within-participant difference from before to after was **[difference] units** (95% CI **[lower] to [upper]**, paired $t(df)=[t]$, $p=[p]$).

Always state the direction of subtraction.

## Common mistakes

- Using an independent test for paired observations.
- Assuming a non-significant result proves equivalence or no difference.
- Reporting only the p-value.
- Confusing a confidence interval for a mean with the spread of individual observations.
- Choosing a one-sided test after inspecting results.
- Running many t-tests across groups or outcomes without addressing multiplicity.
- Removing an outlier solely because it changes significance.
- Treating statistical significance as clinical importance.

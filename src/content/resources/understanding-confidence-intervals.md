---
title: Understanding confidence intervals
description: How to interpret a confidence interval, avoid common errors and calculate a one-sample interval in R.
category: Statistics
tags:
  - confidence intervals
  - uncertainty
  - estimation
published: 2026-09-06
updated: 2026-09-06
level: Introductory
software:
  - R
estimatedMinutes: 12
featured: true
template: false
draft: false
downloadableAssets: []
---

A confidence interval describes the uncertainty around an estimate. The estimate gives one plausible value for the population quantity of interest; the interval shows the range of values reasonably compatible with the sample and the method used.

The difficult part is usually not calculating the interval. It is saying precisely what it means.

## Start with the estimate

Suppose a sample mean is 7.12 hours of sleep. That number is a **point estimate** of the population mean. A different random sample would almost certainly give a slightly different estimate.

A confidence interval makes that sampling uncertainty visible. Many familiar intervals have the form

$$
\text{estimate} \;\pm\; \text{critical value} \times \text{standard error}.
$$

The standard error describes how much the estimate would be expected to vary between samples. The critical value determines how wide the interval must be for the chosen confidence procedure.

## What “95% confidence” means

A 95% confidence interval should be interpreted through repeated sampling:

> If we repeatedly drew samples in the same way and calculated an interval using the same procedure, approximately 95% of those intervals would contain the true population parameter.

For the interval calculated from the sample in front of us, the unknown population parameter is fixed. The interval either contains it or it does not. The 95% refers to the long-run performance of the method, not a probability that can be assigned to the fixed parameter after the interval has been calculated.

In ordinary reporting, a clear contextual interpretation is often sufficient:

> We estimate that the population mean lies between the lower and upper limits of the 95% confidence interval.

This wording communicates the practical conclusion without claiming that 95% of observations lie inside the interval or that there is a 95% probability attached to this particular realised interval.

## Calculate a confidence interval in R

The following illustrative data record average nightly sleep, in hours, for a sample of ten students. This code calculates a 95% $t$ confidence interval for the population mean.

```r
sleep_hours <- c(6.2, 6.8, 7.0, 7.1, 7.3,
                 7.5, 7.8, 6.9, 7.2, 7.4)

n <- length(sleep_hours)
sample_mean <- mean(sleep_hours)
standard_error <- sd(sleep_hours) / sqrt(n)
critical_value <- qt(0.975, df = n - 1)

lower_limit <- sample_mean - critical_value * standard_error
upper_limit <- sample_mean + critical_value * standard_error

result <- c(
  mean = sample_mean,
  lower_95 = lower_limit,
  upper_95 = upper_limit
)

print(round(result, 2))
```

You can compare the manual calculation with R's built-in one-sample $t$ test:

```r
sleep_hours <- c(6.2, 6.8, 7.0, 7.1, 7.3,
                 7.5, 7.8, 6.9, 7.2, 7.4)

t.test(sleep_hours, conf.level = 0.95)$conf.int
```

Each R block on this page can be run in the browser. The first run may take a moment while the R environment loads. The calculation happens on your device; no code or data are sent to this website.

## Four common misinterpretations

| Incorrect interpretation | Why it is incorrect |
| --- | --- |
| “95% of the observations are inside the interval.” | The interval concerns a population parameter, not the spread of individual observations. |
| “There is a 95% probability that the true mean is inside this interval.” | In the frequentist framework, the parameter is fixed and the interval is random before sampling. |
| “A narrow interval proves the estimate is accurate.” | A narrow interval indicates greater precision under the model; bias or poor sampling can still produce a precise but misleading estimate. |
| “Values outside the interval are impossible.” | The interval identifies values less compatible with the data and method, not impossible values. |

## What changes the width?

A confidence interval tends to become narrower when:

- the sample size increases;
- the observations are less variable; or
- a lower confidence level is chosen.

It becomes wider when the data are more variable, the sample is smaller or a higher confidence level is required. Greater confidence requires a wider range because the procedure must capture the true parameter more often in repeated samples.

Use the code below to compare several confidence levels for the same sample:

```r
sleep_hours <- c(6.2, 6.8, 7.0, 7.1, 7.3,
                 7.5, 7.8, 6.9, 7.2, 7.4)

n <- length(sleep_hours)
sample_mean <- mean(sleep_hours)
standard_error <- sd(sleep_hours) / sqrt(n)
confidence_levels <- c(0.90, 0.95, 0.99)

intervals <- sapply(confidence_levels, function(level) {
  alpha <- 1 - level
  critical <- qt(1 - alpha / 2, df = n - 1)
  c(
    lower = sample_mean - critical * standard_error,
    upper = sample_mean + critical * standard_error
  )
})

colnames(intervals) <- paste0(confidence_levels * 100, "%")
print(round(intervals, 2))
```

## Before interpreting an interval

The arithmetic does not check whether the method is appropriate. Ask:

- What population parameter is being estimated?
- How was the sample obtained, and is it reasonable to treat the observations as independent?
- Does the chosen interval rely on distributional assumptions that need to be checked?
- Are the units and context stated in the interpretation?
- Could selection bias, measurement error or missing data matter more than the reported sampling uncertainty?

A well-calculated confidence interval can quantify one source of uncertainty. It cannot repair a poorly designed study or account automatically for every source of error.

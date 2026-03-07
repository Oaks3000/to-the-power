import { runScenario, type RunScenarioOptions, type ScenarioSummary } from "./scenario-runner.js";
import type { ScenarioDefinition } from "./scenarios.js";

export interface ScenarioOutlier {
  seed: number;
  reasons: string[];
}

export interface ScenarioTelemetryAggregates {
  averageRoleTransitionHours: Record<string, number>;
  remediationFrequencyByTopic: Record<string, number>;
  overallCrisisFailureRate: number;
  averageRemediationsPerRun: number;
  totalCrisisFailures: number;
  totalCrisisAttempts: number;
}

export interface ScenarioConfidenceInterval {
  lower: number;
  estimate: number;
  upper: number;
  sampleSize: number;
  method: "wilson" | "normal_approx";
}

export interface ScenarioCohortGate {
  pass: boolean;
  observed: number;
  threshold: number;
  comparator: "<=";
  details: string;
}

export interface ScenarioCohortGates {
  allPass: boolean;
  crisisFailureRateUpperBoundGate: ScenarioCohortGate;
  averageRemediationGate: ScenarioCohortGate;
  averageJuniorTransitionGate: ScenarioCohortGate;
}

export interface ScenarioTelemetryReport {
  scenarioId: string;
  scenarioName: string;
  runCount: number;
  runs: ScenarioSummary[];
  aggregates: ScenarioTelemetryAggregates;
  confidence: {
    crisisFailureRate: ScenarioConfidenceInterval;
    remediationsPerRun: ScenarioConfidenceInterval;
    juniorMinisterTransitionHour: ScenarioConfidenceInterval;
  };
  gates: ScenarioCohortGates;
  outliers: ScenarioOutlier[];
  targets: ScenarioBalanceTargets;
}

export interface RunScenarioSweepOptions extends Omit<RunScenarioOptions, "seed"> {
  seeds: Array<number | string>;
  targets?: Partial<ScenarioBalanceTargets>;
}

export interface ScenarioBalanceTargets {
  maxRemediationsPerRun: number;
  maxAverageRemediationsPerRun: number;
  maxCrisisFailureRate: number;
  maxCrisisFailureRateUpperBoundMargin: number;
  maxJuniorMinisterTransitionHour: number;
}

interface NumericStats {
  mean: number;
  stdDev: number;
}

const Z_95 = 1.96;

function buildNumericStats(values: number[]): NumericStats {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

function mergeAverageByKey(buckets: Record<string, number[]>): Record<string, number> {
  const output: Record<string, number> = {};
  for (const [key, values] of Object.entries(buckets)) {
    if (values.length === 0) {
      continue;
    }
    output[key] = values.reduce((total, value) => total + value, 0) / values.length;
  }
  return output;
}

function computeAggregates(runs: ScenarioSummary[]): ScenarioTelemetryAggregates {
  const transitionBuckets: Record<string, number[]> = {};
  const remediationBuckets: Record<string, number[]> = {};
  let totalCrisisFailures = 0;
  let totalCrisisAttempts = 0;
  let totalRemediations = 0;

  for (const run of runs) {
    for (const [role, hour] of Object.entries(run.metrics.roleTransitionHours)) {
      if (!transitionBuckets[role]) {
        transitionBuckets[role] = [];
      }
      transitionBuckets[role].push(hour);
    }

    for (const [topic, count] of Object.entries(run.metrics.remediationByTopic)) {
      if (!remediationBuckets[topic]) {
        remediationBuckets[topic] = [];
      }
      remediationBuckets[topic].push(count);
    }

    totalRemediations += run.metrics.remediationCount;
    totalCrisisFailures += run.metrics.crisisFailureCount;
    totalCrisisAttempts += run.metrics.totalCrisisAttempts;
  }

  return {
    averageRoleTransitionHours: mergeAverageByKey(transitionBuckets),
    remediationFrequencyByTopic: mergeAverageByKey(remediationBuckets),
    overallCrisisFailureRate: totalCrisisAttempts === 0 ? 0 : totalCrisisFailures / totalCrisisAttempts,
    averageRemediationsPerRun: runs.length === 0 ? 0 : totalRemediations / runs.length,
    totalCrisisFailures,
    totalCrisisAttempts
  };
}

function buildTargets(targets: Partial<ScenarioBalanceTargets> = {}): ScenarioBalanceTargets {
  return {
    maxRemediationsPerRun: targets.maxRemediationsPerRun ?? 4,
    maxAverageRemediationsPerRun: targets.maxAverageRemediationsPerRun ?? 2,
    maxCrisisFailureRate: targets.maxCrisisFailureRate ?? 0.55,
    maxCrisisFailureRateUpperBoundMargin: targets.maxCrisisFailureRateUpperBoundMargin ?? 0.05,
    maxJuniorMinisterTransitionHour: targets.maxJuniorMinisterTransitionHour ?? 192
  };
}

function computeWilsonInterval(numerator: number, denominator: number, z: number = Z_95): ScenarioConfidenceInterval {
  if (denominator <= 0) {
    return {
      lower: 0,
      estimate: 0,
      upper: 0,
      sampleSize: 0,
      method: "wilson"
    };
  }

  const estimate = numerator / denominator;
  const z2 = z * z;
  const adjustedDenominator = 1 + (z2 / denominator);
  const center = (estimate + (z2 / (2 * denominator))) / adjustedDenominator;
  const spread = (z * Math.sqrt((estimate * (1 - estimate) / denominator) + (z2 / (4 * denominator * denominator)))) / adjustedDenominator;

  return {
    lower: Math.max(0, center - spread),
    estimate,
    upper: Math.min(1, center + spread),
    sampleSize: denominator,
    method: "wilson"
  };
}

function computeMeanInterval(values: number[], z: number = Z_95): ScenarioConfidenceInterval {
  if (values.length === 0) {
    return {
      lower: 0,
      estimate: 0,
      upper: 0,
      sampleSize: 0,
      method: "normal_approx"
    };
  }

  const stats = buildNumericStats(values);
  const margin = values.length <= 1 ? 0 : (z * (stats.stdDev / Math.sqrt(values.length)));

  return {
    lower: Math.max(0, stats.mean - margin),
    estimate: stats.mean,
    upper: stats.mean + margin,
    sampleSize: values.length,
    method: "normal_approx"
  };
}

function computeConfidence(
  runs: ScenarioSummary[],
  aggregates: ScenarioTelemetryAggregates
): ScenarioTelemetryReport["confidence"] {
  const remediationValues = runs.map((run) => run.metrics.remediationCount);
  const juniorTransitionValues = runs
    .map((run) => run.metrics.roleTransitionHours.junior_minister)
    .filter((value): value is number => typeof value === "number");

  return {
    crisisFailureRate: computeWilsonInterval(aggregates.totalCrisisFailures, aggregates.totalCrisisAttempts),
    remediationsPerRun: computeMeanInterval(remediationValues),
    juniorMinisterTransitionHour: computeMeanInterval(juniorTransitionValues)
  };
}

function evaluateCohortGates(
  aggregates: ScenarioTelemetryAggregates,
  confidence: ScenarioTelemetryReport["confidence"],
  targets: ScenarioBalanceTargets
): ScenarioCohortGates {
  const crisisThreshold = targets.maxCrisisFailureRate + targets.maxCrisisFailureRateUpperBoundMargin;
  const crisisGate: ScenarioCohortGate = {
    pass: confidence.crisisFailureRate.upper <= crisisThreshold,
    observed: confidence.crisisFailureRate.upper,
    threshold: crisisThreshold,
    comparator: "<=",
    details: `95% upper bound ${(confidence.crisisFailureRate.upper * 100).toFixed(1)}% vs limit ${(crisisThreshold * 100).toFixed(1)}%`
  };

  const remediationGate: ScenarioCohortGate = {
    pass: aggregates.averageRemediationsPerRun <= targets.maxAverageRemediationsPerRun,
    observed: aggregates.averageRemediationsPerRun,
    threshold: targets.maxAverageRemediationsPerRun,
    comparator: "<=",
    details: `average remediations ${aggregates.averageRemediationsPerRun.toFixed(2)} vs limit ${targets.maxAverageRemediationsPerRun.toFixed(2)}`
  };

  const juniorObserved = confidence.juniorMinisterTransitionHour.estimate;
  const juniorGate: ScenarioCohortGate = {
    pass: confidence.juniorMinisterTransitionHour.sampleSize > 0 && juniorObserved <= targets.maxJuniorMinisterTransitionHour,
    observed: juniorObserved,
    threshold: targets.maxJuniorMinisterTransitionHour,
    comparator: "<=",
    details: confidence.juniorMinisterTransitionHour.sampleSize > 0
      ? `average junior_minister transition ${juniorObserved.toFixed(1)}h vs limit ${targets.maxJuniorMinisterTransitionHour.toFixed(1)}h`
      : "no junior_minister transitions observed"
  };

  return {
    allPass: crisisGate.pass && remediationGate.pass && juniorGate.pass,
    crisisFailureRateUpperBoundGate: crisisGate,
    averageRemediationGate: remediationGate,
    averageJuniorTransitionGate: juniorGate
  };
}

function isSignificantRateExceedance(rate: number, target: number, attempts: number): boolean {
  if (attempts <= 0) {
    return false;
  }

  // Small denominators create coarse rates (for example 5 attempts => 0.20 steps).
  // Require a larger exceedance margin when attempts are low to avoid false-positive outliers.
  const requiredMargin = Math.max(0.05, 1 / attempts);
  return rate > (target + requiredMargin);
}

export function detectScenarioOutliers(
  runs: ScenarioSummary[],
  inputTargets: Partial<ScenarioBalanceTargets> = {}
): ScenarioOutlier[] {
  if (runs.length < 2) {
    return [];
  }
  const targets = buildTargets(inputTargets);

  const remediationStats = buildNumericStats(runs.map((run) => run.metrics.remediationCount));
  const crisisRateStats = buildNumericStats(runs.map((run) => run.metrics.crisisFailureRate));
  const juniorPromotionHours = runs
    .map((run) => run.metrics.roleTransitionHours.junior_minister)
    .filter((value): value is number => typeof value === "number");
  const juniorStats = buildNumericStats(juniorPromotionHours);

  return runs.flatMap((run) => {
    const reasons: string[] = [];

    if (
      (remediationStats.stdDev > 0 && run.metrics.remediationCount > remediationStats.mean + (1.5 * remediationStats.stdDev))
      || run.metrics.remediationCount > targets.maxRemediationsPerRun
    ) {
      reasons.push(
        `remediations unusually high (${run.metrics.remediationCount}; target <= ${targets.maxRemediationsPerRun}; avg ${remediationStats.mean.toFixed(2)})`
      );
    }

    if (
      (crisisRateStats.stdDev > 0 && run.metrics.crisisFailureRate > crisisRateStats.mean + (1.5 * crisisRateStats.stdDev))
      || isSignificantRateExceedance(
        run.metrics.crisisFailureRate,
        targets.maxCrisisFailureRate,
        run.metrics.totalCrisisAttempts
      )
    ) {
      reasons.push(
        `crisis failure rate unusually high (${(run.metrics.crisisFailureRate * 100).toFixed(1)}%; target <= ${(targets.maxCrisisFailureRate * 100).toFixed(1)}%; avg ${(crisisRateStats.mean * 100).toFixed(1)}%)`
      );
    }

    const juniorPromotionHour = run.metrics.roleTransitionHours.junior_minister;
    if (
      (juniorStats.stdDev > 0 && typeof juniorPromotionHour === "number" && juniorPromotionHour > juniorStats.mean + (1.5 * juniorStats.stdDev))
      || (typeof juniorPromotionHour === "number" && juniorPromotionHour > targets.maxJuniorMinisterTransitionHour)
    ) {
      reasons.push(
        `junior_minister promotion unusually late (${juniorPromotionHour}h; target <= ${targets.maxJuniorMinisterTransitionHour}h; avg ${juniorStats.mean.toFixed(1)}h)`
      );
    }

    return reasons.length === 0 ? [] : [{ seed: run.seed, reasons }];
  });
}

export function buildScenarioTelemetryReport(
  scenario: ScenarioDefinition,
  runs: ScenarioSummary[],
  targets: Partial<ScenarioBalanceTargets> = {}
): ScenarioTelemetryReport {
  const resolvedTargets = buildTargets(targets);
  const aggregates = computeAggregates(runs);
  const confidence = computeConfidence(runs, aggregates);
  const gates = evaluateCohortGates(aggregates, confidence, resolvedTargets);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    runCount: runs.length,
    runs,
    aggregates,
    confidence,
    gates,
    outliers: detectScenarioOutliers(runs, resolvedTargets),
    targets: resolvedTargets
  };
}

export async function runScenarioSweep(
  scenario: ScenarioDefinition,
  options: RunScenarioSweepOptions
): Promise<ScenarioTelemetryReport> {
  const runs: ScenarioSummary[] = [];
  for (const seed of options.seeds) {
    const runOptions: RunScenarioOptions = { seed };
    if (options.contentPath !== undefined) {
      runOptions.contentPath = options.contentPath;
    }
    const run = await runScenario(scenario, runOptions);
    runs.push(run);
  }
  return buildScenarioTelemetryReport(scenario, runs, options.targets);
}

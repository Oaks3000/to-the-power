import { DEFAULT_BALANCING_SCENARIO } from "../application/scenarios.js";
import { runScenario } from "../application/scenario-runner.js";
import { runScenarioSweep } from "../application/scenario-telemetry.js";

interface CliArgs {
  seed?: string | number;
  seeds?: Array<string | number>;
  maxCrisisFailureRate?: number;
  maxRemediations?: number;
  maxAvgRemediations?: number;
  maxJuniorHour?: number;
  crisisCiMargin?: number;
}

function parseOptionalNumberArg(args: string[], key: string): number | undefined {
  const raw = args.find((arg) => arg.startsWith(`${key}=`));
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw.slice((`${key}=`).length));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const maxCrisisFailureRate = parseOptionalNumberArg(args, "--max-crisis-failure-rate");
  const maxRemediations = parseOptionalNumberArg(args, "--max-remediations");
  const maxAvgRemediations = parseOptionalNumberArg(args, "--max-avg-remediations");
  const maxJuniorHour = parseOptionalNumberArg(args, "--max-junior-hour");
  const crisisCiMargin = parseOptionalNumberArg(args, "--crisis-ci-margin");

  const withTargets = (base: CliArgs): CliArgs => {
    const next: CliArgs = { ...base };
    if (maxCrisisFailureRate !== undefined) {
      next.maxCrisisFailureRate = maxCrisisFailureRate;
    }
    if (maxRemediations !== undefined) {
      next.maxRemediations = maxRemediations;
    }
    if (maxAvgRemediations !== undefined) {
      next.maxAvgRemediations = maxAvgRemediations;
    }
    if (maxJuniorHour !== undefined) {
      next.maxJuniorHour = maxJuniorHour;
    }
    if (crisisCiMargin !== undefined) {
      next.crisisCiMargin = crisisCiMargin;
    }
    return next;
  };

  const seedsArg = args.find((arg) => arg.startsWith("--seeds="));
  if (seedsArg) {
    const raw = seedsArg.slice("--seeds=".length);
    const seeds = raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => {
        const numeric = Number(item);
        return Number.isFinite(numeric) ? numeric : item;
      });
    if (seeds.length > 0) {
      return withTargets({ seeds });
    }
  }

  const seedArg = args.find((arg) => arg.startsWith("--seed="));
  if (!seedArg) {
    return {};
  }

  const raw = seedArg.slice("--seed=".length);
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return withTargets({ seed: numeric });
  }
  return withTargets({ seed: raw });
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv);
  if (args.seeds && args.seeds.length > 0) {
    const targets: {
      maxCrisisFailureRate?: number;
      maxRemediationsPerRun?: number;
      maxAverageRemediationsPerRun?: number;
      maxJuniorMinisterTransitionHour?: number;
      maxCrisisFailureRateUpperBoundMargin?: number;
    } = {};

    if (args.maxCrisisFailureRate !== undefined) {
      targets.maxCrisisFailureRate = args.maxCrisisFailureRate;
    }
    if (args.maxRemediations !== undefined) {
      targets.maxRemediationsPerRun = args.maxRemediations;
    }
    if (args.maxAvgRemediations !== undefined) {
      targets.maxAverageRemediationsPerRun = args.maxAvgRemediations;
    }
    if (args.maxJuniorHour !== undefined) {
      targets.maxJuniorMinisterTransitionHour = args.maxJuniorHour;
    }
    if (args.crisisCiMargin !== undefined) {
      targets.maxCrisisFailureRateUpperBoundMargin = args.crisisCiMargin;
    }

    const report = await runScenarioSweep(DEFAULT_BALANCING_SCENARIO, {
      seeds: args.seeds,
      targets
    });

    console.log(`Scenario sweep: ${report.scenarioName} (${report.scenarioId})`);
    console.log(`Runs: ${report.runCount}`);
    console.log(`Targets: ${JSON.stringify(report.targets)}`);
    console.log(`Overall crisis failure rate: ${(report.aggregates.overallCrisisFailureRate * 100).toFixed(1)}%`);
    console.log(`Average remediations/run: ${report.aggregates.averageRemediationsPerRun.toFixed(2)}`);
    console.log(`Average role transition hours: ${JSON.stringify(report.aggregates.averageRoleTransitionHours)}`);
    console.log(`Average remediation frequency by topic: ${JSON.stringify(report.aggregates.remediationFrequencyByTopic)}`);
    console.log(
      `Crisis failure rate CI95: ${(report.confidence.crisisFailureRate.lower * 100).toFixed(1)}%-${(report.confidence.crisisFailureRate.upper * 100).toFixed(1)}%`
    );
    console.log(
      `Remediations/run CI95: ${report.confidence.remediationsPerRun.lower.toFixed(2)}-${report.confidence.remediationsPerRun.upper.toFixed(2)}`
    );
    console.log(
      `Junior transition hour CI95: ${report.confidence.juniorMinisterTransitionHour.lower.toFixed(1)}-${report.confidence.juniorMinisterTransitionHour.upper.toFixed(1)}`
    );

    console.log(`Cohort gates: ${report.gates.allPass ? "PASS" : "FAIL"}`);
    console.log(`  crisis CI upper gate: ${report.gates.crisisFailureRateUpperBoundGate.pass ? "PASS" : "FAIL"} (${report.gates.crisisFailureRateUpperBoundGate.details})`);
    console.log(`  avg remediation gate: ${report.gates.averageRemediationGate.pass ? "PASS" : "FAIL"} (${report.gates.averageRemediationGate.details})`);
    console.log(`  avg junior transition gate: ${report.gates.averageJuniorTransitionGate.pass ? "PASS" : "FAIL"} (${report.gates.averageJuniorTransitionGate.details})`);

    if (report.outliers.length === 0) {
      console.log("Outliers: none");
    } else {
      console.log("Outliers:");
      for (const outlier of report.outliers) {
        console.log(`  seed ${outlier.seed}: ${outlier.reasons.join("; ")}`);
      }
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const options = args.seed !== undefined ? { seed: args.seed } : {};
  const summary = await runScenario(DEFAULT_BALANCING_SCENARIO, options);

  console.log(`Scenario: ${summary.scenarioName} (${summary.scenarioId})`);
  console.log(`Seed: ${summary.seed}`);
  console.log(`Steps: ${summary.steps.length}`);
  console.log(`Role progression: ${summary.metrics.roleProgression.join(" -> ") || "none"}`);
  console.log(`Tempo shifts: ${summary.metrics.tempoShifts.join(" -> ") || "none"}`);
  console.log(`Remediations: ${summary.metrics.remediationCount}`);
  console.log(`Crisis failures: ${summary.metrics.crisisFailureCount}`);
  console.log(`Total challenge attempts: ${summary.metrics.totalChallengeAttempts}`);
  console.log(`Final hour: ${summary.finalState.timeHours}`);
  console.log(`Event log entries: ${summary.metrics.eventLogEntries}`);
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

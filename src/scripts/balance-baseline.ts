import { DEFAULT_BALANCING_SCENARIO } from "../application/scenarios.js";
import { runScenarioSweep } from "../application/scenario-telemetry.js";

async function run(): Promise<void> {
  const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
  const targets = {
    maxRemediationsPerRun: 3,
    maxAverageRemediationsPerRun: 2,
    maxCrisisFailureRate: 0.35,
    maxCrisisFailureRateUpperBoundMargin: 0.05,
    maxJuniorMinisterTransitionHour: 120
  };

  const report = await runScenarioSweep(DEFAULT_BALANCING_SCENARIO, { seeds, targets });

  console.log(`Scenario: ${report.scenarioName} (${report.scenarioId})`);
  console.log(`Runs: ${report.runCount}`);
  console.log(`Targets: ${JSON.stringify(report.targets)}`);
  console.log(`Overall crisis failure rate: ${(report.aggregates.overallCrisisFailureRate * 100).toFixed(1)}%`);
  console.log(`Average remediations/run: ${report.aggregates.averageRemediationsPerRun.toFixed(2)}`);
  console.log(`Average role transition hours: ${JSON.stringify(report.aggregates.averageRoleTransitionHours)}`);
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

  console.log(`Outlier count: ${report.outliers.length}`);

  if (report.outliers.length > 0) {
    const preview = report.outliers.slice(0, 10);
    console.log("Outlier preview:");
    for (const outlier of preview) {
      console.log(`  seed ${outlier.seed}: ${outlier.reasons.join("; ")}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildScenarioTelemetryReport, detectScenarioOutliers, runScenarioSweep } from "../application/scenario-telemetry.js";
import { DEFAULT_BALANCING_SCENARIO } from "../application/scenarios.js";
function makeSummary(seed, overrides = {}) {
    return {
        scenarioId: "synthetic",
        scenarioName: "Synthetic",
        seed,
        steps: [],
        metrics: {
            roleProgression: [],
            roleTransitionHours: {},
            tempoShifts: [],
            remediationCount: 0,
            remediationByTopic: {},
            crisisFailureCount: 0,
            totalCrisisAttempts: 1,
            crisisFailureRate: 0,
            totalChallengeAttempts: 0,
            totalHoursAdvanced: 0,
            eventLogEntries: 0,
            ...overrides
        },
        finalState: {
            schoolYear: "Y9",
            currentRole: "backbencher",
            currentTempo: "parliamentary",
            timeHours: 0,
            partyLoyaltyScore: 50,
            publicApproval: 50,
            pressRelationship: 50,
            darkIndex: 0,
            pendingRemediations: 0
        }
    };
}
test("scenario sweep reports deterministic aggregate metrics", async () => {
    const reportA = await runScenarioSweep(DEFAULT_BALANCING_SCENARIO, { seeds: [1, 2, 3] });
    const reportB = await runScenarioSweep(DEFAULT_BALANCING_SCENARIO, { seeds: [1, 2, 3] });
    assert.deepEqual(reportA, reportB);
    assert.equal(reportA.runCount, 3);
    assert.equal(Number.isFinite(reportA.aggregates.overallCrisisFailureRate), true);
    assert.equal(reportA.confidence.crisisFailureRate.sampleSize > 0, true);
});
test("detectScenarioOutliers flags extreme runs", () => {
    const runs = [
        makeSummary(1, { remediationCount: 1, crisisFailureRate: 0.2, roleTransitionHours: { junior_minister: 60 } }),
        makeSummary(2, { remediationCount: 1, crisisFailureRate: 0.25, roleTransitionHours: { junior_minister: 62 } }),
        makeSummary(3, { remediationCount: 1, crisisFailureRate: 0.3, roleTransitionHours: { junior_minister: 58 } }),
        makeSummary(999, { remediationCount: 9, crisisFailureRate: 0.95, roleTransitionHours: { junior_minister: 300 } })
    ];
    const outliers = detectScenarioOutliers(runs, {
        maxCrisisFailureRate: 0.5,
        maxRemediationsPerRun: 4,
        maxJuniorMinisterTransitionHour: 120
    });
    assert.equal(outliers.some((entry) => entry.seed === 999), true);
});
test("buildScenarioTelemetryReport includes average role transitions", () => {
    const runs = [
        makeSummary(1, { roleTransitionHours: { pps: 30, junior_minister: 60 }, remediationByTopic: { percentages: 1 } }),
        makeSummary(2, { roleTransitionHours: { pps: 40, junior_minister: 80 }, remediationByTopic: { percentages: 3 } })
    ];
    const report = buildScenarioTelemetryReport(DEFAULT_BALANCING_SCENARIO, runs, {
        maxCrisisFailureRate: 0.45,
        maxRemediationsPerRun: 3,
        maxAverageRemediationsPerRun: 2,
        maxJuniorMinisterTransitionHour: 100
    });
    assert.equal(report.aggregates.averageRoleTransitionHours.pps, 35);
    assert.equal(report.aggregates.averageRoleTransitionHours.junior_minister, 70);
    assert.equal(report.aggregates.remediationFrequencyByTopic.percentages, 2);
    assert.equal(report.targets.maxCrisisFailureRate, 0.45);
    assert.equal(report.targets.maxRemediationsPerRun, 3);
    assert.equal(report.targets.maxAverageRemediationsPerRun, 2);
    assert.equal(report.targets.maxJuniorMinisterTransitionHour, 100);
});
test("cohort gates pass for healthy synthetic cohort", () => {
    const runs = [
        makeSummary(1, {
            remediationCount: 1,
            crisisFailureCount: 4,
            totalCrisisAttempts: 20,
            crisisFailureRate: 0.2,
            roleTransitionHours: { junior_minister: 80 }
        }),
        makeSummary(2, {
            remediationCount: 2,
            crisisFailureCount: 6,
            totalCrisisAttempts: 20,
            crisisFailureRate: 0.3,
            roleTransitionHours: { junior_minister: 90 }
        })
    ];
    const report = buildScenarioTelemetryReport(DEFAULT_BALANCING_SCENARIO, runs, {
        maxCrisisFailureRate: 0.4,
        maxCrisisFailureRateUpperBoundMargin: 0.1,
        maxAverageRemediationsPerRun: 2,
        maxRemediationsPerRun: 4,
        maxJuniorMinisterTransitionHour: 120
    });
    assert.equal(report.gates.allPass, true);
    assert.equal(report.confidence.crisisFailureRate.sampleSize, 40);
    assert.equal(report.gates.crisisFailureRateUpperBoundGate.pass, true);
    assert.equal(report.gates.averageRemediationGate.pass, true);
    assert.equal(report.gates.averageJuniorTransitionGate.pass, true);
});
test("cohort gates fail for unhealthy synthetic cohort", () => {
    const runs = [
        makeSummary(1, {
            remediationCount: 4,
            crisisFailureCount: 10,
            totalCrisisAttempts: 12,
            crisisFailureRate: 10 / 12,
            roleTransitionHours: { junior_minister: 180 }
        }),
        makeSummary(2, {
            remediationCount: 3,
            crisisFailureCount: 9,
            totalCrisisAttempts: 12,
            crisisFailureRate: 9 / 12,
            roleTransitionHours: { junior_minister: 170 }
        })
    ];
    const report = buildScenarioTelemetryReport(DEFAULT_BALANCING_SCENARIO, runs, {
        maxCrisisFailureRate: 0.35,
        maxCrisisFailureRateUpperBoundMargin: 0.05,
        maxAverageRemediationsPerRun: 2,
        maxRemediationsPerRun: 3,
        maxJuniorMinisterTransitionHour: 120
    });
    assert.equal(report.gates.allPass, false);
    assert.equal(report.gates.crisisFailureRateUpperBoundGate.pass, false);
    assert.equal(report.gates.averageRemediationGate.pass, false);
    assert.equal(report.gates.averageJuniorTransitionGate.pass, false);
});
test("runScenarioSweep applies target thresholds to outlier detection", async () => {
    const report = await runScenarioSweep(DEFAULT_BALANCING_SCENARIO, {
        seeds: [1, 2, 3, 999],
        targets: {
            maxCrisisFailureRate: 0.1,
            maxRemediationsPerRun: 1,
            maxJuniorMinisterTransitionHour: 100
        }
    });
    assert.equal(report.targets.maxCrisisFailureRate, 0.1);
    assert.equal(report.outliers.length > 0, true);
});

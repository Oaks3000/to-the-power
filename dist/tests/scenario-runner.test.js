import assert from "node:assert/strict";
import test from "node:test";
import { runScenario } from "../application/scenario-runner.js";
import { DEFAULT_BALANCING_SCENARIO } from "../application/scenarios.js";
test("scenario runner is deterministic with same seed", async () => {
    const a = await runScenario(DEFAULT_BALANCING_SCENARIO, { seed: 42 });
    const b = await runScenario(DEFAULT_BALANCING_SCENARIO, { seed: 42 });
    assert.deepEqual(a, b);
});
test("scenario runner diverges for different seeds", async () => {
    const a = await runScenario(DEFAULT_BALANCING_SCENARIO, { seed: 42 });
    const b = await runScenario(DEFAULT_BALANCING_SCENARIO, { seed: 99 });
    assert.notDeepEqual(a.steps.map((step) => step.challengeCorrect), b.steps.map((step) => step.challengeCorrect));
});

import assert from "node:assert/strict";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
test("transition bands use 2-error remediation threshold until exposure matures", () => {
    let state = createInitialGameState("Y11");
    state = applyEvent(state, {
        type: "RoleChanged",
        atHour: state.timeHours,
        payload: { role: "junior_minister" }
    });
    state = applyEvent(state, {
        type: "ChallengeAttempted",
        atHour: state.timeHours,
        payload: { topic: "quadratics_basic", correct: false }
    });
    state = applyEvent(state, {
        type: "ChallengeAttempted",
        atHour: state.timeHours,
        payload: { topic: "quadratics_basic", correct: false }
    });
    assert.equal(state.pendingRemediations.length, 1);
    assert.equal(state.pendingRemediations[0]?.thresholdUsed, 2);
});

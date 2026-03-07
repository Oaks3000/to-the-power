import assert from "node:assert/strict";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
test("timed challenges expire on time advance and apply media penalty", () => {
    let state = createInitialGameState("Y9");
    state = applyEvent(state, {
        type: "TimedChallengeStarted",
        atHour: state.timeHours,
        payload: { challengeId: "pmqs-1", timerHours: 6 }
    });
    const initialApproval = state.publicApproval;
    const initialPress = state.pressRelationship;
    state = applyEvent(state, {
        type: "TimeAdvanced",
        atHour: state.timeHours,
        payload: { hours: 6 }
    });
    assert.equal(state.activeTimedChallenges["pmqs-1"], undefined);
    assert.equal(state.publicApproval, initialApproval - 2);
    assert.equal(state.pressRelationship, initialPress - 3);
});

import assert from "node:assert/strict";
import test from "node:test";
import { executeCommand } from "../domain/commands.js";
import { createInitialGameState } from "../domain/state.js";
test("challenge consequences apply mode+tempo specific deltas", () => {
    let state = createInitialGameState("Y9");
    state = executeCommand(state, { type: "change_tempo", tempo: "crisis" });
    state = executeCommand(state, {
        type: "submit_challenge_answer",
        topic: "percentages",
        correct: true,
        mode: "crisis"
    });
    assert.equal(state.partyLoyaltyScore, 53);
    assert.equal(state.publicApproval, 53);
    assert.equal(state.pressRelationship, 52);
    assert.equal(state.darkIndex, 0);
    assert.equal(state.departmentalCompetence.percentages, 53);
});
test("challenge consequences default to decision mode for legacy events", () => {
    let state = createInitialGameState("Y9");
    state = executeCommand(state, { type: "change_tempo", tempo: "media_storm" });
    state = executeCommand(state, {
        type: "submit_challenge_answer",
        topic: "statistics_basic",
        correct: false
    });
    assert.equal(state.publicApproval, 49);
    assert.equal(state.pressRelationship, 47);
    assert.equal(state.darkIndex, 2);
    assert.equal(state.departmentalCompetence.statistics_basic, 49);
});

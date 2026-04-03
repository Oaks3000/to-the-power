import assert from "node:assert/strict";
import test from "node:test";
import { buildRetrospectiveReport, evaluateEndingState } from "../application/retrospective.js";
import { executeCommand } from "../domain/commands.js";
import { createInitialGameState } from "../domain/state.js";
test("retrospective report is deterministic for fixed event log and timestamp", () => {
    let state = createInitialGameState("Y9");
    state = executeCommand(state, { type: "change_role", role: "pps" });
    state = executeCommand(state, { type: "submit_challenge_answer", topic: "percentages", correct: true, mode: "decision" });
    state = executeCommand(state, { type: "advance_time", hours: 3 });
    state = executeCommand(state, { type: "submit_challenge_answer", topic: "percentages", correct: false, mode: "crisis" });
    const fixedNow = new Date("2026-03-31T12:00:00.000Z");
    const reportA = buildRetrospectiveReport(state, { runId: "det-1", playerAlias: "tester", now: fixedNow });
    const reportB = buildRetrospectiveReport(state, { runId: "det-1", playerAlias: "tester", now: fixedNow });
    assert.deepEqual(reportA, reportB);
    assert.equal(reportA.replay.deterministic, true);
    assert.equal(reportA.eventCounts.ChallengeAttempted, 2);
});
test("legacy score model penalizes dark index escalation", () => {
    let state = createInitialGameState("Y10");
    state = executeCommand(state, { type: "submit_challenge_answer", topic: "ratio_proportion", correct: true, mode: "gate" });
    const baseline = buildRetrospectiveReport(state, { now: new Date("2026-04-01T12:00:00.000Z") });
    state = executeCommand(state, { type: "change_dark_index", delta: 30 });
    const escalated = buildRetrospectiveReport(state, { now: new Date("2026-04-01T12:00:00.000Z") });
    assert.equal(escalated.legacy.score < baseline.legacy.score, true);
});
test("ending evaluation detects voted_out", () => {
    const state = createInitialGameState("Y10");
    state.publicApproval = 28;
    state.constituencyApproval = 19;
    const ending = evaluateEndingState(state);
    assert.equal(ending.outcome, "voted_out");
});
test("ending evaluation detects sacked for ministerial confidence collapse", () => {
    let state = createInitialGameState("Y10");
    state = executeCommand(state, { type: "change_role", role: "cabinet" });
    state.partyLoyaltyScore = 20;
    const ending = evaluateEndingState(state);
    assert.equal(ending.outcome, "sacked");
});
test("ending evaluation detects resigned under critical risk pressure", () => {
    const state = createInitialGameState("Y11");
    state.darkIndex = 90;
    state.pressRelationship = 30;
    const ending = evaluateEndingState(state);
    assert.equal(ending.outcome, "resigned");
});
test("ending evaluation detects election_defeat at election checkpoint", () => {
    const state = createInitialGameState("Y11");
    state.timeHours = 100;
    state.publicApproval = 34;
    state.constituencyApproval = 35;
    const ending = evaluateEndingState(state);
    assert.equal(ending.outcome, "election_defeat");
});
test("ending precedence resolves conflicts deterministically", () => {
    let state = createInitialGameState("Y11");
    state = executeCommand(state, { type: "change_role", role: "cabinet" });
    state.timeHours = 140;
    state.publicApproval = 20;
    state.constituencyApproval = 15;
    state.partyLoyaltyScore = 20;
    state.darkIndex = 90;
    state.pressRelationship = 30;
    const ending = evaluateEndingState(state);
    assert.equal(ending.outcome, "resigned");
});
test("retrospective report includes ending taxonomy output", () => {
    const state = createInitialGameState("Y9");
    state.publicApproval = 26;
    state.constituencyApproval = 18;
    const report = buildRetrospectiveReport(state, { now: new Date("2026-04-03T08:00:00.000Z") });
    assert.equal(report.summary.ending.outcome, "voted_out");
    assert.equal(typeof report.summary.ending.title, "string");
    assert.equal(typeof report.summary.ending.detail, "string");
});

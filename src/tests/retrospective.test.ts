import assert from "node:assert/strict";
import test from "node:test";
import { buildRetrospectiveReport } from "../application/retrospective.js";
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

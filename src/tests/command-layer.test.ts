import assert from "node:assert/strict";
import test from "node:test";
import { CommandError, executeCommand } from "../domain/commands.js";
import { createInitialGameState } from "../domain/state.js";

test("executeCommand routes challenge attempts through event pipeline", () => {
  let state = createInitialGameState("Y11");

  state = executeCommand(state, { type: "change_role", role: "junior_minister" });
  state = executeCommand(state, { type: "submit_challenge_answer", topic: "quadratics_basic", correct: false });
  state = executeCommand(state, { type: "submit_challenge_answer", topic: "quadratics_basic", correct: false });

  assert.equal(state.pendingRemediations.length, 1);
  assert.equal(state.pendingRemediations[0]?.topic, "quadratics_basic");
});

test("starting an already active timed challenge raises CommandError", () => {
  let state = createInitialGameState("Y9");

  state = executeCommand(state, { type: "start_timed_challenge", challengeId: "pmqs-1", timerHours: 1 });

  assert.throws(
    () => executeCommand(state, { type: "start_timed_challenge", challengeId: "pmqs-1", timerHours: 1 }),
    (error: unknown) => error instanceof CommandError
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { executeCommandWithResult } from "../domain/commands.js";
import { createInitialGameState } from "../domain/state.js";
test("advance_time returns LARGE_TIME_ADVANCE warning for oversized jump", () => {
    const state = createInitialGameState("Y9");
    const result = executeCommandWithResult(state, { type: "advance_time", hours: 999 });
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0]?.type, "TimeAdvanced");
    assert.equal(result.warnings.some((warning) => warning.code === "LARGE_TIME_ADVANCE"), true);
});
test("no-op command returns NO_OP warning and emits no events", () => {
    const state = createInitialGameState("Y9");
    const result = executeCommandWithResult(state, { type: "set_school_year", schoolYear: "Y9" });
    assert.equal(result.events.length, 0);
    assert.equal(result.warnings.some((warning) => warning.code === "NO_OP"), true);
});

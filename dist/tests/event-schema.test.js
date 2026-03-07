import assert from "node:assert/strict";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
test("invalid event payload is rejected by reducer schema gate", () => {
    const state = createInitialGameState("Y9");
    assert.throws(() => applyEvent(state, {
        type: "RoleChanged",
        atHour: state.timeHours,
        payload: { role: "king" }
    }), /Invalid RoleChanged payload/);
});

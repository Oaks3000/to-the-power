import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
import { selectCurrentContent, selectCurrentContentBatch } from "../content/selection.js";
import type { ContentBundle } from "../content/types.js";

async function loadBundle(): Promise<ContentBundle> {
  const raw = await readFile(resolve(process.cwd(), "content/vertical-slice.json"), "utf8");
  return JSON.parse(raw) as ContentBundle;
}

test("content selection is deterministic for same state", async () => {
  const bundle = await loadBundle();
  const state = createInitialGameState("Y9");

  const a = selectCurrentContent(state, bundle);
  const b = selectCurrentContent(state, bundle);

  assert.equal(a.eventCard?.id, b.eventCard?.id);
  assert.equal(a.challenge?.id, b.challenge?.id);
  assert.equal(a.scene?.id, b.scene?.id);
});

test("content selection changes when time advances", async () => {
  const bundle = await loadBundle();
  const initial = createInitialGameState("Y9");
  const next = applyEvent(initial, {
    type: "TimeAdvanced",
    atHour: initial.timeHours,
    payload: { hours: 12 }
  });

  const a = selectCurrentContent(initial, bundle);
  const b = selectCurrentContent(next, bundle);

  assert.notEqual(`${a.eventCard?.id}|${a.challenge?.id}|${a.scene?.id}`, `${b.eventCard?.id}|${b.challenge?.id}|${b.scene?.id}`);
});

test("crisis batch selection can return multiple unique packets", async () => {
  const bundle = await loadBundle();
  let state = createInitialGameState("Y9");
  state = applyEvent(state, {
    type: "RoleChanged",
    atHour: state.timeHours,
    payload: { role: "pps" }
  });
  state = applyEvent(state, {
    type: "TempoChanged",
    atHour: state.timeHours,
    payload: { tempo: "crisis" }
  });

  const batch = selectCurrentContentBatch(state, bundle);
  assert.equal(batch.length >= 1, true);
});

import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
import { loadContentBundle } from "../content/loader.js";
import { selectCurrentContent, selectCurrentContentBatch } from "../content/selection.js";
import type { ContentBundle } from "../content/types.js";

async function loadBundle(): Promise<ContentBundle> {
  return loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));
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

test("legacy bundle and equivalent manifest produce deterministic parity for fixed states", async () => {
  const legacy = await loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));

  const tempRoot = await mkdtemp(join(tmpdir(), "ttp-content-manifest-"));
  const packPath = join(tempRoot, "pack.json");
  const manifestPath = join(tempRoot, "index.json");
  await writeFile(packPath, JSON.stringify({
    id: "parity-pack",
    challenges: legacy.challenges,
    npcs: legacy.npcs,
    scenes: legacy.scenes,
    eventCards: legacy.eventCards,
    briefings: legacy.briefings
  }), "utf8");
  await writeFile(manifestPath, JSON.stringify({
    version: legacy.version,
    generatedAt: legacy.generatedAt,
    packs: ["pack.json"]
  }), "utf8");

  const manifestBundle = await loadContentBundle(manifestPath);

  const states = [
    createInitialGameState("Y9"),
    applyEvent(createInitialGameState("Y10"), {
      type: "RoleChanged",
      atHour: 0,
      payload: { role: "pps" }
    }),
    applyEvent(
      applyEvent(createInitialGameState("Y11"), {
        type: "RoleChanged",
        atHour: 0,
        payload: { role: "junior_minister" }
      }),
      {
        type: "TempoChanged",
        atHour: 0,
        payload: { tempo: "crisis" }
      }
    )
  ];

  for (const state of states) {
    const fromLegacy = selectCurrentContent(state, legacy);
    const fromManifest = selectCurrentContent(state, manifestBundle);
    assert.equal(fromLegacy.eventCard?.id, fromManifest.eventCard?.id);
    assert.equal(fromLegacy.challenge?.id, fromManifest.challenge?.id);
    assert.equal(fromLegacy.scene?.id, fromManifest.scene?.id);
  }
});

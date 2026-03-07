import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { loadContentBundle } from "../content/loader.js";
import { GameService, reconstructStateFromEventLog } from "../application/game-service.js";
import { PrototypeApi, getStateSummary } from "../application/prototype-api.js";
import { createInitialGameState } from "../domain/state.js";

function makeDeterministicRng(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

test("PrototypeApi.getCurrentPacketBatch returns UI-safe packet DTOs", async () => {
  const bundle = await loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));
  const service = new GameService({ schoolYear: "Y9", contentBundle: bundle });
  const api = new PrototypeApi(service);

  const packets = api.getCurrentPacketBatch(2);
  assert.equal(packets.length >= 1, true);

  const first = packets[0];
  assert.equal(typeof first?.band, "string");
  if (first?.eventCard) {
    assert.equal(typeof first.eventCard.id, "string");
    assert.equal(typeof first.eventCard.title, "string");
  }
  if (first?.challenge) {
    assert.equal(typeof first.challenge.topic, "string");
    assert.equal(typeof first.challenge.prompt, "string");
  }
});

test("PrototypeApi command flow matches replayed state summary", async () => {
  const bundle = await loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));
  const rng = makeDeterministicRng(42);
  const service = new GameService({ schoolYear: "Y9", contentBundle: bundle, rng });
  const api = new PrototypeApi(service);

  service.execute({ type: "change_tempo", tempo: "crisis" });
  api.submitChallengeOutcome({ topic: "percentages", correct: false, mode: "crisis" });
  api.advanceTime(6);
  api.submitChallengeOutcome({ topic: "percentages", correct: true, mode: "decision" });

  const summaryFromApi = api.getStateSummary();
  const replayed = reconstructStateFromEventLog(service.getEventLog(), createInitialGameState("Y9"), makeDeterministicRng(42));
  const replaySummary = getStateSummary(replayed);

  assert.deepEqual(summaryFromApi, replaySummary);
});

test("PrototypeApi.create loads content and exposes packet batch", async () => {
  const api = await PrototypeApi.create({
    contentPath: resolve(process.cwd(), "content/vertical-slice.json"),
    schoolYear: "Y9"
  });

  const packets = api.getCurrentPacketBatch();
  assert.equal(packets.length >= 1, true);
});

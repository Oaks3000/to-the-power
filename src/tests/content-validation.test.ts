import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { validateContentBundle } from "../content/schema.js";
import type { ContentBundle } from "../content/types.js";

test("vertical-slice content validates and meets minimum volume", async () => {
  const raw = await readFile(resolve(process.cwd(), "content/vertical-slice.json"), "utf8");
  const bundle = JSON.parse(raw) as ContentBundle;

  validateContentBundle(bundle);

  assert.equal(bundle.challenges.length >= 20, true);
  assert.equal(bundle.scenes.length >= 4, true);
  assert.equal(bundle.eventCards.length >= 8, true);
});

test("referential integrity check fails on missing challenge reference", async () => {
  const raw = await readFile(resolve(process.cwd(), "content/vertical-slice.json"), "utf8");
  const bundle = JSON.parse(raw) as ContentBundle;

  bundle.eventCards[0]?.candidateChallengeIds.push("missing_challenge_id");

  assert.throws(() => validateContentBundle(bundle), /missing challenge/i);
});

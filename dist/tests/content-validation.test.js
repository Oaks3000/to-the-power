import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { loadContentBundle } from "../content/loader.js";
import { validateContentBundle } from "../content/schema.js";
test("vertical-slice content validates and meets minimum volume", async () => {
    const raw = await readFile(resolve(process.cwd(), "content/vertical-slice.json"), "utf8");
    const bundle = JSON.parse(raw);
    validateContentBundle(bundle);
    assert.equal(bundle.challenges.length >= 20, true);
    assert.equal(bundle.scenes.length >= 4, true);
    assert.equal(bundle.eventCards.length >= 8, true);
});
test("referential integrity check fails on missing challenge reference", async () => {
    const raw = await readFile(resolve(process.cwd(), "content/vertical-slice.json"), "utf8");
    const bundle = JSON.parse(raw);
    bundle.eventCards[0]?.candidateChallengeIds.push("missing_challenge_id");
    assert.throws(() => validateContentBundle(bundle), /missing challenge/i);
});
test("manifest content bundle loads and expands PPS/Junior Minister crisis-media card coverage", async () => {
    const bundle = await loadContentBundle(resolve(process.cwd(), "content/index.json"));
    validateContentBundle(bundle);
    assert.equal(bundle.challenges.length >= 32, true);
    assert.equal(bundle.eventCards.length >= 19, true);
    assert.equal(bundle.scenes.length >= 12, true);
    const ppsOrJuniorCards = bundle.eventCards.filter((card) => card.careerLevels.includes("pps") || card.careerLevels.includes("junior_minister"));
    const crisisMediaCards = ppsOrJuniorCards.filter((card) => card.tempos.includes("crisis") || card.tempos.includes("media_storm"));
    assert.equal(crisisMediaCards.length >= 13, true);
});

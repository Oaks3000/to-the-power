import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { GameService } from "../application/game-service.js";
test("runCurrentEncounterBatch processes selections and advances time once", async () => {
    const service = new GameService({ schoolYear: "Y9" });
    await service.loadContent(resolve(process.cwd(), "content/vertical-slice.json"));
    service.execute({ type: "change_tempo", tempo: "crisis" });
    const beforeHour = service.getState().timeHours;
    const result = service.runCurrentEncounterBatch({
        burstCount: 2,
        challengeOutcomes: [true, false]
    });
    assert.equal(result.selections.length, result.slotResults.length);
    assert.equal(result.advanceResult !== undefined, true);
    assert.equal(service.getState().timeHours > beforeHour, true);
    const challengeResults = result.slotResults.filter((slot) => slot.challengeResult !== undefined);
    if (challengeResults.length > 0) {
        const first = challengeResults[0]?.challengeResult?.events[0]?.payload.correct;
        const second = challengeResults[1]?.challengeResult?.events[0]?.payload.correct;
        assert.equal(first, true);
        if (second !== undefined) {
            assert.equal(second, false);
        }
    }
});
test("runCurrentEncounterBatch can skip time advance", async () => {
    const service = new GameService({ schoolYear: "Y9" });
    await service.loadContent(resolve(process.cwd(), "content/vertical-slice.json"));
    service.execute({ type: "change_tempo", tempo: "crisis" });
    const beforeHour = service.getState().timeHours;
    const result = service.runCurrentEncounterBatch({ skipAdvance: true });
    assert.equal(result.advanceResult, undefined);
    assert.equal(service.getState().timeHours, beforeHour);
});

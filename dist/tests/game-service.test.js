import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { loadContentBundle } from "../content/loader.js";
import { selectCurrentContent, selectCurrentContentBatch } from "../content/selection.js";
import { GameService, loadEventLog, reconstructStateFromEventLog } from "../application/game-service.js";
import { createInitialGameState } from "../domain/state.js";
test("GameService persists and reloads event logs", async () => {
    const service = new GameService({ schoolYear: "Y11" });
    service.execute({ type: "change_role", role: "junior_minister" });
    service.execute({ type: "submit_challenge_answer", topic: "quadratics_basic", correct: false });
    service.execute({ type: "submit_challenge_answer", topic: "quadratics_basic", correct: false });
    const folder = await mkdtemp(join(tmpdir(), "ttp-log-"));
    const filePath = join(folder, "events.json");
    await service.saveLog(filePath);
    const loadedEvents = await loadEventLog(filePath);
    const reconstructed = reconstructStateFromEventLog(loadedEvents, createInitialGameState("Y11"));
    assert.equal(loadedEvents.length, service.getEventLog().length);
    assert.equal(reconstructed.currentRole, service.getState().currentRole);
    assert.equal(reconstructed.pendingRemediations.length, service.getState().pendingRemediations.length);
    assert.equal(reconstructed.eventLog.length, service.getState().eventLog.length);
});
test("getCurrentPacket matches deterministic selector when content bundle is configured", async () => {
    const bundle = await loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));
    const service = new GameService({ schoolYear: "Y9", contentBundle: bundle });
    const packet = service.getCurrentPacket();
    const expected = selectCurrentContent(service.getState(), bundle);
    assert.equal(packet.band, expected.band);
    assert.equal(packet.eventCard?.id, expected.eventCard?.id);
    assert.equal(packet.challenge?.id, expected.challenge?.id);
    assert.equal(packet.scene?.id, expected.scene?.id);
});
test("getCurrentPacketBatch mirrors selection helper", async () => {
    const bundle = await loadContentBundle(resolve(process.cwd(), "content/vertical-slice.json"));
    const service = new GameService({ schoolYear: "Y9", contentBundle: bundle });
    service.execute({ type: "change_role", role: "pps" });
    service.execute({ type: "change_tempo", tempo: "crisis" });
    const packets = service.getCurrentPacketBatch();
    const expected = selectCurrentContentBatch(service.getState(), bundle);
    assert.equal(packets.length, expected.length);
});
test("getCurrentPacket throws if content bundle is missing", () => {
    const service = new GameService({ schoolYear: "Y9" });
    assert.throws(() => service.getCurrentPacket(), /No content bundle configured/);
});

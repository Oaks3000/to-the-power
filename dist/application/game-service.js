import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadContentBundle } from "../content/loader.js";
import { selectCurrentContent, selectCurrentContentBatch } from "../content/selection.js";
import { executeEncounterBatch } from "./encounter-service.js";
import { executeCommandWithResult } from "../domain/commands.js";
import { assertValidGameEvent } from "../domain/events.js";
import { reduceEvents } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
function assertEventArray(value) {
    if (!Array.isArray(value)) {
        throw new Error("Event log file must contain a JSON array");
    }
}
export async function saveEventLog(filePath, events) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
}
export async function loadEventLog(filePath) {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    assertEventArray(parsed);
    for (const event of parsed) {
        assertValidGameEvent(event);
    }
    return parsed;
}
export function reconstructStateFromEventLog(events, seedState = createInitialGameState(), rng = Math.random) {
    return reduceEvents(seedState, events, rng, { evaluateLatent: false, generateFollowUps: false });
}
export class GameService {
    state;
    rng;
    contentBundle;
    constructor(options = {}) {
        const initialState = options.initialState ?? createInitialGameState(options.schoolYear);
        this.state = initialState;
        this.rng = options.rng ?? Math.random;
        this.contentBundle = options.contentBundle;
    }
    getState() {
        return this.state;
    }
    getEventLog() {
        return this.state.eventLog;
    }
    execute(command) {
        const result = executeCommandWithResult(this.state, command, this.rng);
        this.state = result.state;
        return result;
    }
    setContentBundle(bundle) {
        this.contentBundle = bundle;
    }
    async loadContent(filePath) {
        const bundle = await loadContentBundle(filePath);
        this.contentBundle = bundle;
        return bundle;
    }
    getCurrentPacket() {
        if (!this.contentBundle) {
            throw new Error("No content bundle configured. Call setContentBundle(...) or loadContent(...) first.");
        }
        return selectCurrentContent(this.state, this.contentBundle);
    }
    getCurrentPacketBatch(burstCount) {
        if (!this.contentBundle) {
            throw new Error("No content bundle configured. Call setContentBundle(...) or loadContent(...) first.");
        }
        return selectCurrentContentBatch(this.state, this.contentBundle, burstCount);
    }
    runCurrentEncounterBatch(options = {}) {
        const selections = this.getCurrentPacketBatch(options.burstCount);
        const sequencerOptions = {};
        if (options.challengeOutcomes !== undefined) {
            sequencerOptions.challengeOutcomes = options.challengeOutcomes;
        }
        if (options.defaultChallengeCorrect !== undefined) {
            sequencerOptions.defaultChallengeCorrect = options.defaultChallengeCorrect;
        }
        if (options.applySceneEffects !== undefined) {
            sequencerOptions.applySceneEffects = options.applySceneEffects;
        }
        if (options.advanceHours !== undefined) {
            sequencerOptions.advanceHours = options.advanceHours;
        }
        if (options.skipAdvance !== undefined) {
            sequencerOptions.skipAdvance = options.skipAdvance;
        }
        return executeEncounterBatch(selections, (command) => this.execute(command), sequencerOptions);
    }
    getWeeklyPacket() {
        return this.getCurrentPacket();
    }
    async saveLog(filePath) {
        await saveEventLog(filePath, this.state.eventLog);
    }
    async loadLog(filePath, seedState = createInitialGameState()) {
        const events = await loadEventLog(filePath);
        this.state = reconstructStateFromEventLog(events, seedState, this.rng);
        return this.state;
    }
}

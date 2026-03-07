import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadContentBundle } from "../content/loader.js";
import { selectCurrentContent, selectCurrentContentBatch } from "../content/selection.js";
import type { CurrentSelection } from "../content/selection.js";
import type { ContentBundle } from "../content/types.js";
import { executeEncounterBatch } from "./encounter-service.js";
import type { EncounterBatchResult, EncounterSequencerOptions } from "./encounter-service.js";
import { executeCommandWithResult } from "../domain/commands.js";
import { assertValidGameEvent } from "../domain/events.js";
import { reduceEvents } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
import type { CommandResult, GameCommand } from "../domain/commands.js";
import type { GameEvent, GameState, Rng, SchoolYear } from "../domain/types.js";

export interface RunCurrentEncounterBatchOptions extends EncounterSequencerOptions {
  burstCount?: number;
}

function assertEventArray(value: unknown): asserts value is GameEvent[] {
  if (!Array.isArray(value)) {
    throw new Error("Event log file must contain a JSON array");
  }
}

export async function saveEventLog(filePath: string, events: GameEvent[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
}

export async function loadEventLog(filePath: string): Promise<GameEvent[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  assertEventArray(parsed);

  for (const event of parsed) {
    assertValidGameEvent(event);
  }

  return parsed;
}

export function reconstructStateFromEventLog(
  events: GameEvent[],
  seedState: GameState = createInitialGameState(),
  rng: Rng = Math.random
): GameState {
  return reduceEvents(seedState, events, rng, { evaluateLatent: false, generateFollowUps: false });
}

export class GameService {
  private state: GameState;
  private readonly rng: Rng;
  private contentBundle: ContentBundle | undefined;

  constructor(options: { initialState?: GameState; schoolYear?: SchoolYear; rng?: Rng; contentBundle?: ContentBundle } = {}) {
    const initialState = options.initialState ?? createInitialGameState(options.schoolYear);
    this.state = initialState;
    this.rng = options.rng ?? Math.random;
    this.contentBundle = options.contentBundle;
  }

  getState(): GameState {
    return this.state;
  }

  getEventLog(): GameEvent[] {
    return this.state.eventLog;
  }

  execute(command: GameCommand): CommandResult {
    const result = executeCommandWithResult(this.state, command, this.rng);
    this.state = result.state;
    return result;
  }

  setContentBundle(bundle: ContentBundle): void {
    this.contentBundle = bundle;
  }

  async loadContent(filePath: string): Promise<ContentBundle> {
    const bundle = await loadContentBundle(filePath);
    this.contentBundle = bundle;
    return bundle;
  }

  getCurrentPacket(): CurrentSelection {
    if (!this.contentBundle) {
      throw new Error("No content bundle configured. Call setContentBundle(...) or loadContent(...) first.");
    }
    return selectCurrentContent(this.state, this.contentBundle);
  }

  getCurrentPacketBatch(burstCount?: number): CurrentSelection[] {
    if (!this.contentBundle) {
      throw new Error("No content bundle configured. Call setContentBundle(...) or loadContent(...) first.");
    }
    return selectCurrentContentBatch(this.state, this.contentBundle, burstCount);
  }

  runCurrentEncounterBatch(options: RunCurrentEncounterBatchOptions = {}): EncounterBatchResult {
    const selections = this.getCurrentPacketBatch(options.burstCount);

    const sequencerOptions: EncounterSequencerOptions = {};
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

    return executeEncounterBatch(
      selections,
      (command) => this.execute(command),
      sequencerOptions
    );
  }

  getWeeklyPacket(): CurrentSelection {
    return this.getCurrentPacket();
  }

  async saveLog(filePath: string): Promise<void> {
    await saveEventLog(filePath, this.state.eventLog);
  }

  async loadLog(filePath: string, seedState: GameState = createInitialGameState()): Promise<GameState> {
    const events = await loadEventLog(filePath);
    this.state = reconstructStateFromEventLog(events, seedState, this.rng);
    return this.state;
  }
}

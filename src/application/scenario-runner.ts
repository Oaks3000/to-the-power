import { resolve } from "node:path";
import type { CurrentSelection } from "../content/selection.js";
import { executeEncounterBatch } from "./encounter-service.js";
import { GameService } from "./game-service.js";
import { sampleChallengeOutcome, type ScenarioChallengePolicy, type ScenarioDefinition } from "./scenarios.js";
import type { ChallengeMode, GameEvent, GameState } from "../domain/types.js";

export interface RunScenarioOptions {
  contentPath?: string;
  seed?: number | string;
}

export interface ScenarioStepSummary {
  id: string;
  label: string;
  hourBefore: number;
  hourAfter: number;
  roleBefore: string;
  roleAfter: string;
  tempoBefore: string;
  tempoAfter: string;
  packetCount: number;
  challengeAttempts: number;
  crisisAttempts: number;
  challengeCorrect: number;
  challengeIncorrect: number;
  crisisFailures: number;
  eventCardIds: string[];
}

export interface ScenarioSummary {
  scenarioId: string;
  scenarioName: string;
  seed: number;
  steps: ScenarioStepSummary[];
  metrics: {
    roleProgression: string[];
    tempoShifts: string[];
    remediationCount: number;
    remediationByTopic: Record<string, number>;
    crisisFailureCount: number;
    totalCrisisAttempts: number;
    crisisFailureRate: number;
    totalChallengeAttempts: number;
    totalHoursAdvanced: number;
    eventLogEntries: number;
    roleTransitionHours: Record<string, number>;
  };
  finalState: Pick<
    GameState,
    "schoolYear" | "currentRole" | "currentTempo" | "timeHours" | "partyLoyaltyScore" | "publicApproval" | "pressRelationship" | "darkIndex"
  > & { pendingRemediations: number };
}

function xmur3(input: string): () => number {
  let hash = 1779033703 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeSeed(seed?: number | string): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed >>> 0;
  }

  if (typeof seed === "string") {
    return xmur3(seed)();
  }

  return 1;
}

function isChallengeMode(value: unknown): value is ChallengeMode {
  return value === "decision" || value === "gate" || value === "crisis";
}

function computeOutcomes(
  selections: CurrentSelection[],
  policy: ScenarioChallengePolicy | undefined,
  tempo: GameState["currentTempo"],
  rng: () => number
): boolean[] | undefined {
  if (policy === undefined) {
    return undefined;
  }

  return selections.map((selection) => {
    if (!selection.challenge) {
      return true;
    }

    if (policy === "always_correct") {
      return true;
    }
    if (policy === "always_incorrect") {
      return false;
    }

    return sampleChallengeOutcome(selection.challenge.mode, tempo, rng);
  });
}

function collectRoleProgression(events: GameEvent[]): string[] {
  return events
    .filter((event) => event.type === "RoleChanged")
    .map((event) => `${String(event.payload.role)}@${event.atHour}`);
}

function collectRoleTransitionHours(events: GameEvent[]): Record<string, number> {
  const transitions: Record<string, number> = {};
  for (const event of events) {
    if (event.type !== "RoleChanged") {
      continue;
    }
    const role = String(event.payload.role);
    if (transitions[role] === undefined) {
      transitions[role] = event.atHour;
    }
  }
  return transitions;
}

function collectTempoShifts(events: GameEvent[]): string[] {
  return events
    .filter((event) => event.type === "TempoChanged")
    .map((event) => `${String(event.payload.tempo)}@${event.atHour}`);
}

function collectRemediationByTopic(events: GameEvent[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const event of events) {
    if (event.type !== "RemediationTriggered") {
      continue;
    }
    const topic = String(event.payload.topic);
    totals[topic] = (totals[topic] ?? 0) + 1;
  }
  return totals;
}

export async function runScenario(definition: ScenarioDefinition, options: RunScenarioOptions = {}): Promise<ScenarioSummary> {
  const seed = normalizeSeed(options.seed);
  const rng = mulberry32(seed);

  const contentPath = options.contentPath ?? resolve(process.cwd(), "content/vertical-slice.json");
  const service = new GameService({ schoolYear: definition.schoolYear, rng });
  await service.loadContent(contentPath);

  const steps: ScenarioStepSummary[] = [];
  let crisisFailureCount = 0;
  let totalCrisisAttempts = 0;
  let totalChallengeAttempts = 0;

  for (const step of definition.steps) {
    for (const command of step.preCommands ?? []) {
      service.execute(command);
    }

    const before = service.getState();
    const selections = service.getCurrentPacketBatch(step.burstCount);
    const challengeOutcomes = computeOutcomes(selections, step.challengePolicy, before.currentTempo, rng);
    const encounterOptions: {
      challengeOutcomes?: boolean[];
      applySceneEffects?: boolean;
      skipAdvance?: boolean;
      advanceHours?: number;
    } = {};
    if (challengeOutcomes !== undefined) {
      encounterOptions.challengeOutcomes = challengeOutcomes;
    }
    if (step.applySceneEffects !== undefined) {
      encounterOptions.applySceneEffects = step.applySceneEffects;
    }
    if (step.skipAdvance !== undefined) {
      encounterOptions.skipAdvance = step.skipAdvance;
    }
    if (step.advanceHours !== undefined) {
      encounterOptions.advanceHours = step.advanceHours;
    }

    const batch = executeEncounterBatch(selections, (command) => service.execute(command), encounterOptions);
    const after = service.getState();

    let challengeCorrect = 0;
    let challengeIncorrect = 0;
    let crisisAttempts = 0;
    let stepCrisisFailures = 0;

    for (const slot of batch.slotResults) {
      const challenge = slot.selection.challenge;
      const challengeMode = challenge?.mode;
      const isCrisisContext = before.currentTempo === "crisis" || (challengeMode !== undefined && isChallengeMode(challengeMode) && challengeMode === "crisis");
      if (challenge && isCrisisContext) {
        crisisAttempts += 1;
      }

      const wasCorrect = slot.challengeResult?.events[0]?.payload.correct;
      if (wasCorrect === true) {
        challengeCorrect += 1;
        continue;
      }
      if (wasCorrect === false) {
        challengeIncorrect += 1;
        if (isCrisisContext) {
          stepCrisisFailures += 1;
        }
      }
    }

    crisisFailureCount += stepCrisisFailures;
    totalCrisisAttempts += crisisAttempts;
    totalChallengeAttempts += challengeCorrect + challengeIncorrect;

    steps.push({
      id: step.id,
      label: step.label,
      hourBefore: before.timeHours,
      hourAfter: after.timeHours,
      roleBefore: before.currentRole,
      roleAfter: after.currentRole,
      tempoBefore: before.currentTempo,
      tempoAfter: after.currentTempo,
      packetCount: batch.selections.length,
      challengeAttempts: challengeCorrect + challengeIncorrect,
      crisisAttempts,
      challengeCorrect,
      challengeIncorrect,
      crisisFailures: stepCrisisFailures,
      eventCardIds: batch.selections.map((selection) => selection.eventCard?.id ?? "none")
    });
  }

  const finalState = service.getState();
  const totalHoursAdvanced = steps.reduce((total, step) => total + (step.hourAfter - step.hourBefore), 0);
  const roleTransitionHours = collectRoleTransitionHours(finalState.eventLog);
  const remediationByTopic = collectRemediationByTopic(finalState.eventLog);
  const crisisFailureRate = totalCrisisAttempts === 0 ? 0 : crisisFailureCount / totalCrisisAttempts;

  return {
    scenarioId: definition.id,
    scenarioName: definition.name,
    seed,
    steps,
    metrics: {
      roleProgression: collectRoleProgression(finalState.eventLog),
      roleTransitionHours,
      tempoShifts: collectTempoShifts(finalState.eventLog),
      remediationCount: finalState.pendingRemediations.length,
      remediationByTopic,
      crisisFailureCount,
      totalCrisisAttempts,
      crisisFailureRate,
      totalChallengeAttempts,
      totalHoursAdvanced,
      eventLogEntries: finalState.eventLog.length
    },
    finalState: {
      schoolYear: finalState.schoolYear,
      currentRole: finalState.currentRole,
      currentTempo: finalState.currentTempo,
      timeHours: finalState.timeHours,
      partyLoyaltyScore: finalState.partyLoyaltyScore,
      publicApproval: finalState.publicApproval,
      pressRelationship: finalState.pressRelationship,
      darkIndex: finalState.darkIndex,
      pendingRemediations: finalState.pendingRemediations.length
    }
  };
}

export { getCurriculumBand, isTransitionBand } from "./domain/curriculum.js";
export { decide, decideWithResult, executeCommand, executeCommandWithResult, CommandError } from "./domain/commands.js";
export { getChallengeConsequenceDeltas } from "./domain/challenge-consequences.js";
export { assertValidGameEvent, isMathsTopic } from "./domain/events.js";
export { evaluateActivationCondition, evaluateLatentConsequences } from "./domain/latent.js";
export { createMathsPerformanceProfile, registerChallengeAttempt } from "./domain/remediation.js";
export { applyEvent, reduceEvents } from "./domain/reducer.js";
export { TEMPO_CADENCE, defaultAdvanceHoursForTempo, defaultEventBurstForTempo } from "./domain/tempo.js";
export { GameService, loadEventLog, saveEventLog, reconstructStateFromEventLog } from "./application/game-service.js";
export { executeEncounterBatch } from "./application/encounter-service.js";
export { PrototypeApi, getStateSummary as getPrototypeStateSummary } from "./application/prototype-api.js";
export { runScenario } from "./application/scenario-runner.js";
export { DEFAULT_BALANCING_SCENARIO, sampleChallengeOutcome } from "./application/scenarios.js";
export { runScenarioSweep, buildScenarioTelemetryReport, detectScenarioOutliers } from "./application/scenario-telemetry.js";
export { createInitialGameState } from "./domain/state.js";

export { loadContentBundle } from "./content/loader.js";
export { validateContentBundle } from "./content/schema.js";
export { selectCurrentContent, selectCurrentContentBatch, selectWeeklyContent } from "./content/selection.js";

export type { CommandDecision, CommandResult, CommandWarning, GameCommand } from "./domain/commands.js";
export type {
  ActiveTimedChallenge,
  ActivationConditionKey,
  CareerLevel,
  ChallengeMode,
  CurriculumBand,
  GameEvent,
  GameEventType,
  GameState,
  LatentConsequence,
  MathsPerformanceProfile,
  MathsTopic,
  NPCState,
  NPCLifecycle,
  Rng,
  SchoolYear,
  TempoState,
  TopicPerformance
} from "./domain/types.js";

export type { CurrentSelection, WeeklySelection } from "./content/selection.js";
export type { EncounterBatchResult, EncounterSequencerOptions, EncounterSlotResult } from "./application/encounter-service.js";
export type { PrototypeCommandResponse, PrototypePacket, PrototypeStateSummary, SubmitChallengeOutcomeInput } from "./application/prototype-api.js";
export type { RunScenarioOptions, ScenarioSummary, ScenarioStepSummary } from "./application/scenario-runner.js";
export type { ScenarioChallengePolicy, ScenarioDefinition, ScenarioStep } from "./application/scenarios.js";
export type {
  RunScenarioSweepOptions,
  ScenarioBalanceTargets,
  ScenarioCohortGate,
  ScenarioCohortGates,
  ScenarioConfidenceInterval,
  ScenarioOutlier,
  ScenarioTelemetryAggregates,
  ScenarioTelemetryReport
} from "./application/scenario-telemetry.js";
export type {
  BriefingContent,
  ChallengeContent,
  ContentBundle,
  ContentManifest,
  ContentPack,
  EventCardContent,
  NPCContent,
  SceneContent
} from "./content/types.js";

import { applyEvent } from "./reducer.js";
import { defaultAdvanceHoursForTempo, TEMPO_CADENCE } from "./tempo.js";
import { isMathsTopic } from "./events.js";
export class CommandError extends Error {
    constructor(message) {
        super(message);
        this.name = "CommandError";
    }
}
function ensure(condition, message) {
    if (!condition) {
        throw new CommandError(message);
    }
}
function ensureFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
export function decideWithResult(state, command) {
    const atHour = state.timeHours;
    const warnings = [];
    switch (command.type) {
        case "set_school_year":
            if (state.schoolYear === command.schoolYear) {
                warnings.push({ code: "NO_OP", message: "School year is already set to the requested value" });
                return { events: [], warnings };
            }
            return { events: [{ type: "SchoolYearSet", atHour, payload: { schoolYear: command.schoolYear } }], warnings };
        case "change_role":
            if (state.currentRole === command.role) {
                warnings.push({ code: "NO_OP", message: "Current role already matches requested role" });
                return { events: [], warnings };
            }
            return { events: [{ type: "RoleChanged", atHour, payload: { role: command.role } }], warnings };
        case "change_tempo":
            if (state.currentTempo === command.tempo) {
                warnings.push({ code: "NO_OP", message: "Current tempo already matches requested tempo" });
                return { events: [], warnings };
            }
            return { events: [{ type: "TempoChanged", atHour, payload: { tempo: command.tempo } }], warnings };
        case "advance_time": {
            const hours = command.hours ?? defaultAdvanceHoursForTempo(state.currentTempo);
            ensure(Number.isInteger(hours) && hours > 0, "advance_time.hours must be a positive integer");
            const cadence = TEMPO_CADENCE[state.currentTempo];
            if (hours > cadence.maxHours) {
                warnings.push({
                    code: "LARGE_TIME_ADVANCE",
                    message: `Advancing ${hours}h exceeds ${state.currentTempo} max cadence (${cadence.maxHours}h)`
                });
            }
            return { events: [{ type: "TimeAdvanced", atHour, payload: { hours } }], warnings };
        }
        case "submit_challenge_answer":
            ensure(typeof command.topic === "string" && isMathsTopic(command.topic), "submit_challenge_answer.topic is invalid");
            ensure(typeof command.correct === "boolean", "submit_challenge_answer.correct must be boolean");
            ensure(command.mode === undefined || command.mode === "decision" || command.mode === "gate" || command.mode === "crisis", "submit_challenge_answer.mode is invalid");
            return {
                events: [{
                        type: "ChallengeAttempted",
                        atHour,
                        payload: {
                            topic: command.topic,
                            correct: command.correct,
                            mode: command.mode ?? "decision"
                        }
                    }],
                warnings
            };
        case "start_timed_challenge": {
            ensure(command.challengeId.length > 0, "start_timed_challenge.challengeId must be non-empty");
            ensure(!state.activeTimedChallenges[command.challengeId], "Timed challenge already active for this challengeId");
            const timerHours = command.timerHours ?? 1;
            ensure(Number.isInteger(timerHours) && timerHours > 0, "start_timed_challenge.timerHours must be a positive integer");
            return { events: [{ type: "TimedChallengeStarted", atHour, payload: { challengeId: command.challengeId, timerHours } }], warnings };
        }
        case "register_latent_consequence": {
            ensure(command.consequence.id.length > 0, "register_latent_consequence.consequence.id must be non-empty");
            ensure(command.consequence.probability >= 0 && command.consequence.probability <= 1, "Latent consequence probability must be within [0,1]");
            return { events: [{ type: "LatentConsequenceRegistered", atHour, payload: { consequence: command.consequence } }], warnings };
        }
        case "change_dark_index":
            ensure(ensureFiniteNumber(command.delta), "change_dark_index.delta must be a finite number");
            if (command.delta === 0) {
                warnings.push({ code: "NO_OP", message: "Dark index delta is zero; no state change will occur" });
                return { events: [], warnings };
            }
            return { events: [{ type: "DarkIndexChanged", atHour, payload: { delta: command.delta } }], warnings };
        case "change_npc_relationship":
            ensure(command.npcId.length > 0, "change_npc_relationship.npcId must be non-empty");
            ensure(ensureFiniteNumber(command.delta), "change_npc_relationship.delta must be a finite number");
            if (command.delta === 0) {
                warnings.push({ code: "NO_OP", message: "Relationship delta is zero; no state change will occur" });
                return { events: [], warnings };
            }
            return { events: [{ type: "NPCRelationshipChanged", atHour, payload: { npcId: command.npcId, delta: command.delta } }], warnings };
    }
}
export function decide(state, command) {
    return decideWithResult(state, command).events;
}
export function executeCommandWithResult(state, command, rng = Math.random) {
    const decision = decideWithResult(state, command);
    const nextState = decision.events.reduce((candidate, event) => applyEvent(candidate, event, rng), state);
    return {
        state: nextState,
        events: decision.events,
        warnings: decision.warnings
    };
}
export function executeCommand(state, command, rng = Math.random) {
    return executeCommandWithResult(state, command, rng).state;
}

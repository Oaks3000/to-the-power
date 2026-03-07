import { getCurriculumBand } from "./curriculum.js";
import { getChallengeConsequenceDeltas } from "./challenge-consequences.js";
import { assertValidGameEvent } from "./events.js";
import { evaluateLatentConsequences } from "./latent.js";
import { registerChallengeAttempt } from "./remediation.js";
function logEvent(state, event) {
    return {
        ...state,
        eventLog: [...state.eventLog, event]
    };
}
function clampScore(value) {
    return Math.max(0, Math.min(100, value));
}
function applyCoreEvent(state, event) {
    switch (event.type) {
        case "SchoolYearSet": {
            const schoolYear = event.payload.schoolYear;
            if (schoolYear !== "Y9" && schoolYear !== "Y10" && schoolYear !== "Y11") {
                return { state, followUps: [] };
            }
            return { state: { ...state, schoolYear }, followUps: [] };
        }
        case "RoleChanged": {
            const role = event.payload.role;
            if (role !== "backbencher" &&
                role !== "pps" &&
                role !== "junior_minister" &&
                role !== "minister_of_state" &&
                role !== "cabinet" &&
                role !== "pm") {
                return { state, followUps: [] };
            }
            return { state: { ...state, currentRole: role }, followUps: [] };
        }
        case "TempoChanged": {
            const tempo = event.payload.tempo;
            if (tempo !== "recess" && tempo !== "parliamentary" && tempo !== "crisis" && tempo !== "media_storm") {
                return { state, followUps: [] };
            }
            return { state: { ...state, currentTempo: tempo }, followUps: [] };
        }
        case "TimeAdvanced": {
            const hours = typeof event.payload.hours === "number" && event.payload.hours > 0 ? Math.floor(event.payload.hours) : 1;
            const nextHour = state.timeHours + hours;
            const survivors = {};
            const followUps = [];
            for (const [challengeId, challenge] of Object.entries(state.activeTimedChallenges)) {
                if (challenge.deadlineAtHour <= nextHour) {
                    followUps.push({
                        type: "TimedChallengeExpired",
                        atHour: nextHour,
                        payload: { challengeId }
                    });
                    continue;
                }
                survivors[challengeId] = challenge;
            }
            return {
                state: {
                    ...state,
                    timeHours: nextHour,
                    activeTimedChallenges: survivors
                },
                followUps
            };
        }
        case "TimedChallengeStarted": {
            const challengeId = event.payload.challengeId;
            const timerHoursRaw = event.payload.timerHours;
            if (typeof challengeId !== "string") {
                return { state, followUps: [] };
            }
            const timerHours = typeof timerHoursRaw === "number" && timerHoursRaw > 0 ? Math.floor(timerHoursRaw) : 1;
            return {
                state: {
                    ...state,
                    activeTimedChallenges: {
                        ...state.activeTimedChallenges,
                        [challengeId]: {
                            challengeId,
                            startedAtHour: state.timeHours,
                            deadlineAtHour: state.timeHours + timerHours
                        }
                    }
                },
                followUps: []
            };
        }
        case "TimedChallengeExpired": {
            const challengeId = event.payload.challengeId;
            if (typeof challengeId !== "string") {
                return { state, followUps: [] };
            }
            const nextActive = { ...state.activeTimedChallenges };
            delete nextActive[challengeId];
            return {
                state: {
                    ...state,
                    activeTimedChallenges: nextActive,
                    publicApproval: Math.max(0, state.publicApproval - 2),
                    pressRelationship: Math.max(0, state.pressRelationship - 3)
                },
                followUps: []
            };
        }
        case "ChallengeAttempted": {
            const topic = event.payload.topic;
            const correct = event.payload.correct;
            const rawMode = event.payload.mode;
            if (typeof topic !== "string" || typeof correct !== "boolean") {
                return { state, followUps: [] };
            }
            const mode = rawMode === "decision" || rawMode === "gate" || rawMode === "crisis" ? rawMode : "decision";
            const typedTopic = topic;
            const band = getCurriculumBand(state.schoolYear, state.currentRole);
            const attemptResult = registerChallengeAttempt(state.mathsPerformance, typedTopic, correct, band);
            const deltas = getChallengeConsequenceDeltas(mode, state.currentTempo, correct);
            const followUps = [];
            if (attemptResult.remediationTriggered) {
                followUps.push({
                    type: "RemediationTriggered",
                    atHour: state.timeHours,
                    payload: {
                        topic,
                        band,
                        thresholdUsed: attemptResult.thresholdUsed
                    }
                });
            }
            return {
                state: {
                    ...state,
                    mathsPerformance: attemptResult.profile,
                    partyLoyaltyScore: clampScore(state.partyLoyaltyScore + deltas.partyLoyaltyDelta),
                    publicApproval: clampScore(state.publicApproval + deltas.publicApprovalDelta),
                    constituencyApproval: clampScore(state.constituencyApproval + deltas.constituencyApprovalDelta),
                    pressRelationship: clampScore(state.pressRelationship + deltas.pressRelationshipDelta),
                    darkIndex: clampScore(state.darkIndex + deltas.darkIndexDelta),
                    departmentalCompetence: {
                        ...state.departmentalCompetence,
                        [typedTopic]: clampScore((state.departmentalCompetence[typedTopic] ?? 50) + deltas.departmentalCompetenceDelta)
                    }
                },
                followUps
            };
        }
        case "RemediationTriggered": {
            const topic = event.payload.topic;
            const band = event.payload.band;
            const thresholdUsed = event.payload.thresholdUsed;
            if (typeof topic !== "string" || typeof band !== "string" || typeof thresholdUsed !== "number") {
                return { state, followUps: [] };
            }
            const typedTopic = topic;
            const typedBand = band;
            return {
                state: {
                    ...state,
                    pendingRemediations: [
                        ...state.pendingRemediations,
                        {
                            topic: typedTopic,
                            band: typedBand,
                            triggeredAtHour: state.timeHours,
                            thresholdUsed
                        }
                    ]
                },
                followUps: []
            };
        }
        case "LatentConsequenceRegistered": {
            const consequence = event.payload.consequence;
            if (!consequence || typeof consequence !== "object") {
                return { state, followUps: [] };
            }
            return {
                state: {
                    ...state,
                    pendingLatentConsequences: [...state.pendingLatentConsequences, consequence]
                },
                followUps: []
            };
        }
        case "LatentConsequenceTriggered": {
            const consequenceId = event.payload.consequenceId;
            if (typeof consequenceId !== "string") {
                return { state, followUps: [] };
            }
            return {
                state: {
                    ...state,
                    pendingLatentConsequences: state.pendingLatentConsequences.filter((consequence) => consequence.id !== consequenceId)
                },
                followUps: []
            };
        }
        case "NPCRelationshipChanged": {
            const npcId = event.payload.npcId;
            const delta = event.payload.delta;
            if (typeof npcId !== "string" || typeof delta !== "number") {
                return { state, followUps: [] };
            }
            const current = state.npcRelationships[npcId] ?? {
                id: npcId,
                name: npcId,
                lifecycleState: "active",
                relationshipScore: 50
            };
            const nextScore = Math.max(0, Math.min(100, current.relationshipScore + delta));
            return {
                state: {
                    ...state,
                    npcRelationships: {
                        ...state.npcRelationships,
                        [npcId]: {
                            ...current,
                            relationshipScore: nextScore
                        }
                    }
                },
                followUps: []
            };
        }
        case "DarkIndexChanged": {
            const delta = event.payload.delta;
            if (typeof delta !== "number") {
                return { state, followUps: [] };
            }
            return {
                state: {
                    ...state,
                    darkIndex: Math.max(0, Math.min(100, state.darkIndex + delta))
                },
                followUps: []
            };
        }
        default:
            return { state, followUps: [] };
    }
}
export function applyEvent(state, event, rng = Math.random, options = {}) {
    assertValidGameEvent(event);
    const evaluateLatent = options.evaluateLatent ?? true;
    const generateFollowUps = options.generateFollowUps ?? true;
    const logged = logEvent(state, event);
    const core = applyCoreEvent(logged, event);
    let nextState = core.state;
    const queue = generateFollowUps ? [...core.followUps] : [];
    while (queue.length > 0) {
        const next = queue.shift();
        if (!next) {
            continue;
        }
        assertValidGameEvent(next);
        nextState = logEvent(nextState, next);
        const follow = applyCoreEvent(nextState, next);
        nextState = follow.state;
        queue.push(...follow.followUps);
    }
    if (!evaluateLatent) {
        return nextState;
    }
    const latent = evaluateLatentConsequences(nextState, rng);
    nextState = latent.state;
    for (const latentEvent of latent.triggered) {
        nextState = applyEvent(nextState, latentEvent, rng, options);
    }
    return nextState;
}
export function reduceEvents(initial, events, rng = Math.random, options = {}) {
    return events.reduce((state, event) => applyEvent(state, event, rng, options), initial);
}

const SCHOOL_YEARS = new Set(["Y9", "Y10", "Y11"]);
const CURRICULUM_BANDS = new Set(["Y9", "Y9-10", "Y10", "Y10-11", "Y11"]);
const CAREER_LEVELS = new Set(["backbencher", "pps", "junior_minister", "minister_of_state", "cabinet", "pm"]);
const CHALLENGE_MODES = new Set(["decision", "gate", "crisis"]);
const TEMPO_STATES = new Set(["recess", "parliamentary", "crisis", "media_storm"]);
const ACTIVATION_CONDITIONS = new Set(["dark_index_critical", "cabinet_loyalty_whip_risk"]);
const GAME_EVENT_TYPES = new Set([
    "SchoolYearSet",
    "RoleChanged",
    "TempoChanged",
    "TimeAdvanced",
    "ChallengeAttempted",
    "RemediationTriggered",
    "TimedChallengeStarted",
    "TimedChallengeExpired",
    "LatentConsequenceRegistered",
    "LatentConsequenceTriggered",
    "NPCRelationshipChanged",
    "DarkIndexChanged"
]);
const MATHS_TOPICS = new Set([
    "percentages", "ratio_proportion", "standard_form", "powers_roots", "rounding",
    "linear_equations", "linear_graphs", "sequences_arithmetic", "substitution",
    "basic_probability", "statistics_basic", "scatter_graphs",
    "compound_interest", "growth_decay", "bounds", "indices", "surds",
    "quadratics_basic", "simultaneous_equations", "inequalities", "geometric_sequences",
    "direct_inverse_proportion", "rates_of_change_linear",
    "probability_trees", "venn_diagrams", "histograms", "cumulative_frequency", "box_plots",
    "completing_square", "quadratic_formula", "functions", "algebraic_fractions", "iteration",
    "exponential_functions", "area_under_curve", "gradient_curve", "rates_of_change_complex",
    "conditional_probability", "sampling_methods", "statistical_critique"
]);
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function assertCoreShape(event) {
    assert(GAME_EVENT_TYPES.has(event.type), `Invalid game event type: ${event.type}`);
    assert(Number.isInteger(event.atHour) && event.atHour >= 0, `Invalid event atHour for ${event.type}`);
    assert(isRecord(event.payload), `Invalid payload for ${event.type}`);
}
function isLatentConsequence(value) {
    if (!isRecord(value)) {
        return false;
    }
    if (typeof value.id !== "string" || value.id.length === 0) {
        return false;
    }
    if (typeof value.activationCondition !== "string" || !ACTIVATION_CONDITIONS.has(value.activationCondition)) {
        return false;
    }
    if (!isFiniteNumber(value.probability) || value.probability < 0 || value.probability > 1) {
        return false;
    }
    if (!isRecord(value.payload)) {
        return false;
    }
    if (value.expiresAtHour !== undefined && (!(typeof value.expiresAtHour === "number" && Number.isInteger(value.expiresAtHour)) || value.expiresAtHour < 0)) {
        return false;
    }
    return true;
}
export function isMathsTopic(value) {
    return MATHS_TOPICS.has(value);
}
export function assertValidGameEvent(event) {
    assertCoreShape(event);
    switch (event.type) {
        case "SchoolYearSet":
            assert(typeof event.payload.schoolYear === "string" && SCHOOL_YEARS.has(event.payload.schoolYear), "Invalid SchoolYearSet payload");
            return;
        case "RoleChanged":
            assert(typeof event.payload.role === "string" && CAREER_LEVELS.has(event.payload.role), "Invalid RoleChanged payload");
            return;
        case "TempoChanged":
            assert(typeof event.payload.tempo === "string" && TEMPO_STATES.has(event.payload.tempo), "Invalid TempoChanged payload");
            return;
        case "TimeAdvanced":
            assert(event.payload.hours === undefined || (Number.isInteger(event.payload.hours) && Number(event.payload.hours) > 0), "Invalid TimeAdvanced payload");
            return;
        case "ChallengeAttempted":
            assert(typeof event.payload.topic === "string" && isMathsTopic(event.payload.topic), "Invalid ChallengeAttempted topic");
            assert(typeof event.payload.correct === "boolean", "Invalid ChallengeAttempted correctness flag");
            assert(event.payload.mode === undefined || (typeof event.payload.mode === "string" && CHALLENGE_MODES.has(event.payload.mode)), "Invalid ChallengeAttempted mode");
            return;
        case "RemediationTriggered":
            assert(typeof event.payload.topic === "string" && isMathsTopic(event.payload.topic), "Invalid RemediationTriggered topic");
            assert(typeof event.payload.band === "string" && CURRICULUM_BANDS.has(event.payload.band), "Invalid RemediationTriggered band");
            assert(isFiniteNumber(event.payload.thresholdUsed) && event.payload.thresholdUsed >= 1, "Invalid RemediationTriggered threshold");
            return;
        case "TimedChallengeStarted":
            assert(typeof event.payload.challengeId === "string" && event.payload.challengeId.length > 0, "Invalid TimedChallengeStarted challengeId");
            assert(event.payload.timerHours === undefined || (Number.isInteger(event.payload.timerHours) && Number(event.payload.timerHours) > 0), "Invalid TimedChallengeStarted timerHours");
            return;
        case "TimedChallengeExpired":
            assert(typeof event.payload.challengeId === "string" && event.payload.challengeId.length > 0, "Invalid TimedChallengeExpired challengeId");
            return;
        case "LatentConsequenceRegistered":
            assert(isLatentConsequence(event.payload.consequence), "Invalid LatentConsequenceRegistered consequence");
            return;
        case "LatentConsequenceTriggered":
            assert(typeof event.payload.consequenceId === "string" && event.payload.consequenceId.length > 0, "Invalid LatentConsequenceTriggered payload");
            return;
        case "NPCRelationshipChanged":
            assert(typeof event.payload.npcId === "string" && event.payload.npcId.length > 0, "Invalid NPCRelationshipChanged npcId");
            assert(isFiniteNumber(event.payload.delta), "Invalid NPCRelationshipChanged delta");
            return;
        case "DarkIndexChanged":
            assert(isFiniteNumber(event.payload.delta), "Invalid DarkIndexChanged delta");
            return;
    }
}

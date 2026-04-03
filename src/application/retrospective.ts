import { reduceEvents } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
import type { CareerLevel, GameEvent, GameEventType, GameState, Rng } from "../domain/types.js";

const ROLE_ORDER: CareerLevel[] = ["backbencher", "pps", "junior_minister", "minister_of_state", "cabinet", "pm"];
const EVENT_TYPES: GameEventType[] = [
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
];

export interface RetrospectiveSummary {
  schoolYear: GameState["schoolYear"];
  finalRole: CareerLevel;
  peakRole: CareerLevel;
  finalTempo: GameState["currentTempo"];
  totalHours: number;
  finalScores: {
    partyLoyalty: number;
    publicApproval: number;
    constituencyApproval: number;
    pressRelationship: number;
    darkIndex: number;
  };
  challengeStats: {
    attempts: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    topicsAttempted: number;
  };
  remediationTriggered: number;
  activeTimedChallenges: number;
  pendingRemediations: number;
  ending: EndingAssessment;
}

export interface LegacySummary {
  score: number;
  band: "fragile" | "developing" | "established" | "dominant";
  rationale: string;
}

export interface LeaderboardEntry {
  modelVersion: "legacy-v1";
  runId: string;
  playerAlias: string;
  legacyScore: number;
  peakRole: CareerLevel;
  finalRole: CareerLevel;
  totalHours: number;
  challengeAccuracy: number;
  remediationTriggered: number;
  timestampIso: string;
}

export interface ReplayConsistency {
  deterministic: boolean;
  checkedFields: string[];
  mismatches: string[];
}

export type EndingOutcome = "continuing" | "voted_out" | "sacked" | "resigned" | "election_defeat";

export interface EndingAssessment {
  outcome: EndingOutcome;
  title: string;
  detail: string;
  reasons: string[];
}

export interface RetrospectiveReport {
  schemaVersion: "retrospective-v1";
  summary: RetrospectiveSummary;
  eventCounts: Record<GameEventType, number>;
  legacy: LegacySummary;
  leaderboardEntry: LeaderboardEntry;
  replay: ReplayConsistency;
}

export interface RetrospectiveRunRecord {
  savedAtIso: string;
  report: RetrospectiveReport;
}

export interface RetrospectiveComparison {
  schemaVersion: "retrospective-compare-v1";
  baselineRunId: string;
  candidateRunId: string;
  runCount: number;
  trends: {
    legacyScoreDelta: number;
    challengeAccuracyDelta: number;
    darkIndexDelta: number;
    totalHoursDelta: number;
  };
  replay: {
    allDeterministic: boolean;
    nonDeterministicRunIds: string[];
  };
}

export interface BuildRetrospectiveOptions {
  runId?: string;
  playerAlias?: string;
  seedState?: GameState;
  rng?: Rng;
  now?: Date;
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function countEvents(events: GameEvent[]): Record<GameEventType, number> {
  const counts = Object.fromEntries(EVENT_TYPES.map((type) => [type, 0])) as Record<GameEventType, number>;
  for (const event of events) {
    counts[event.type] += 1;
  }
  return counts;
}

function findPeakRole(state: GameState): CareerLevel {
  const roleSeen = new Set<CareerLevel>([state.currentRole]);
  for (const event of state.eventLog) {
    if (event.type !== "RoleChanged") {
      continue;
    }
    const role = event.payload.role;
    if (
      role === "backbencher" ||
      role === "pps" ||
      role === "junior_minister" ||
      role === "minister_of_state" ||
      role === "cabinet" ||
      role === "pm"
    ) {
      roleSeen.add(role);
    }
  }

  let peak: CareerLevel = "backbencher";
  for (const role of ROLE_ORDER) {
    if (roleSeen.has(role)) {
      peak = role;
    }
  }
  return peak;
}

function computeChallengeStats(events: GameEvent[]): RetrospectiveSummary["challengeStats"] {
  let attempts = 0;
  let correct = 0;
  const topics = new Set<string>();

  for (const event of events) {
    if (event.type !== "ChallengeAttempted") {
      continue;
    }
    attempts += 1;
    if (event.payload.correct === true) {
      correct += 1;
    }
    const topic = event.payload.topic;
    if (typeof topic === "string" && topic.length > 0) {
      topics.add(topic);
    }
  }

  const incorrect = attempts - correct;
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);
  return {
    attempts,
    correct,
    incorrect,
    accuracy,
    topicsAttempted: topics.size
  };
}

function computeLegacySummary(state: GameState, challengeAccuracy: number): LegacySummary {
  const composite = Math.round(
    state.partyLoyaltyScore * 0.24 +
    state.publicApproval * 0.24 +
    state.constituencyApproval * 0.18 +
    state.pressRelationship * 0.16 +
    challengeAccuracy * 0.18 -
    state.darkIndex * 0.2
  );
  const score = clampPercent(composite);

  if (score >= 75) {
    return {
      score,
      band: "dominant",
      rationale: "Broad approval remained strong while risk pressure stayed contained."
    };
  }
  if (score >= 60) {
    return {
      score,
      band: "established",
      rationale: "A stable record with more strengths than liabilities."
    };
  }
  if (score >= 40) {
    return {
      score,
      band: "developing",
      rationale: "Mixed outcomes kept progression viable but not secure."
    };
  }
  return {
    score,
    band: "fragile",
    rationale: "Risk, misses, or weak support outweighed headline progress."
  };
}

function hasMinisterialRole(role: CareerLevel): boolean {
  return role === "junior_minister" || role === "minister_of_state" || role === "cabinet" || role === "pm";
}

export function evaluateEndingState(state: GameState): EndingAssessment {
  const reasons: string[] = [];

  const resigned =
    state.darkIndex >= 85 &&
    (state.pressRelationship <= 35 || state.publicApproval <= 35);
  if (resigned) {
    reasons.push("dark-index critical");
    if (state.pressRelationship <= 35) {
      reasons.push("press relationship collapse");
    }
    if (state.publicApproval <= 35) {
      reasons.push("public approval collapse");
    }
    return {
      outcome: "resigned",
      title: "Resigned under pressure",
      detail: "Sustained risk pressure made the position untenable.",
      reasons
    };
  }

  const sacked =
    hasMinisterialRole(state.currentRole) &&
    (state.partyLoyaltyScore <= 25 || state.darkIndex >= 75);
  if (sacked) {
    reasons.push("ministerial confidence lost");
    if (state.partyLoyaltyScore <= 25) {
      reasons.push("party loyalty below dismissal threshold");
    }
    if (state.darkIndex >= 75) {
      reasons.push("risk escalation triggered leadership intervention");
    }
    return {
      outcome: "sacked",
      title: "Dismissed from office",
      detail: "Leadership removed you from post after confidence broke down.",
      reasons
    };
  }

  const electionDefeat =
    state.timeHours >= 96 &&
    (state.publicApproval + state.constituencyApproval) <= 70;
  if (electionDefeat) {
    reasons.push("election cycle reached");
    reasons.push("combined mandate score below threshold");
    return {
      outcome: "election_defeat",
      title: "Election defeat",
      detail: "The wider mandate failed at election checkpoint.",
      reasons
    };
  }

  const votedOut =
    state.constituencyApproval <= 20 &&
    state.publicApproval <= 30;
  if (votedOut) {
    reasons.push("constituency approval collapse");
    reasons.push("public approval collapse");
    return {
      outcome: "voted_out",
      title: "Voted out",
      detail: "Local support collapsed below survivable levels.",
      reasons
    };
  }

  return {
    outcome: "continuing",
    title: "Career active",
    detail: "No terminal ending condition is currently met.",
    reasons: []
  };
}

function buildReplayConsistency(state: GameState, seedState: GameState, rng: Rng): ReplayConsistency {
  const replayed = reduceEvents(seedState, state.eventLog, rng, { evaluateLatent: false });
  const checkedFields = [
    "schoolYear",
    "currentRole",
    "currentTempo",
    "timeHours",
    "partyLoyaltyScore",
    "publicApproval",
    "constituencyApproval",
    "pressRelationship",
    "darkIndex",
    "pendingRemediations.length",
    "activeTimedChallenges.count",
    "eventLog.length"
  ];
  const mismatches: string[] = [];

  const compare = (label: string, left: number | string, right: number | string) => {
    if (left !== right) {
      mismatches.push(`${label}: expected ${String(left)} got ${String(right)}`);
    }
  };

  compare("schoolYear", state.schoolYear, replayed.schoolYear);
  compare("currentRole", state.currentRole, replayed.currentRole);
  compare("currentTempo", state.currentTempo, replayed.currentTempo);
  compare("timeHours", state.timeHours, replayed.timeHours);
  compare("partyLoyaltyScore", state.partyLoyaltyScore, replayed.partyLoyaltyScore);
  compare("publicApproval", state.publicApproval, replayed.publicApproval);
  compare("constituencyApproval", state.constituencyApproval, replayed.constituencyApproval);
  compare("pressRelationship", state.pressRelationship, replayed.pressRelationship);
  compare("darkIndex", state.darkIndex, replayed.darkIndex);
  compare("pendingRemediations.length", state.pendingRemediations.length, replayed.pendingRemediations.length);
  compare("activeTimedChallenges.count", Object.keys(state.activeTimedChallenges).length, Object.keys(replayed.activeTimedChallenges).length);
  compare("eventLog.length", state.eventLog.length, replayed.eventLog.length);

  return {
    deterministic: mismatches.length === 0,
    checkedFields,
    mismatches
  };
}

export function buildRetrospectiveReport(state: GameState, options: BuildRetrospectiveOptions = {}): RetrospectiveReport {
  const challengeStats = computeChallengeStats(state.eventLog);
  const legacy = computeLegacySummary(state, challengeStats.accuracy);
  const replay = buildReplayConsistency(
    state,
    options.seedState ?? createInitialGameState(state.schoolYear),
    options.rng ?? Math.random
  );
  const now = options.now ?? new Date();
  const peakRole = findPeakRole(state);
  const ending = evaluateEndingState(state);

  return {
    schemaVersion: "retrospective-v1",
    summary: {
      schoolYear: state.schoolYear,
      finalRole: state.currentRole,
      peakRole,
      finalTempo: state.currentTempo,
      totalHours: state.timeHours,
      finalScores: {
        partyLoyalty: state.partyLoyaltyScore,
        publicApproval: state.publicApproval,
        constituencyApproval: state.constituencyApproval,
        pressRelationship: state.pressRelationship,
        darkIndex: state.darkIndex
      },
      challengeStats,
      remediationTriggered: state.eventLog.filter((event) => event.type === "RemediationTriggered").length,
      activeTimedChallenges: Object.keys(state.activeTimedChallenges).length,
      pendingRemediations: state.pendingRemediations.length,
      ending
    },
    eventCounts: countEvents(state.eventLog),
    legacy,
    leaderboardEntry: {
      modelVersion: "legacy-v1",
      runId: options.runId ?? `run-${state.schoolYear}-${state.timeHours}h-${state.eventLog.length}e`,
      playerAlias: options.playerAlias ?? "desk-shell",
      legacyScore: legacy.score,
      peakRole,
      finalRole: state.currentRole,
      totalHours: state.timeHours,
      challengeAccuracy: challengeStats.accuracy,
      remediationTriggered: state.eventLog.filter((event) => event.type === "RemediationTriggered").length,
      timestampIso: now.toISOString()
    },
    replay
  };
}

export function buildRetrospectiveComparison(records: RetrospectiveRunRecord[]): RetrospectiveComparison {
  if (records.length < 2) {
    throw new Error("At least two retrospective run records are required for comparison.");
  }

  const ordered = [...records].sort((left, right) => toTimestamp(left.savedAtIso) - toTimestamp(right.savedAtIso));
  const baseline = ordered[ordered.length - 2];
  const candidate = ordered[ordered.length - 1];
  if (!baseline || !candidate) {
    throw new Error("Unable to derive baseline/candidate runs for comparison.");
  }

  const nonDeterministicRunIds = ordered
    .filter((entry) => !entry.report.replay.deterministic)
    .map((entry) => entry.report.leaderboardEntry.runId);

  return {
    schemaVersion: "retrospective-compare-v1",
    baselineRunId: baseline.report.leaderboardEntry.runId,
    candidateRunId: candidate.report.leaderboardEntry.runId,
    runCount: ordered.length,
    trends: {
      legacyScoreDelta: candidate.report.legacy.score - baseline.report.legacy.score,
      challengeAccuracyDelta: candidate.report.summary.challengeStats.accuracy - baseline.report.summary.challengeStats.accuracy,
      darkIndexDelta: candidate.report.summary.finalScores.darkIndex - baseline.report.summary.finalScores.darkIndex,
      totalHoursDelta: candidate.report.summary.totalHours - baseline.report.summary.totalHours
    },
    replay: {
      allDeterministic: nonDeterministicRunIds.length === 0,
      nonDeterministicRunIds
    }
  };
}

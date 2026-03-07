import { createMathsPerformanceProfile } from "./remediation.js";
import type { GameState, SchoolYear } from "./types.js";

export function createInitialGameState(schoolYear: SchoolYear = "Y9"): GameState {
  return {
    eventLog: [],

    partyLoyaltyScore: 50,
    departmentalCompetence: {},
    publicApproval: 50,
    constituencyApproval: 50,
    pressRelationship: 50,
    factionalAlignment: [],
    npcRelationships: {},
    darkIndex: 0,
    mathsPerformance: createMathsPerformanceProfile(),

    currentRole: "backbencher",
    currentTempo: "parliamentary",
    timeHours: 0,
    schoolYear,

    activeTimedChallenges: {},
    pendingLatentConsequences: [],
    pendingRemediations: []
  };
}

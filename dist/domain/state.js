import { createMathsPerformanceProfile } from "./remediation.js";
export function createInitialGameState(schoolYear = "Y9") {
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

import type { ChallengeMode, TempoState } from "./types.js";

export interface ChallengeConsequenceDeltas {
  partyLoyaltyDelta: number;
  publicApprovalDelta: number;
  constituencyApprovalDelta: number;
  pressRelationshipDelta: number;
  darkIndexDelta: number;
  departmentalCompetenceDelta: number;
}

interface ModeTempoProfile {
  success: ChallengeConsequenceDeltas;
  failure: ChallengeConsequenceDeltas;
}

const ZERO_DELTAS: ChallengeConsequenceDeltas = {
  partyLoyaltyDelta: 0,
  publicApprovalDelta: 0,
  constituencyApprovalDelta: 0,
  pressRelationshipDelta: 0,
  darkIndexDelta: 0,
  departmentalCompetenceDelta: 0
};

const MODE_TEMPO_PROFILES: Record<ChallengeMode, Record<TempoState, ModeTempoProfile>> = {
  decision: {
    recess: {
      success: { ...ZERO_DELTAS, constituencyApprovalDelta: 1, departmentalCompetenceDelta: 1, darkIndexDelta: -1 },
      failure: { ...ZERO_DELTAS, constituencyApprovalDelta: -1, departmentalCompetenceDelta: -1, darkIndexDelta: 1 }
    },
    parliamentary: {
      success: { ...ZERO_DELTAS, publicApprovalDelta: 1, constituencyApprovalDelta: 1, departmentalCompetenceDelta: 1, darkIndexDelta: -1 },
      failure: { ...ZERO_DELTAS, publicApprovalDelta: -1, departmentalCompetenceDelta: -1, darkIndexDelta: 1 }
    },
    crisis: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 1, publicApprovalDelta: 1, pressRelationshipDelta: 1, departmentalCompetenceDelta: 1, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, publicApprovalDelta: -2, pressRelationshipDelta: -2, departmentalCompetenceDelta: -1, darkIndexDelta: 2 }
    },
    media_storm: {
      success: { ...ZERO_DELTAS, publicApprovalDelta: 1, pressRelationshipDelta: 2, departmentalCompetenceDelta: 1, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, publicApprovalDelta: -1, pressRelationshipDelta: -3, departmentalCompetenceDelta: -1, darkIndexDelta: 2 }
    }
  },
  gate: {
    recess: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 1, constituencyApprovalDelta: 1, departmentalCompetenceDelta: 2, darkIndexDelta: -1 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -1, constituencyApprovalDelta: -1, departmentalCompetenceDelta: -2, darkIndexDelta: 1 }
    },
    parliamentary: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 2, publicApprovalDelta: 1, departmentalCompetenceDelta: 2, darkIndexDelta: -1 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -2, publicApprovalDelta: -1, departmentalCompetenceDelta: -2, darkIndexDelta: 2 }
    },
    crisis: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 2, pressRelationshipDelta: 1, departmentalCompetenceDelta: 2, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -3, publicApprovalDelta: -2, pressRelationshipDelta: -2, departmentalCompetenceDelta: -2, darkIndexDelta: 3 }
    },
    media_storm: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 1, pressRelationshipDelta: 2, departmentalCompetenceDelta: 2, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -2, publicApprovalDelta: -1, pressRelationshipDelta: -3, departmentalCompetenceDelta: -2, darkIndexDelta: 3 }
    }
  },
  crisis: {
    recess: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 2, publicApprovalDelta: 2, pressRelationshipDelta: 1, departmentalCompetenceDelta: 3, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -3, publicApprovalDelta: -2, departmentalCompetenceDelta: -3, darkIndexDelta: 3 }
    },
    parliamentary: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 2, publicApprovalDelta: 2, pressRelationshipDelta: 1, departmentalCompetenceDelta: 3, darkIndexDelta: -2 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -3, publicApprovalDelta: -2, departmentalCompetenceDelta: -3, darkIndexDelta: 3 }
    },
    crisis: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 3, publicApprovalDelta: 3, pressRelationshipDelta: 2, departmentalCompetenceDelta: 3, darkIndexDelta: -3 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -4, publicApprovalDelta: -3, pressRelationshipDelta: -3, departmentalCompetenceDelta: -3, darkIndexDelta: 4 }
    },
    media_storm: {
      success: { ...ZERO_DELTAS, partyLoyaltyDelta: 3, publicApprovalDelta: 3, pressRelationshipDelta: 3, departmentalCompetenceDelta: 3, darkIndexDelta: -3 },
      failure: { ...ZERO_DELTAS, partyLoyaltyDelta: -4, publicApprovalDelta: -3, pressRelationshipDelta: -4, departmentalCompetenceDelta: -3, darkIndexDelta: 4 }
    }
  }
};

export function getChallengeConsequenceDeltas(
  mode: ChallengeMode,
  tempo: TempoState,
  correct: boolean
): ChallengeConsequenceDeltas {
  const profile = MODE_TEMPO_PROFILES[mode][tempo];
  return correct ? profile.success : profile.failure;
}

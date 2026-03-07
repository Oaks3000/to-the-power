import type { GameEvent, GameState, LatentConsequence, Rng } from "./types.js";

function isActive(consequence: LatentConsequence, atHour: number): boolean {
  if (consequence.expiresAtHour === undefined) {
    return true;
  }
  return consequence.expiresAtHour >= atHour;
}

export function evaluateActivationCondition(state: GameState, consequence: LatentConsequence): boolean {
  switch (consequence.activationCondition) {
    case "dark_index_critical":
      return state.darkIndex >= 81;
    case "cabinet_loyalty_whip_risk": {
      const whip = state.npcRelationships["gerald_fosse"];
      return state.currentRole === "cabinet" && state.partyLoyaltyScore < 45 && (whip?.relationshipScore ?? 100) < 30;
    }
    default:
      return false;
  }
}

export function evaluateLatentConsequences(
  state: GameState,
  rng: Rng = Math.random
): { state: GameState; triggered: GameEvent[] } {
  const survivors: LatentConsequence[] = [];
  const triggered: GameEvent[] = [];

  for (const consequence of state.pendingLatentConsequences) {
    if (!isActive(consequence, state.timeHours)) {
      continue;
    }

    if (evaluateActivationCondition(state, consequence) && rng() <= consequence.probability) {
      triggered.push({
        type: "LatentConsequenceTriggered",
        atHour: state.timeHours,
        payload: { consequenceId: consequence.id }
      });
      triggered.push({
        ...consequence.payload,
        atHour: state.timeHours
      });
      continue;
    }

    survivors.push(consequence);
  }

  return {
    state: {
      ...state,
      pendingLatentConsequences: survivors
    },
    triggered
  };
}

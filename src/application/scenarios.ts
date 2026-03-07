import type { GameCommand } from "../domain/commands.js";
import type { ChallengeMode, TempoState } from "../domain/types.js";

export type ScenarioChallengePolicy = "seeded" | "always_correct" | "always_incorrect";

export interface ScenarioStep {
  id: string;
  label: string;
  preCommands?: GameCommand[];
  burstCount?: number;
  challengePolicy?: ScenarioChallengePolicy;
  applySceneEffects?: boolean;
  skipAdvance?: boolean;
  advanceHours?: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  schoolYear: "Y9" | "Y10" | "Y11";
  steps: ScenarioStep[];
}

function baseSuccessRate(mode: ChallengeMode, tempo: TempoState): number {
  let rate = 0.75;

  if (mode === "gate") {
    rate -= 0.05;
  } else if (mode === "crisis") {
    rate -= 0.1;
  }

  if (tempo === "crisis") {
    rate -= 0.06;
  } else if (tempo === "media_storm") {
    rate -= 0.08;
  } else if (tempo === "recess") {
    rate += 0.05;
  }

  return Math.max(0.05, Math.min(0.95, rate));
}

export function sampleChallengeOutcome(mode: ChallengeMode, tempo: TempoState, rng: () => number): boolean {
  return rng() < baseSuccessRate(mode, tempo);
}

export const DEFAULT_BALANCING_SCENARIO: ScenarioDefinition = {
  id: "phase1_balancing_v1",
  name: "Phase 1 Balancing Path",
  schoolYear: "Y9",
  steps: [
    {
      id: "s1_opening_parliament",
      label: "Opening parliamentary brief",
      burstCount: 1,
      challengePolicy: "seeded"
    },
    {
      id: "s2_crisis_whip_window",
      label: "Crisis whip window",
      preCommands: [{ type: "change_tempo", tempo: "crisis" }],
      burstCount: 3,
      challengePolicy: "seeded"
    },
    {
      id: "s2b_crisis_second_bell",
      label: "Crisis second bell",
      burstCount: 3,
      challengePolicy: "seeded"
    },
    {
      id: "s3_media_pressure_pps",
      label: "PPS media pressure",
      preCommands: [
        { type: "change_role", role: "pps" },
        { type: "change_tempo", tempo: "media_storm" }
      ],
      burstCount: 3,
      challengePolicy: "seeded"
    },
    {
      id: "s3b_media_followup",
      label: "PPS media follow-up",
      burstCount: 3,
      challengePolicy: "seeded"
    },
    {
      id: "s4_transition_year10",
      label: "Year 10 policy transition",
      preCommands: [
        { type: "set_school_year", schoolYear: "Y10" },
        { type: "change_role", role: "junior_minister" },
        { type: "change_tempo", tempo: "parliamentary" }
      ],
      burstCount: 2,
      challengePolicy: "seeded"
    },
    {
      id: "s5_recess_reset",
      label: "Recess reset",
      preCommands: [{ type: "change_tempo", tempo: "recess" }],
      burstCount: 1,
      challengePolicy: "seeded"
    },
    {
      id: "s6_final_crisis",
      label: "Final crisis pass",
      preCommands: [{ type: "change_tempo", tempo: "crisis" }],
      burstCount: 3,
      challengePolicy: "seeded"
    },
    {
      id: "s6b_crisis_aftershock",
      label: "Final crisis aftershock",
      burstCount: 3,
      challengePolicy: "seeded"
    }
  ]
};

import type { TempoState } from "./types.js";

export interface TempoCadencePolicy {
  minHours: number;
  maxHours: number;
  defaultAdvanceHours: number;
  defaultEventBurst: number;
}

export const TEMPO_CADENCE: Record<TempoState, TempoCadencePolicy> = {
  recess: {
    minHours: 24 * 14,
    maxHours: 24 * 56,
    defaultAdvanceHours: 24 * 21,
    defaultEventBurst: 1
  },
  parliamentary: {
    minHours: 24,
    maxHours: 24 * 10,
    defaultAdvanceHours: 24 * 3,
    defaultEventBurst: 1
  },
  crisis: {
    minHours: 1,
    maxHours: 24 * 3,
    defaultAdvanceHours: 6,
    defaultEventBurst: 3
  },
  media_storm: {
    minHours: 1,
    maxHours: 24,
    defaultAdvanceHours: 3,
    defaultEventBurst: 2
  }
};

export function defaultAdvanceHoursForTempo(tempo: TempoState): number {
  return TEMPO_CADENCE[tempo].defaultAdvanceHours;
}

export function defaultEventBurstForTempo(tempo: TempoState): number {
  return TEMPO_CADENCE[tempo].defaultEventBurst;
}

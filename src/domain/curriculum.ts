import type { CareerLevel, CurriculumBand, SchoolYear } from "./types.js";

const CURRICULUM_MATRIX: Record<SchoolYear, Record<CareerLevel, CurriculumBand>> = {
  Y9: {
    backbencher: "Y9",
    pps: "Y9",
    junior_minister: "Y9",
    minister_of_state: "Y9",
    cabinet: "Y9",
    pm: "Y9"
  },
  Y10: {
    backbencher: "Y9",
    pps: "Y9",
    junior_minister: "Y9-10",
    minister_of_state: "Y10",
    cabinet: "Y10",
    pm: "Y10"
  },
  Y11: {
    backbencher: "Y9",
    pps: "Y9-10",
    junior_minister: "Y10-11",
    minister_of_state: "Y11",
    cabinet: "Y11",
    pm: "Y11"
  }
};

export function getCurriculumBand(schoolYear: SchoolYear, careerLevel: CareerLevel): CurriculumBand {
  return CURRICULUM_MATRIX[schoolYear][careerLevel];
}

export function isTransitionBand(band: CurriculumBand): boolean {
  return band === "Y9-10" || band === "Y10-11";
}

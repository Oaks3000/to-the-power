import type { CareerLevel, ChallengeMode, CurriculumBand, MathsTopic, TempoState } from "../domain/types.js";

export interface ChallengeContent {
  id: string;
  topic: MathsTopic;
  band: CurriculumBand;
  mode: ChallengeMode;
  prompt: string;
  answer: number;
  tolerance: number;
  unit: string;
  timed?: boolean;
  timerSeconds?: number;
  tags?: string[];
}

export interface NPCContent {
  id: string;
  name: string;
  role: string;
  startingDisposition: number;
}

export interface SceneContent {
  id: string;
  npcId: string;
  careerLevels: CareerLevel[];
  tempos: TempoState[];
  text: string;
  relationshipDelta?: number;
}

export interface EventCardContent {
  id: string;
  title: string;
  description: string;
  careerLevels: CareerLevel[];
  tempos: TempoState[];
  bands: CurriculumBand[];
  candidateChallengeIds: string[];
  candidateSceneIds: string[];
  weight: number;
}

export interface BriefingContent {
  id: string;
  advisor: string;
  topic: MathsTopic;
  bands: CurriculumBand[];
  text: string;
}

export interface ContentBundle {
  version: string;
  generatedAt: string;
  challenges: ChallengeContent[];
  npcs: NPCContent[];
  scenes: SceneContent[];
  eventCards: EventCardContent[];
  briefings: BriefingContent[];
}

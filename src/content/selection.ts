import { getCurriculumBand } from "../domain/curriculum.js";
import { defaultEventBurstForTempo } from "../domain/tempo.js";
import type { GameState } from "../domain/types.js";
import type { ChallengeContent, ContentBundle, EventCardContent, SceneContent } from "./types.js";

interface WeightedItem {
  id: string;
  weight: number;
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function score(seed: string, id: string): number {
  return fnv1a(`${seed}:${id}`) / 0xffffffff;
}

function pickDeterministicWeighted<T extends WeightedItem>(seed: string, items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let winner = items[0];
  let bestScore = -1;
  for (const item of items) {
    const weightedScore = score(seed, item.id) * item.weight;
    if (weightedScore > bestScore) {
      winner = item;
      bestScore = weightedScore;
    }
  }
  return winner;
}

function pickDeterministic<T extends { id: string }>(seed: string, items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  const index = fnv1a(seed) % items.length;
  return items[index];
}

export interface CurrentSelection {
  band: ReturnType<typeof getCurriculumBand>;
  eventCard?: EventCardContent;
  challenge?: ChallengeContent;
  scene?: SceneContent;
}

export type WeeklySelection = CurrentSelection;

function selectCurrentContentForSeed(state: GameState, bundle: ContentBundle, seedSuffix: string): CurrentSelection {
  const band = getCurriculumBand(state.schoolYear, state.currentRole);
  const seed = `${state.timeHours}|${state.currentRole}|${state.currentTempo}|${band}|${seedSuffix}`;

  const eligibleCards = bundle.eventCards.filter((card) =>
    card.careerLevels.includes(state.currentRole) &&
    card.tempos.includes(state.currentTempo) &&
    card.bands.includes(band)
  );

  const eventCard = pickDeterministicWeighted(seed, eligibleCards);

  if (!eventCard) {
    return { band };
  }

  const candidateChallenges = bundle.challenges.filter((challenge) => eventCard.candidateChallengeIds.includes(challenge.id));
  const candidateScenes = bundle.scenes.filter((scene) => eventCard.candidateSceneIds.includes(scene.id));

  const challenge = pickDeterministic(`${seed}:challenge`, candidateChallenges);
  const scene = pickDeterministic(`${seed}:scene`, candidateScenes);

  const selection: CurrentSelection = { band, eventCard };
  if (challenge) {
    selection.challenge = challenge;
  }
  if (scene) {
    selection.scene = scene;
  }

  return selection;
}

export function selectCurrentContent(state: GameState, bundle: ContentBundle): CurrentSelection {
  return selectCurrentContentForSeed(state, bundle, "slot:0");
}

export function selectCurrentContentBatch(
  state: GameState,
  bundle: ContentBundle,
  burstCount: number = defaultEventBurstForTempo(state.currentTempo)
): CurrentSelection[] {
  if (!Number.isInteger(burstCount) || burstCount <= 0) {
    return [];
  }

  const seen = new Set<string>();
  const selections: CurrentSelection[] = [];

  for (let slot = 0; slot < burstCount; slot += 1) {
    const selection = selectCurrentContentForSeed(state, bundle, `slot:${slot}`);
    const key = `${selection.eventCard?.id ?? "none"}|${selection.challenge?.id ?? "none"}|${selection.scene?.id ?? "none"}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    selections.push(selection);
  }

  return selections;
}

export const selectWeeklyContent = selectCurrentContent;

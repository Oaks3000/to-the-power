import { isMathsTopic } from "../domain/events.js";
import type { CareerLevel, ChallengeMode, CurriculumBand, TempoState } from "../domain/types.js";
import type { BriefingContent, ChallengeContent, ContentBundle, EventCardContent, NPCContent, SceneContent } from "./types.js";

const CAREER_LEVELS = new Set<CareerLevel>(["backbencher", "pps", "junior_minister", "minister_of_state", "cabinet", "pm"]);
const TEMPOS = new Set<TempoState>(["recess", "parliamentary", "crisis", "media_storm"]);
const MODES = new Set<ChallengeMode>(["decision", "gate", "crisis"]);
const BANDS = new Set<CurriculumBand>(["Y9", "Y9-10", "Y10", "Y10-11", "Y11"]);

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertString(value: unknown, message: string): asserts value is string {
  assert(typeof value === "string" && value.length > 0, message);
}

function assertNumber(value: unknown, message: string): asserts value is number {
  assert(typeof value === "number" && Number.isFinite(value), message);
}

function assertArray(value: unknown, message: string): asserts value is unknown[] {
  assert(Array.isArray(value), message);
}

function assertCareerLevels(value: unknown, message: string): asserts value is CareerLevel[] {
  assertArray(value, message);
  for (const entry of value) {
    assert(typeof entry === "string" && CAREER_LEVELS.has(entry as CareerLevel), message);
  }
}

function assertTempos(value: unknown, message: string): asserts value is TempoState[] {
  assertArray(value, message);
  for (const entry of value) {
    assert(typeof entry === "string" && TEMPOS.has(entry as TempoState), message);
  }
}

function assertBands(value: unknown, message: string): asserts value is CurriculumBand[] {
  assertArray(value, message);
  for (const entry of value) {
    assert(typeof entry === "string" && BANDS.has(entry as CurriculumBand), message);
  }
}

function assertChallenge(candidate: unknown, index: number): asserts candidate is ChallengeContent {
  assert(isRecord(candidate), `Challenge[${index}] must be an object`);
  assertString(candidate.id, `Challenge[${index}].id invalid`);
  assert(typeof candidate.topic === "string" && isMathsTopic(candidate.topic), `Challenge[${index}].topic invalid`);
  assert(typeof candidate.band === "string" && BANDS.has(candidate.band as CurriculumBand), `Challenge[${index}].band invalid`);
  assert(typeof candidate.mode === "string" && MODES.has(candidate.mode as ChallengeMode), `Challenge[${index}].mode invalid`);
  assertString(candidate.prompt, `Challenge[${index}].prompt invalid`);
  assertNumber(candidate.answer, `Challenge[${index}].answer invalid`);
  assertNumber(candidate.tolerance, `Challenge[${index}].tolerance invalid`);
  assertString(candidate.unit, `Challenge[${index}].unit invalid`);
  if (candidate.timed !== undefined) {
    assert(typeof candidate.timed === "boolean", `Challenge[${index}].timed invalid`);
  }
  if (candidate.timerSeconds !== undefined) {
    assert(
      typeof candidate.timerSeconds === "number" && Number.isInteger(candidate.timerSeconds) && candidate.timerSeconds > 0,
      `Challenge[].timerSeconds invalid`
    );
  }
}

function assertNpc(candidate: unknown, index: number): asserts candidate is NPCContent {
  assert(isRecord(candidate), `NPC[${index}] must be an object`);
  assertString(candidate.id, `NPC[${index}].id invalid`);
  assertString(candidate.name, `NPC[${index}].name invalid`);
  assertString(candidate.role, `NPC[${index}].role invalid`);
  assertNumber(candidate.startingDisposition, `NPC[${index}].startingDisposition invalid`);
}

function assertScene(candidate: unknown, index: number): asserts candidate is SceneContent {
  assert(isRecord(candidate), `Scene[${index}] must be an object`);
  assertString(candidate.id, `Scene[${index}].id invalid`);
  assertString(candidate.npcId, `Scene[${index}].npcId invalid`);
  assertCareerLevels(candidate.careerLevels, `Scene[${index}].careerLevels invalid`);
  assertTempos(candidate.tempos, `Scene[${index}].tempos invalid`);
  assertString(candidate.text, `Scene[${index}].text invalid`);
  if (candidate.relationshipDelta !== undefined) {
    assertNumber(candidate.relationshipDelta, `Scene[${index}].relationshipDelta invalid`);
  }
}

function assertEventCard(candidate: unknown, index: number): asserts candidate is EventCardContent {
  assert(isRecord(candidate), `EventCard[${index}] must be an object`);
  assertString(candidate.id, `EventCard[${index}].id invalid`);
  assertString(candidate.title, `EventCard[${index}].title invalid`);
  assertString(candidate.description, `EventCard[${index}].description invalid`);
  assertCareerLevels(candidate.careerLevels, `EventCard[${index}].careerLevels invalid`);
  assertTempos(candidate.tempos, `EventCard[${index}].tempos invalid`);
  assertBands(candidate.bands, `EventCard[${index}].bands invalid`);
  assertArray(candidate.candidateChallengeIds, `EventCard[${index}].candidateChallengeIds invalid`);
  assertArray(candidate.candidateSceneIds, `EventCard[${index}].candidateSceneIds invalid`);
  for (const challengeId of candidate.candidateChallengeIds) {
    assertString(challengeId, `EventCard[${index}] challenge id invalid`);
  }
  for (const sceneId of candidate.candidateSceneIds) {
    assertString(sceneId, `EventCard[${index}] scene id invalid`);
  }
  assertNumber(candidate.weight, `EventCard[${index}].weight invalid`);
  assert(candidate.weight > 0, `EventCard[${index}].weight must be > 0`);
}

function assertBriefing(candidate: unknown, index: number): asserts candidate is BriefingContent {
  assert(isRecord(candidate), `Briefing[${index}] must be an object`);
  assertString(candidate.id, `Briefing[${index}].id invalid`);
  assertString(candidate.advisor, `Briefing[${index}].advisor invalid`);
  assert(typeof candidate.topic === "string" && isMathsTopic(candidate.topic), `Briefing[${index}].topic invalid`);
  assertBands(candidate.bands, `Briefing[${index}].bands invalid`);
  assertString(candidate.text, `Briefing[${index}].text invalid`);
}

function assertUniqueIds(items: { id: string }[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    assert(!seen.has(item.id), `Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

export function validateContentBundle(bundle: ContentBundle): void {
  assertString(bundle.version, "ContentBundle.version invalid");
  assertString(bundle.generatedAt, "ContentBundle.generatedAt invalid");

  assertArray(bundle.challenges, "ContentBundle.challenges invalid");
  assertArray(bundle.npcs, "ContentBundle.npcs invalid");
  assertArray(bundle.scenes, "ContentBundle.scenes invalid");
  assertArray(bundle.eventCards, "ContentBundle.eventCards invalid");
  assertArray(bundle.briefings, "ContentBundle.briefings invalid");

  bundle.challenges.forEach((item, index) => assertChallenge(item, index));
  bundle.npcs.forEach((item, index) => assertNpc(item, index));
  bundle.scenes.forEach((item, index) => assertScene(item, index));
  bundle.eventCards.forEach((item, index) => assertEventCard(item, index));
  bundle.briefings.forEach((item, index) => assertBriefing(item, index));

  assertUniqueIds(bundle.challenges, "challenge");
  assertUniqueIds(bundle.npcs, "npc");
  assertUniqueIds(bundle.scenes, "scene");
  assertUniqueIds(bundle.eventCards, "event card");
  assertUniqueIds(bundle.briefings, "briefing");

  const challengeIds = new Set(bundle.challenges.map((challenge) => challenge.id));
  const sceneIds = new Set(bundle.scenes.map((scene) => scene.id));
  const npcIds = new Set(bundle.npcs.map((npc) => npc.id));

  for (const scene of bundle.scenes) {
    assert(npcIds.has(scene.npcId), `Scene ${scene.id} references missing NPC: ${scene.npcId}`);
  }

  for (const eventCard of bundle.eventCards) {
    for (const challengeId of eventCard.candidateChallengeIds) {
      assert(challengeIds.has(challengeId), `EventCard ${eventCard.id} references missing challenge: ${challengeId}`);
    }
    for (const sceneId of eventCard.candidateSceneIds) {
      assert(sceneIds.has(sceneId), `EventCard ${eventCard.id} references missing scene: ${sceneId}`);
    }
  }
}

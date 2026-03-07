import { getCurriculumBand } from "../domain/curriculum.js";
import { defaultEventBurstForTempo } from "../domain/tempo.js";
function fnv1a(input) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}
function score(seed, id) {
    return fnv1a(`${seed}:${id}`) / 0xffffffff;
}
function pickDeterministicWeighted(seed, items) {
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
function pickDeterministic(seed, items) {
    if (items.length === 0) {
        return undefined;
    }
    const index = fnv1a(seed) % items.length;
    return items[index];
}
function selectCurrentContentForSeed(state, bundle, seedSuffix) {
    const band = getCurriculumBand(state.schoolYear, state.currentRole);
    const seed = `${state.timeHours}|${state.currentRole}|${state.currentTempo}|${band}|${seedSuffix}`;
    const eligibleCards = bundle.eventCards.filter((card) => card.careerLevels.includes(state.currentRole) &&
        card.tempos.includes(state.currentTempo) &&
        card.bands.includes(band));
    const eventCard = pickDeterministicWeighted(seed, eligibleCards);
    if (!eventCard) {
        return { band };
    }
    const candidateChallenges = bundle.challenges.filter((challenge) => eventCard.candidateChallengeIds.includes(challenge.id));
    const candidateScenes = bundle.scenes.filter((scene) => eventCard.candidateSceneIds.includes(scene.id));
    const challenge = pickDeterministic(`${seed}:challenge`, candidateChallenges);
    const scene = pickDeterministic(`${seed}:scene`, candidateScenes);
    const selection = { band, eventCard };
    if (challenge) {
        selection.challenge = challenge;
    }
    if (scene) {
        selection.scene = scene;
    }
    return selection;
}
export function selectCurrentContent(state, bundle) {
    return selectCurrentContentForSeed(state, bundle, "slot:0");
}
export function selectCurrentContentBatch(state, bundle, burstCount = defaultEventBurstForTempo(state.currentTempo)) {
    if (!Number.isInteger(burstCount) || burstCount <= 0) {
        return [];
    }
    const seen = new Set();
    const selections = [];
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

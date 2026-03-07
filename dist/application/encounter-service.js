export function executeEncounterBatch(selections, applyCommand, options = {}) {
    const slotResults = [];
    const applySceneEffects = options.applySceneEffects ?? true;
    selections.forEach((selection, index) => {
        const slot = { selection };
        if (selection.challenge) {
            const challengeCorrect = options.challengeOutcomes?.[index] ?? options.defaultChallengeCorrect ?? true;
            slot.challengeResult = applyCommand({
                type: "submit_challenge_answer",
                topic: selection.challenge.topic,
                correct: challengeCorrect,
                mode: selection.challenge.mode
            });
        }
        if (applySceneEffects && selection.scene && selection.scene.relationshipDelta !== undefined && selection.scene.relationshipDelta !== 0) {
            slot.sceneResult = applyCommand({
                type: "change_npc_relationship",
                npcId: selection.scene.npcId,
                delta: selection.scene.relationshipDelta
            });
        }
        slotResults.push(slot);
    });
    let advanceResult;
    if (!options.skipAdvance) {
        const advanceCommand = options.advanceHours !== undefined
            ? { type: "advance_time", hours: options.advanceHours }
            : { type: "advance_time" };
        advanceResult = applyCommand(advanceCommand);
    }
    const result = {
        selections,
        slotResults
    };
    if (advanceResult) {
        result.advanceResult = advanceResult;
    }
    return result;
}

import type { CurrentSelection } from "../content/selection.js";
import type { CommandResult, GameCommand } from "../domain/commands.js";

export interface EncounterSequencerOptions {
  challengeOutcomes?: boolean[];
  defaultChallengeCorrect?: boolean;
  applySceneEffects?: boolean;
  advanceHours?: number;
  skipAdvance?: boolean;
}

export interface EncounterSlotResult {
  selection: CurrentSelection;
  challengeResult?: CommandResult;
  sceneResult?: CommandResult;
}

export interface EncounterBatchResult {
  selections: CurrentSelection[];
  slotResults: EncounterSlotResult[];
  advanceResult?: CommandResult;
}

export function executeEncounterBatch(
  selections: CurrentSelection[],
  applyCommand: (command: GameCommand) => CommandResult,
  options: EncounterSequencerOptions = {}
): EncounterBatchResult {
  const slotResults: EncounterSlotResult[] = [];
  const applySceneEffects = options.applySceneEffects ?? true;

  selections.forEach((selection, index) => {
    const slot: EncounterSlotResult = { selection };

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

  let advanceResult: CommandResult | undefined;
  if (!options.skipAdvance) {
    const advanceCommand: GameCommand =
      options.advanceHours !== undefined
        ? { type: "advance_time", hours: options.advanceHours }
        : { type: "advance_time" };
    advanceResult = applyCommand(advanceCommand);
  }

  const result: EncounterBatchResult = {
    selections,
    slotResults
  };

  if (advanceResult) {
    result.advanceResult = advanceResult;
  }

  return result;
}

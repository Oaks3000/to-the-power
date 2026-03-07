import assert from "node:assert/strict";
import test from "node:test";
import { applyEvent } from "../domain/reducer.js";
import { createInitialGameState } from "../domain/state.js";
test("latent consequences trigger when conditions and probability are satisfied", () => {
    let state = createInitialGameState("Y9");
    state = applyEvent(state, {
        type: "LatentConsequenceRegistered",
        atHour: state.timeHours,
        payload: {
            consequence: {
                id: "audit-risk-npc-impact",
                activationCondition: "dark_index_critical",
                probability: 1,
                payload: {
                    type: "NPCRelationshipChanged",
                    atHour: state.timeHours,
                    payload: { npcId: "gerald_fosse", delta: -10 }
                }
            }
        }
    });
    state = applyEvent(state, {
        type: "DarkIndexChanged",
        atHour: state.timeHours,
        payload: { delta: 81 }
    }, () => 0);
    assert.equal(state.npcRelationships["gerald_fosse"]?.relationshipScore, 40);
    assert.equal(state.pendingLatentConsequences.length, 0);
    assert.equal(state.eventLog.some((event) => event.type === "LatentConsequenceTriggered"), true);
});

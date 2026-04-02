import { resolve } from "node:path";
import { GameService } from "./game-service.js";
import { buildRetrospectiveReport } from "./retrospective.js";
function mapPacket(selection) {
    const packet = { band: selection.band };
    if (selection.eventCard) {
        packet.eventCard = {
            id: selection.eventCard.id,
            title: selection.eventCard.title,
            description: selection.eventCard.description
        };
    }
    if (selection.challenge) {
        const challenge = {
            id: selection.challenge.id,
            topic: selection.challenge.topic,
            mode: selection.challenge.mode,
            prompt: selection.challenge.prompt,
            unit: selection.challenge.unit,
            timed: selection.challenge.timed ?? false
        };
        if (selection.challenge.timerSeconds !== undefined) {
            challenge.timerSeconds = selection.challenge.timerSeconds;
        }
        packet.challenge = challenge;
    }
    if (selection.scene) {
        packet.scene = {
            id: selection.scene.id,
            npcId: selection.scene.npcId,
            text: selection.scene.text
        };
    }
    return packet;
}
function mapCommandResult(state, result) {
    return {
        summary: getStateSummary(state),
        warnings: result.warnings,
        events: result.events
    };
}
export function getStateSummary(state) {
    return {
        schoolYear: state.schoolYear,
        currentRole: state.currentRole,
        currentTempo: state.currentTempo,
        timeHours: state.timeHours,
        partyLoyaltyScore: state.partyLoyaltyScore,
        publicApproval: state.publicApproval,
        constituencyApproval: state.constituencyApproval,
        pressRelationship: state.pressRelationship,
        darkIndex: state.darkIndex,
        pendingRemediations: state.pendingRemediations.length,
        activeTimedChallenges: Object.keys(state.activeTimedChallenges).length,
        eventLogEntries: state.eventLog.length
    };
}
export class PrototypeApi {
    service;
    constructor(service) {
        this.service = service;
    }
    static async create(options = {}) {
        let service = options.service;
        if (!service) {
            const serviceOptions = {};
            if (options.schoolYear !== undefined) {
                serviceOptions.schoolYear = options.schoolYear;
            }
            if (options.rng !== undefined) {
                serviceOptions.rng = options.rng;
            }
            service = new GameService(serviceOptions);
        }
        const contentPath = options.contentPath ?? resolve(process.cwd(), "content/vertical-slice.json");
        await service.loadContent(contentPath);
        return new PrototypeApi(service);
    }
    getCurrentPacketBatch(burstCount) {
        return this.service.getCurrentPacketBatch(burstCount).map(mapPacket);
    }
    submitChallengeOutcome(input) {
        const command = {
            type: "submit_challenge_answer",
            topic: input.topic,
            correct: input.correct
        };
        if (input.mode !== undefined) {
            command.mode = input.mode;
        }
        const result = this.service.execute(command);
        return mapCommandResult(this.service.getState(), result);
    }
    advanceTime(hours) {
        const result = hours === undefined
            ? this.service.execute({ type: "advance_time" })
            : this.service.execute({ type: "advance_time", hours });
        return mapCommandResult(this.service.getState(), result);
    }
    getStateSummary() {
        return getStateSummary(this.service.getState());
    }
    getRetrospectiveReport(input = {}) {
        return buildRetrospectiveReport(this.service.getState(), input);
    }
}

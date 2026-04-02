import { executeCommandWithResult } from "/dist/domain/commands.js";
import { selectCurrentContentBatch } from "/dist/content/selection.js";
import { buildRetrospectiveReport } from "/dist/application/retrospective.js";
import { createInitialGameState } from "/dist/domain/state.js";

const ROLE_ORDER = ["backbencher", "pps", "junior_minister", "minister_of_state", "cabinet", "pm"];

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
    packet.challenge = {
      id: selection.challenge.id,
      topic: selection.challenge.topic,
      mode: selection.challenge.mode,
      prompt: selection.challenge.prompt,
      unit: selection.challenge.unit,
      timed: selection.challenge.timed ?? false,
      timerSeconds: selection.challenge.timerSeconds,
      expectedAnswer: selection.challenge.answer,
      tolerance: selection.challenge.tolerance
    };
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

function getStateSummary(state) {
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

function evaluateRequirements(summary, nextRole) {
  if (!nextRole) {
    return [];
  }

  const gates = {
    pps: [
      { key: "partyLoyaltyScore", label: "Party loyalty", target: 45 },
      { key: "publicApproval", label: "Public approval", target: 42 }
    ],
    junior_minister: [
      { key: "partyLoyaltyScore", label: "Party loyalty", target: 50 },
      { key: "publicApproval", label: "Public approval", target: 45 },
      { key: "pressRelationship", label: "Press relationship", target: 40 }
    ],
    minister_of_state: [
      { key: "partyLoyaltyScore", label: "Party loyalty", target: 56 },
      { key: "publicApproval", label: "Public approval", target: 48 }
    ],
    cabinet: [
      { key: "partyLoyaltyScore", label: "Party loyalty", target: 62 },
      { key: "publicApproval", label: "Public approval", target: 52 },
      { key: "pressRelationship", label: "Press relationship", target: 46 }
    ],
    pm: [
      { key: "partyLoyaltyScore", label: "Party loyalty", target: 70 },
      { key: "publicApproval", label: "Public approval", target: 58 },
      { key: "constituencyApproval", label: "Constituency approval", target: 52 }
    ]
  };

  return (gates[nextRole] ?? []).map((gate) => {
    const current = summary[gate.key];
    return {
      label: gate.label,
      current,
      target: gate.target,
      met: current >= gate.target
    };
  });
}

function getProgressionStatus(state) {
  const summary = getStateSummary(state);
  const roleIndex = ROLE_ORDER.indexOf(summary.currentRole);
  const nextRole = ROLE_ORDER[roleIndex + 1] ?? null;
  const requirements = evaluateRequirements(summary, nextRole);
  const ready = requirements.length > 0 ? requirements.every((entry) => entry.met) : false;

  const career = summary.darkIndex >= 80
    ? {
      kind: "risk",
      title: "Career risk elevated",
      detail: "Dark-index pressure is high. Stabilize fallout before pushing promotion gates."
    }
    : {
      kind: "ongoing",
      title: "Career path active",
      detail: nextRole
        ? `Maintaining current trajectory toward ${nextRole.replaceAll("_", " ")}.`
        : "Top role reached for current progression model."
    };

  return {
    promotion: {
      currentRole: summary.currentRole,
      nextRole,
      ready,
      requirements
    },
    career
  };
}

function mapCommandResult(state, result) {
  return {
    summary: getStateSummary(state),
    warnings: result.warnings,
    events: result.events
  };
}

export class PrototypeApi {
  constructor(state, bundle, rng = Math.random) {
    this.state = state;
    this.bundle = bundle;
    this.rng = rng;
  }

  static async create(options = {}) {
    if (!options.contentBundle) {
      throw new Error("PrototypeApi.create requires contentBundle in browser shell.");
    }
    const schoolYear = options.schoolYear ?? "Y10";
    return new PrototypeApi(createInitialGameState(schoolYear), options.contentBundle, options.rng);
  }

  getCurrentPacketBatch(burstCount) {
    return selectCurrentContentBatch(this.state, this.bundle, burstCount).map(mapPacket);
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
    const result = executeCommandWithResult(this.state, command, this.rng);
    this.state = result.state;
    return mapCommandResult(this.state, result);
  }

  advanceTime(hours) {
    const command = hours === undefined ? { type: "advance_time" } : { type: "advance_time", hours };
    const result = executeCommandWithResult(this.state, command, this.rng);
    this.state = result.state;
    return mapCommandResult(this.state, result);
  }

  getStateSummary() {
    return getStateSummary(this.state);
  }

  getProgressionStatus() {
    return getProgressionStatus(this.state);
  }

  getRetrospectiveReport(input = {}) {
    return buildRetrospectiveReport(this.state, input);
  }
}

import { resolve } from "node:path";
import type { CurrentSelection } from "../content/selection.js";
import { GameService } from "./game-service.js";
import { buildRetrospectiveReport } from "./retrospective.js";
import type { RetrospectiveReport } from "./retrospective.js";
import type { CommandResult, CommandWarning, GameCommand } from "../domain/commands.js";
import type { ChallengeMode, GameEvent, GameState, MathsTopic, Rng, SchoolYear } from "../domain/types.js";

export interface PrototypeEventCard {
  id: string;
  title: string;
  description: string;
}

export interface PrototypeChallenge {
  id: string;
  topic: MathsTopic;
  mode: ChallengeMode;
  prompt: string;
  unit: string;
  timed: boolean;
  timerSeconds?: number;
}

export interface PrototypeScene {
  id: string;
  npcId: string;
  text: string;
}

export interface PrototypePacket {
  band: CurrentSelection["band"];
  eventCard?: PrototypeEventCard;
  challenge?: PrototypeChallenge;
  scene?: PrototypeScene;
}

export interface PrototypeStateSummary {
  schoolYear: SchoolYear;
  currentRole: GameState["currentRole"];
  currentTempo: GameState["currentTempo"];
  timeHours: number;
  partyLoyaltyScore: number;
  publicApproval: number;
  constituencyApproval: number;
  pressRelationship: number;
  darkIndex: number;
  pendingRemediations: number;
  activeTimedChallenges: number;
  eventLogEntries: number;
}

export interface SubmitChallengeOutcomeInput {
  topic: MathsTopic;
  correct: boolean;
  mode?: ChallengeMode;
}

export interface PrototypeCommandResponse {
  summary: PrototypeStateSummary;
  warnings: CommandWarning[];
  events: GameEvent[];
}

export interface PrototypeRetrospectiveInput {
  runId?: string;
  playerAlias?: string;
}

function mapPacket(selection: CurrentSelection): PrototypePacket {
  const packet: PrototypePacket = { band: selection.band };

  if (selection.eventCard) {
    packet.eventCard = {
      id: selection.eventCard.id,
      title: selection.eventCard.title,
      description: selection.eventCard.description
    };
  }

  if (selection.challenge) {
    const challenge: PrototypeChallenge = {
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

function mapCommandResult(state: GameState, result: CommandResult): PrototypeCommandResponse {
  return {
    summary: getStateSummary(state),
    warnings: result.warnings,
    events: result.events
  };
}

export function getStateSummary(state: GameState): PrototypeStateSummary {
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
  private readonly service: GameService;

  constructor(service: GameService) {
    this.service = service;
  }

  static async create(options: {
    contentPath?: string;
    schoolYear?: SchoolYear;
    rng?: Rng;
    service?: GameService;
  } = {}): Promise<PrototypeApi> {
    let service = options.service;
    if (!service) {
      const serviceOptions: { schoolYear?: SchoolYear; rng?: Rng } = {};
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

  getCurrentPacketBatch(burstCount?: number): PrototypePacket[] {
    return this.service.getCurrentPacketBatch(burstCount).map(mapPacket);
  }

  submitChallengeOutcome(input: SubmitChallengeOutcomeInput): PrototypeCommandResponse {
    const command: GameCommand = {
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

  advanceTime(hours?: number): PrototypeCommandResponse {
    const result = hours === undefined
      ? this.service.execute({ type: "advance_time" })
      : this.service.execute({ type: "advance_time", hours });

    return mapCommandResult(this.service.getState(), result);
  }

  getStateSummary(): PrototypeStateSummary {
    return getStateSummary(this.service.getState());
  }

  getRetrospectiveReport(input: PrototypeRetrospectiveInput = {}): RetrospectiveReport {
    return buildRetrospectiveReport(this.service.getState(), input);
  }
}

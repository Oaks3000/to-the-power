export type SchoolYear = "Y9" | "Y10" | "Y11";
export type CurriculumBand = "Y9" | "Y9-10" | "Y10" | "Y10-11" | "Y11";
export type CareerLevel = "backbencher" | "pps" | "junior_minister" | "minister_of_state" | "cabinet" | "pm";
export type ChallengeMode = "decision" | "gate" | "crisis";
export type TempoState = "recess" | "parliamentary" | "crisis" | "media_storm";
export type NPCLifecycle = "active" | "dormant" | "resurgent";

export type MathsTopic =
  | "percentages" | "ratio_proportion" | "standard_form" | "powers_roots" | "rounding"
  | "linear_equations" | "linear_graphs" | "sequences_arithmetic" | "substitution"
  | "basic_probability" | "statistics_basic" | "scatter_graphs"
  | "compound_interest" | "growth_decay" | "bounds" | "indices" | "surds"
  | "quadratics_basic" | "simultaneous_equations" | "inequalities" | "geometric_sequences"
  | "direct_inverse_proportion" | "rates_of_change_linear"
  | "probability_trees" | "venn_diagrams" | "histograms" | "cumulative_frequency" | "box_plots"
  | "completing_square" | "quadratic_formula" | "functions" | "algebraic_fractions" | "iteration"
  | "exponential_functions" | "area_under_curve" | "gradient_curve" | "rates_of_change_complex"
  | "conditional_probability" | "sampling_methods" | "statistical_critique";

export interface ActiveTimedChallenge {
  challengeId: string;
  startedAtHour: number;
  deadlineAtHour: number;
}

export interface RemediationRequest {
  topic: MathsTopic;
  band: CurriculumBand;
  triggeredAtHour: number;
  thresholdUsed: number;
}

export interface TopicPerformance {
  attempts: number;
  correct: number;
  recentAttempts: boolean[];
  remediationCount: number;
}

export interface MathsPerformanceProfile {
  topicPerformance: Partial<Record<MathsTopic, TopicPerformance>>;
  bandExposure: Record<CurriculumBand, number>;
}

export interface NPCState {
  id: string;
  name: string;
  lifecycleState: NPCLifecycle;
  relationshipScore: number;
  dormantSinceHour?: number;
  dormancyCause?: string;
  resurgentMotivation?: string;
}

export type ActivationConditionKey = "dark_index_critical" | "cabinet_loyalty_whip_risk";

export interface LatentConsequence {
  id: string;
  activationCondition: ActivationConditionKey;
  probability: number;
  payload: GameEvent;
  expiresAtHour?: number;
}

export type GameEventType =
  | "SchoolYearSet"
  | "RoleChanged"
  | "TempoChanged"
  | "TimeAdvanced"
  | "ChallengeAttempted"
  | "RemediationTriggered"
  | "TimedChallengeStarted"
  | "TimedChallengeExpired"
  | "LatentConsequenceRegistered"
  | "LatentConsequenceTriggered"
  | "NPCRelationshipChanged"
  | "DarkIndexChanged";

export interface GameEvent {
  type: GameEventType;
  atHour: number;
  payload: Record<string, unknown>;
}

export interface GameState {
  eventLog: GameEvent[];

  partyLoyaltyScore: number;
  departmentalCompetence: Record<string, number>;
  publicApproval: number;
  constituencyApproval: number;
  pressRelationship: number;
  factionalAlignment: string[];
  npcRelationships: Record<string, NPCState>;
  darkIndex: number;
  mathsPerformance: MathsPerformanceProfile;

  currentRole: CareerLevel;
  currentTempo: TempoState;
  timeHours: number;
  schoolYear: SchoolYear;

  activeTimedChallenges: Record<string, ActiveTimedChallenge>;
  pendingLatentConsequences: LatentConsequence[];
  pendingRemediations: RemediationRequest[];
}

export type Rng = () => number;

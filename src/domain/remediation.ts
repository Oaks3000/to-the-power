import type { CurriculumBand, MathsPerformanceProfile, MathsTopic, TopicPerformance } from "./types.js";

const ROLLING_WINDOW_SIZE = 10;
const BASE_THRESHOLD = 3;
const TRANSITION_THRESHOLD = 2;
const TRANSITION_EXPOSURE_ATTEMPTS = 10;

const EMPTY_BAND_EXPOSURE: Record<CurriculumBand, number> = {
  Y9: 0,
  "Y9-10": 0,
  Y10: 0,
  "Y10-11": 0,
  Y11: 0
};

function createTopicPerformance(): TopicPerformance {
  return {
    attempts: 0,
    correct: 0,
    recentAttempts: [],
    remediationCount: 0
  };
}

export function createMathsPerformanceProfile(): MathsPerformanceProfile {
  return {
    topicPerformance: {},
    bandExposure: { ...EMPTY_BAND_EXPOSURE }
  };
}

function remediationThreshold(band: CurriculumBand, exposureAttempts: number): number {
  const transitionBand = band === "Y9-10" || band === "Y10-11";
  if (!transitionBand) {
    return BASE_THRESHOLD;
  }
  if (exposureAttempts < TRANSITION_EXPOSURE_ATTEMPTS) {
    return TRANSITION_THRESHOLD;
  }
  return BASE_THRESHOLD;
}

function updateTopicPerformance(current: TopicPerformance, correct: boolean): TopicPerformance {
  const nextRecentAttempts = [...current.recentAttempts, correct].slice(-ROLLING_WINDOW_SIZE);
  return {
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    recentAttempts: nextRecentAttempts,
    remediationCount: current.remediationCount
  };
}

export function registerChallengeAttempt(
  profile: MathsPerformanceProfile,
  topic: MathsTopic,
  correct: boolean,
  band: CurriculumBand
): { profile: MathsPerformanceProfile; remediationTriggered: boolean; thresholdUsed: number } {
  const exposure = profile.bandExposure[band] ?? 0;
  const nextBandExposure = {
    ...profile.bandExposure,
    [band]: exposure + 1
  };

  const currentTopic = profile.topicPerformance[topic] ?? createTopicPerformance();
  const updatedTopic = updateTopicPerformance(currentTopic, correct);
  const thresholdUsed = remediationThreshold(band, exposure);
  const wrongCount = updatedTopic.recentAttempts.filter((attempt) => !attempt).length;
  const remediationTriggered = wrongCount >= thresholdUsed;

  const withRemediationCount: TopicPerformance = remediationTriggered
    ? { ...updatedTopic, remediationCount: updatedTopic.remediationCount + 1 }
    : updatedTopic;

  return {
    profile: {
      topicPerformance: {
        ...profile.topicPerformance,
        [topic]: withRemediationCount
      },
      bandExposure: nextBandExposure
    },
    remediationTriggered,
    thresholdUsed
  };
}

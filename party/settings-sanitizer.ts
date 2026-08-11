/**
 * Sanitizes game settings by clamping values to valid ranges.
 *
 * Used by both handleStartGame and handleUpdateSettings to ensure
 * consistent validation in a single place (DRY).
 */

import type { PhaseTimeouts, VictoryCondition } from '../src/types';

// Validation limits
const SCORE_MIN = 10;
const SCORE_MAX = 100;
const NARRATOR_ROUNDS_MIN = 1;
const NARRATOR_ROUNDS_MAX = 5;
const TIMEOUT_MIN = 0;
const TIMEOUT_MAX = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface RawVictoryCondition {
  scoreEnabled: boolean;
  targetScore: number;
  narratorRoundsEnabled: boolean;
  narratorRounds: number;
}

interface RawPhaseTimeouts {
  narrator: number;
  othersChoosing: number;
  voting: number;
  results: number;
}

export function sanitizeSettings(
  victoryCondition: RawVictoryCondition,
  phaseTimeouts: RawPhaseTimeouts,
): { victoryCondition: VictoryCondition; phaseTimeouts: PhaseTimeouts } {
  return {
    victoryCondition: {
      scoreEnabled: victoryCondition.scoreEnabled,
      targetScore: clamp(victoryCondition.targetScore, SCORE_MIN, SCORE_MAX),
      narratorRoundsEnabled: victoryCondition.narratorRoundsEnabled,
      narratorRounds: clamp(
        victoryCondition.narratorRounds,
        NARRATOR_ROUNDS_MIN,
        NARRATOR_ROUNDS_MAX,
      ),
    },
    phaseTimeouts: {
      narrator: clamp(phaseTimeouts.narrator, TIMEOUT_MIN, TIMEOUT_MAX),
      othersChoosing: clamp(
        phaseTimeouts.othersChoosing,
        TIMEOUT_MIN,
        TIMEOUT_MAX,
      ),
      voting: clamp(phaseTimeouts.voting, TIMEOUT_MIN, TIMEOUT_MAX),
      results: clamp(phaseTimeouts.results, TIMEOUT_MIN, TIMEOUT_MAX),
    },
  };
}

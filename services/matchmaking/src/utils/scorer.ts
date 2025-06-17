import { MatchRequest } from "../services/QueueManager";

/**
 * Scoring weights for different match attributes.
 * Adjust these weights to tune matchmaking behavior.
 */
const WEIGHTS = {
  debateType: 1,
  mode: 1,
  language: 1,
  elo: 1,
};

/**
 * Score compatibility between two MatchRequests.
 * Returns a float between 0.000 and 1.000
 */
export function scoreMatch(a: MatchRequest, b: MatchRequest): number {
  let score = 0;
  let totalWeight = 0;

  // 1. Debate Type Match
  totalWeight += WEIGHTS.debateType;
  if (a.debateType === b.debateType) {
    score += WEIGHTS.debateType;
  }

  // 2. Mode Match
  totalWeight += WEIGHTS.mode;
  if (a.mode === b.mode) {
    score += WEIGHTS.mode;
  }

  // 3. Language Match
  if (a.language && b.language) {
    totalWeight += WEIGHTS.language;
    if (a.language === b.language) {
      score += WEIGHTS.language;
    }
  }

  // 4. ELO Score Proximity
  if (a.elo !== undefined && b.elo !== undefined) {
    totalWeight += WEIGHTS.elo;
    const diff = Math.abs(a.elo - b.elo);
    const eloScore = Math.max(0, 1 - diff / 400); // diff = 0 ⇒ 1.0, diff = 400 ⇒ 0.0
    score += eloScore * WEIGHTS.elo;
  }

  const finalScore = totalWeight > 0 ? score / totalWeight : 0;
  return parseFloat(finalScore.toFixed(3));
}

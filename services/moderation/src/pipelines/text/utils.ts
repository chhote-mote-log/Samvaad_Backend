export function isToxic(score: number, threshold = 0.8): boolean {
  return score >= threshold;
}

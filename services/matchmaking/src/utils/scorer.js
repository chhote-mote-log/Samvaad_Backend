"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreMatch = scoreMatch;
/**
 * Score compatibility between two users.
 * Returns a float between 0 and 1.
 */
function scoreMatch(a, b) {
    let score = 0;
    let totalWeight = 0;
    // 1. Match debate type
    totalWeight += 1;
    if (a.debateType === b.debateType) {
        score += 1;
    }
    // 2. Match mode (text, audio, video)
    totalWeight += 1;
    if (a.mode === b.mode) {
        score += 1;
    }
    // 3. Match language if available
    if (a.language && b.language) {
        totalWeight += 1;
        if (a.language === b.language) {
            score += 1;
        }
    }
    // 4. Match ELO score proximity (optional)
    if (a.elo && b.elo) {
        totalWeight += 1;
        const diff = Math.abs(a.elo - b.elo);
        const eloScore = Math.max(0, 1 - diff / 400); // full score if diff = 0, drops linearly
        score += eloScore;
    }
    // Normalize score to 0–1
    const finalScore = totalWeight > 0 ? score / totalWeight : 0;
    return parseFloat(finalScore.toFixed(3));
}

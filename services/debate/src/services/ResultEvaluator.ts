//resultEvaluator.ts
import { dbConnector } from './DBConnector';
import { DebateSession, DebateParticipant } from './SessionManager';

export interface EvaluationResult {
  winnerId: string | null; // null means draw
  scores: Record<string, number>; // participantId -> score
  isDraw: boolean;
  summary: string;
}

export class ResultEvaluator {
  /**
   * Evaluate the result of a debate session based on participant scores.
   * You can extend this to analyze messages, time taken, rule violations, etc.
   */
 async evaluate(session: DebateSession): Promise<EvaluationResult >{
    if (session.state !== 'ended') {
      throw new Error(`Cannot evaluate results before session ends. Current state: ${session.state}`);
    }

    // Collect scores from participants
    const scores: Record<string, number> = {};
    session.participants.forEach((p) => {
      scores[p.id] = p.score;
    });

    // Find max score
    let maxScore = -Infinity;
    let winnerId: string | null = null;
    let multipleWinners = false;

    for (const [participantId, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winnerId = participantId;
        multipleWinners = false;
      } else if (score === maxScore) {
        multipleWinners = true;
      }
    }

    const isDraw = multipleWinners;

    // Create summary text
    let summary = '';
    if (isDraw) {
      summary = `The debate ended in a draw with both participants scoring ${maxScore}.`;
    } else {
      const winner = session.participants.find(p => p.id === winnerId);
      summary = `Winner is ${winner?.name} (${winner?.role}) with score ${maxScore}.`;
    }

    return {
      winnerId: isDraw ? null : winnerId,
      scores,
      isDraw,
      summary,
    };
  }
   async evaluateAndPersist(session: DebateSession): Promise<EvaluationResult> {
    const result = await this.evaluate(session); // Evaluate winner based on score

    // 🔄 Update participant scores in the database
    for (const [participantId, score] of Object.entries(result.scores)) {
      await dbConnector.updateParticipantScore(participantId, score);
    }

    // 🏁 Mark session as ended in DB
    await dbConnector.endSession((session as any).id);

    return result;
  }
  /**
   * Optional: Update participant scores based on messages or other factors.
   * This method can be customized depending on your scoring logic.
   */
  updateScores(session: DebateSession): void {
    // Simple example: score = number of messages sent
    const counts: Record<string, number> = {};
    session.participants.forEach(p => counts[p.id] = 0);

    for (const msg of session.messages) {
      if (counts[msg.senderId] !== undefined) {
        counts[msg.senderId]++;
      }
    }

    session.participants.forEach(p => {
      p.score = counts[p.id] || 0;
    });
  }
}

export const resultEvaluator = new ResultEvaluator();

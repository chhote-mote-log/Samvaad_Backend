// controller/debateController.ts
import { Request, Response } from 'express';
import { sessionManager } from '../services/SessionManager';
import { DebateParticipant, DebateMessage } from '../utils/types';
import { participantTracker } from '../services/ParticipantTracker';

 const DebateController = {
 async createSession(req: Request, res: Response) {
  const {
    sessionId,
    participant1,
    participant2,
    topic,
    debateType,
    mode,
    visibility,
    chatEnabled,
    aiModeration,
    turnDuration,
    durationMinutes,
    language,
  } = req.body;

  try {
    const session = await sessionManager.createSession(
      sessionId,
      participant1,
      participant2,
      topic,
      debateType,
      mode,
      visibility,
      chatEnabled,
      aiModeration,
      turnDuration,
      durationMinutes,
      language
    );

    res.status(201).json({ message: 'Session created', session });
  } catch (err: any) {
    console.error('Create session failed:', err);
    res.status(400).json({ error: err.message });
  }
}
,

  async startSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      await sessionManager.startSession(sessionId);
      res.status(200).json({ message: 'Session started' });
    } catch (err: any) {
      console.error('Start session failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async pauseSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      await sessionManager.pauseSession(sessionId);
      res.status(200).json({ message: 'Session paused' });
    } catch (err: any) {
      console.error('Pause session failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async addMessage(req: Request, res: Response) {
    const { sessionId } = req.params;
    const message: DebateMessage = req.body;

    try {
      await sessionManager.addMessage(sessionId, message);
      res.status(201).json({ message: 'Message added successfully' });
    } catch (err: any) {
      console.error('Add message failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async endSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      await sessionManager.endSession(sessionId);
      res.status(200).json({ message: 'Session ended successfully' });
    } catch (err: any) {
      console.error('End session failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async removeSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      sessionManager.removeSession(sessionId);
      res.status(200).json({ message: 'Session removed from memory' });
    } catch (err: any) {
      console.error('Remove session failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async addParticipant(req: Request, res: Response) {
    const { sessionId } = req.params;
    const participant: DebateParticipant = req.body;

    try {
      const result = await sessionManager.addParticipant(sessionId, participant);
      if (result) {
        res.status(201).json({ message: 'Participant added successfully' });
      }
    } catch (err: any) {
      console.error('Add participant failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  async getSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.status(200).json({ session });
    } catch (err: any) {
      console.error('Get session failed:', err);
      res.status(500).json({ error: err.message });
    }
  },

  markParticipantConnected(req: Request, res: Response) {
    const { sessionId, participantId } = req.body;

    try {
      participantTracker.markConnected(sessionId, participantId);
      res.status(200).json({ message: 'Participant marked as connected' });
    } catch (err: any) {
      console.error('Mark participant connected failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  markParticipantDisconnected(req: Request, res: Response) {
    const { sessionId, participantId } = req.body;

    try {
      participantTracker.markDisconnected(sessionId, participantId);
      res.status(200).json({ message: 'Participant marked as disconnected' });
    } catch (err: any) {
      console.error('Mark participant disconnected failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  getSessionStatus(req: Request, res: Response) {
    const { sessionId } = req.params;

    try {
      const status = participantTracker.getSessionStatus(sessionId);
      res.status(200).json({ status });
    } catch (err: any) {
      console.error('Get session status failed:', err);
      res.status(500).json({ error: err.message });
    }
  }
};
export default DebateController;
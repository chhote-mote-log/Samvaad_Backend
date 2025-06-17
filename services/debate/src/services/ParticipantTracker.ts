//path: services/debate/src/services/ParticipantTracker.ts
import EventEmitter from 'events';
import { dbConnector } from './DBConnector';

export interface DebateParticipant {
  id: string;
  name: string;
  role: 'pro' | 'con';
  isConnected: boolean;
  score: number;
}

export interface ParticipantStatus {
  isConnected: boolean;
  lastSeen: number; // timestamp
}
type StatusMap = Map<string, ParticipantStatus>;

export class ParticipantTracker extends EventEmitter {
  private sessionParticipantsStatus: Map<string, Map<string, ParticipantStatus>>;
   private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  constructor() {
    super();
    this.sessionParticipantsStatus = new Map();
  }

  async addParticipant(sessionId: string, participant: DebateParticipant): Promise<void> {
    console.log(participant)
  if (!participant || !participant.id) {
    throw new Error(`Invalid participant provided for session ${sessionId}`);
  }
    if (!this.sessionParticipantsStatus.has(sessionId)) {
      this.sessionParticipantsStatus.set(sessionId, new Map());
    }

    const participantMap = this.sessionParticipantsStatus.get(sessionId)!;

    if (participantMap.has(participant.id)) {
      throw new Error(`Participant ${participant.id} already tracked in session ${sessionId}`);
    }

    // In-memory tracking
    participantMap.set(participant.id, {
      isConnected: true,
      lastSeen: Date.now(),
    });
    
    this.sessionParticipantsStatus.set(sessionId, participantMap);

    // DB persistence
    try {
      await dbConnector.addParticipant(sessionId, {
        id: participant.id,
        name: participant.name,
        role: participant.role,
        isConnected: true,
        score: participant.score ?? 0,
      });
    } catch (err) {
      console.error(`DB error in addParticipant:`, err);
    }

    this.emit('participant_added', sessionId, participant.id);
  }

  async markConnected(sessionId: string, participantId: string): Promise<void> {
    const participantMap = this.sessionParticipantsStatus.get(sessionId);
    if (!participantMap || !participantMap.has(participantId)) {
      throw new Error(`Participant ${participantId} not found in session ${sessionId}`);
    }

    // In-memory update
    participantMap.set(participantId, {
      isConnected: true,
      lastSeen: Date.now(),
    });

    // DB update
    // try {
    //  await dbConnector.markParticipantConnected(participantId)
    // } catch (err) {
    //   console.error(`DB error in markConnected:`, err);
    // }
    this.scheduleDebouncedDBUpdate(participantId, true);
    this.emit('participant_connected', sessionId, participantId);
  }

  async markDisconnected(sessionId: string, participantId: string): Promise<void> {
    const participantMap = this.sessionParticipantsStatus.get(sessionId);
    if (!participantMap || !participantMap.has(participantId)) {
      throw new Error(`Participant ${participantId} not found in session ${sessionId}`);
    }

    // In-memory update
    participantMap.set(participantId, {
      isConnected: false,
      lastSeen: Date.now(),
    });

    // DB update
    // try {
    //   await dbConnector.markParticipantDisconnected(participantId);
    // } catch (err) {
    //   console.error(`DB error in markDisconnected:`, err);
    // }
    this.scheduleDebouncedDBUpdate(participantId, false);

    this.emit('participant_disconnected', sessionId, participantId);
  }

  isConnected(sessionId: string, participantId: string): boolean {
    const participantMap = this.sessionParticipantsStatus.get(sessionId);
    if (!participantMap) return false;

    const status = participantMap.get(participantId);
    if (!status) return false;

    return status.isConnected;
  }
  isParticipantInSession(sessionId: string, participantId: string): boolean {
  const participantMap = this.sessionParticipantsStatus.get(sessionId);
  if (!participantMap) return false;

  return participantMap.has(participantId);
  }

  getSessionStatus(sessionId: string): Record<string, ParticipantStatus> {
    const participantMap = this.sessionParticipantsStatus.get(sessionId);
    if (!participantMap) return {};

    const result: Record<string, ParticipantStatus> = {};
    participantMap.forEach((status, participantId) => {
      result[participantId] = status;
    });
    return result;
  }

  async removeSession(sessionId: string): Promise<void> {
    this.sessionParticipantsStatus.delete(sessionId);

    // Optional: clean up DB
    // try {
    //    await dbConnector.removeParticipantsBySession(sessionId);
    // } catch (err) {
    //   console.error(`DB error in removeSession:`, err);
    // }

    this.emit('session_removed', sessionId);
  }
  
  private scheduleDebouncedDBUpdate(participantId: string, isConnected: boolean): void {
    if (this.debounceTimers.has(participantId)) {
      clearTimeout(this.debounceTimers.get(participantId)!);
    }

    const timer = setTimeout(async () => {
      // try {
      //   if (isConnected) {
      //     await dbConnector.markParticipantConnected(participantId);
      //   } else {
      //     await dbConnector.markParticipantDisconnected(participantId);
      //   }
      // } catch (err) {
      //   console.error(`DB error in debounced ${isConnected ? 'connect' : 'disconnect'}:`, err);
      // }
      this.debounceTimers.delete(participantId);
    }, 3000); // 3 seconds debounce

    this.debounceTimers.set(participantId, timer);
  }
}

export const participantTracker = new ParticipantTracker();

import EventEmitter from 'events';
import redis from '../utils/redisClient';
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

export class ParticipantTracker extends EventEmitter {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private getRedisKey(sessionId: string, participantId: string) {
    return `participant_status:${sessionId}:${participantId}`;
  }

  async addParticipant(sessionId: string, participant: DebateParticipant): Promise<void> {
    if (!participant || !participant.id) {
      throw new Error(`Invalid participant provided for session ${sessionId}`);
    }

    const status: ParticipantStatus = {
      isConnected: true,
      lastSeen: Date.now(),
    };

    await this.setStatusInRedis(sessionId, participant.id, status);

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
    const status: ParticipantStatus = {
      isConnected: true,
      lastSeen: Date.now(),
    };

    await this.setStatusInRedis(sessionId, participantId, status);
    this.scheduleDebouncedDBUpdate(participantId, true);
    this.emit('participant_connected', sessionId, participantId);
  }

  async markDisconnected(sessionId: string, participantId: string): Promise<void> {
    const status: ParticipantStatus = {
      isConnected: false,
      lastSeen: Date.now(),
    };

    await this.setStatusInRedis(sessionId, participantId, status);
    this.scheduleDebouncedDBUpdate(participantId, false);
    this.emit('participant_disconnected', sessionId, participantId);
  }

  async isConnected(sessionId: string, participantId: string): Promise<boolean> {
    const status = await this.getStatusFromRedis(sessionId, participantId);
    return status?.isConnected ?? false;
  }

  async isParticipantInSession(sessionId: string, participantId: string): Promise<boolean> {
    const status = await this.getStatusFromRedis(sessionId, participantId);
    return !!status;
  }

  async getSessionStatus(sessionId: string): Promise<Record<string, ParticipantStatus>> {
    const keys = await redis.keys(`participant_status:${sessionId}:*`);
    const result: Record<string, ParticipantStatus> = {};

    for (const key of keys) {
      const participantId = key.split(':').pop();
      const data = await redis.get(key);
      if (data && participantId) {
        result[participantId] = JSON.parse(data);
      }
    }

    return result;
  }

  async removeSession(sessionId: string): Promise<void> {
    const keys = await redis.keys(`participant_status:${sessionId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    this.emit('session_removed', sessionId);
  }

  private async setStatusInRedis(sessionId: string, participantId: string, status: ParticipantStatus): Promise<void> {
    const key = this.getRedisKey(sessionId, participantId);
    await redis.set(key, JSON.stringify(status), 'EX', 3600); // 1 hour expiry
  }

  private async getStatusFromRedis(sessionId: string, participantId: string): Promise<ParticipantStatus | null> {
    const key = this.getRedisKey(sessionId, participantId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private scheduleDebouncedDBUpdate(participantId: string, isConnected: boolean): void {
    if (this.debounceTimers.has(participantId)) {
      clearTimeout(this.debounceTimers.get(participantId)!);
    }

    const timer = setTimeout(async () => {
      try {
        if (isConnected) {
          await dbConnector.markParticipantConnected(participantId);
        } else {
          await dbConnector.markParticipantDisconnected(participantId);
        }
      } catch (err) {
        console.error(`DB error in debounced ${isConnected ? 'connect' : 'disconnect'}:`, err);
      }
      this.debounceTimers.delete(participantId);
    }, 3000); // 3 seconds debounce

    this.debounceTimers.set(participantId, timer);
  }
}

export const participantTracker = new ParticipantTracker();

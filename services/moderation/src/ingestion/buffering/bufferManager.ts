// src: services/moderation/src/ingestion/buffering/bufferManager.ts
import { DebateMessage } from '../types';

type DebateBuffer = {
  messages: DebateMessage[];
  lastTimestamp: number;
};

const buffers: Map<string, DebateBuffer> = new Map();

export function bufferMessage(msg: DebateMessage) {
  const buffer = buffers.get(msg.debateId) || { messages: [], lastTimestamp: 0 };

  if (msg.timestamp >= buffer.lastTimestamp) {
    buffer.messages.push(msg);
    buffer.lastTimestamp = msg.timestamp;
    buffers.set(msg.debateId, buffer);
  } else {
    console.warn('Out-of-order message ignored', msg);
  }
}

export function getBufferedMessages(debateId: string): DebateMessage[] | undefined {
  return buffers.get(debateId)?.messages;
}

export function clearBuffer(debateId: string) {
  buffers.delete(debateId);
}

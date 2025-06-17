// services/audio/WebRTCSignaler.ts
import { Server, Socket } from 'socket.io';

type SessionMap = Map<string, Set<Socket>>;

const sessions: SessionMap = new Map();

export const WebRTCSignaler = {
  register(io: Server, socket: Socket, sessionId: string,userId?:string) {
    if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
    sessions.get(sessionId)!.add(socket);
    socket.join(sessionId);

    socket.on('webrtc-signal', (data) => {
      socket.to(sessionId).emit('webrtc-signal', data);
    });

    socket.on('disconnect', () => {
      sessions.get(sessionId)?.delete(socket);
      socket.leave(sessionId);
    });
  }
};

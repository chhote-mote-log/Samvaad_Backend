// services/audio/WebRTCSignaler.ts
import { Server, Socket } from 'socket.io';

type SessionSockets = Map<string, Set<Socket>>;

const sessionSockets: SessionSockets = new Map();

export const WebRTCSignaler = {
  register(io: Server, socket: Socket, sessionId: string) {
    if (!sessionSockets.has(sessionId)) {
      sessionSockets.set(sessionId, new Set());
    }
    sessionSockets.get(sessionId)!.add(socket);
    socket.join(sessionId);

    socket.on('webrtc-signal', (data) => {
      socket.to(sessionId).emit('webrtc-signal', data);
    });

    socket.on('disconnect', () => {
      sessionSockets.get(sessionId)?.delete(socket);
    });
  }
};

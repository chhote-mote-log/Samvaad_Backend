import { Socket } from "socket.io";

const sockets: Map<string, Socket> = new Map();

export function registerSocket(userId: string, socket: Socket) {
  sockets.set(userId, socket);

  socket.on("disconnect", () => {
    sockets.delete(userId);
  });
}

export function sendWebSocketMessage(userId: string, data: any) {
  const socket = sockets.get(userId);
  if (socket && socket.connected) {
    socket.emit("notification", data);
  }
}

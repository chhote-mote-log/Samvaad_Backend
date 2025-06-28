// src/socketHandlers/debateSocket.ts

import { Server, Socket } from "socket.io";
import { sessionManager } from "../services/SessionManager";
import { RuleEngine } from "../services/RuleEngine";
import { WebRTCSignaler } from "../services/audio/WebRTCSignaler";
import { sendToModeration } from "../kafka/producer";
import { participantTracker } from "../services/ParticipantTracker";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_session", async ({ sessionId, userId }) => {
      try {
        if (!sessionId || !userId) {
          throw new Error("sessionId and userId are required");
        }

        socket.data.userId = userId;

        // Mark connected
        await participantTracker.markConnected(sessionId, userId);

        const session = await sessionManager.getSession(sessionId);
        socket.join(sessionId);

        if (session) {
          socket.emit("session_state", session);
        }
        console.log(`✅ ${userId} joined session ${sessionId}`);
      } catch (err) {
        console.error("Error in join_session:", err);
        socket.emit("error", "Failed to join session");
      }
    });

    socket.on("join-audio-session", async ({ sessionId, userId }) => {
      try {
        WebRTCSignaler.register(io, socket, sessionId, userId);

        const canSpeak = await RuleEngine.canUserSpeak(sessionId, userId);
        socket.emit(canSpeak ? "unmute" : "mute");
      } catch (err) {
        console.error("Error in join-audio-session:", err);
        socket.emit("error", "Failed to join audio session");
      }
    });

    socket.on("turn-change", async ({ sessionId, newUserId }) => {
      try {
        await sessionManager.changeTurn(sessionId, newUserId);
        io.to(sessionId).emit("mute");
        io.to(sessionId).emit("unmute-user", { userId: newUserId });
      } catch (err) {
        console.error("Error in turn-change:", err);
        socket.emit("error", "Failed to change turn");
      }
    });

    socket.on("send_message", async ({ sessionId, message }) => {
      try {
        message.timestamp = Date.now();
        const messageId = await sessionManager.addMessage(sessionId, message);
        if (!messageId) {
          throw new Error("Failed to persist message");
        }
        io.to(sessionId).emit("new_message", message);

        const session = await sessionManager.getSession(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }
        const senderId =
          message.senderId || message.userId || socket.data.userId;
        const receiver = session?.participants.find((p) => p.id !== senderId);
        const receiverId = receiver?.id ?? "unknown";

        await sendToModeration({
          sessionId, // or debateId
          messageId,
          senderId,
          receiverId,
          content: message.content,
          timestamp: message.timestamp,
          language: session.language,
          turn_number: session.messages.length,
          mode: session.mode,
          type: session.type,
          topic: session.topic,
          rules: session.rules,
          context: {
            previousMessages: session.messages.slice(-5), // Optional context for AI
          },
          contentType: "text",
        });

        console.log(`📩 Message sent in session ${sessionId}:`, message);
      } catch (err: any) {
        console.error("Error in send_message:", err);
        socket.emit("error", err.message || "Failed to send message");
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // ParticipantTracker handles this internally via ping timeouts or manual disconnect.
    });
  });

  sessionManager.on("session_created", (session) => {
    console.log(`[Socket] Session created: ${session.sessionId}`);
  });

  // Auto-start logic
  participantTracker.on(
    "participant_connected",
    async (sessionId, participantId) => {
      try {
        const statusMap = participantTracker.getSessionStatus(sessionId);
        const allConnected = Object.values(statusMap).every(
          (s) => s.isConnected
        );

        const session = await sessionManager.getSession(sessionId);

        // Resume logic if previously paused
        if (session && session.state === "paused" && allConnected) {
          console.log(
            `🔄 All participants reconnected. Resuming session ${sessionId}`
          );
          await sessionManager.resumeSession(sessionId);

          io.to(sessionId).emit("session_resumed", {
            sessionId,
            timestamp: Date.now(),
          });
        }

        // Start logic
        if (session && session.state === "waiting" && allConnected) {
          console.log(
            `✅ All participants connected. Starting session ${sessionId}`
          );
          await sessionManager.startSession(sessionId);

          io.to(sessionId).emit("session_started", {
            sessionId,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error(
          `❌ Error in participant_connected for ${sessionId}:`,
          err
        );
      }
    }
  );

  // Pause session if someone disconnects
  participantTracker.on(
    "participant_disconnected",
    async (sessionId, participantId) => {
      try {
        const session = await sessionManager.getSession(sessionId);
        if (!session || session.state !== "ongoing") return;

        console.log(
          `⛔ Participant ${participantId} disconnected. Pausing session ${sessionId}`
        );
        await sessionManager.pauseSession(sessionId);

        io.to(sessionId).emit("session_paused", {
          sessionId,
          disconnectedUser: participantId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error(
          `❌ Error in participant_disconnected for ${sessionId}:`,
          err
        );
      }
    }
  );
};

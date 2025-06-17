// dbConnector.ts
import { PrismaClient, Prisma} from "@prisma/client";
const prisma = new PrismaClient();
type DebateSession = Awaited<
  ReturnType<typeof prisma.debateSession.findUnique>
>;

// Similarly for participants:
type DebateParticipant = Awaited<
  ReturnType<typeof prisma.debateParticipant.findUnique>
>;

// And for messages:
type DebateMessage = Awaited<
  ReturnType<typeof prisma.debateMessage.findUnique>
>;
class DBConnector {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createSession(
    sessionId: string,
    state: string = "waiting"
  ): Promise<DebateSession> {
    try {
      return await this.prisma.debateSession.create({
        data: {
          id: sessionId, 
          currentTurn: "pro", // Default to PRO for the first turn
          state,
        },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<DebateSession | null> {
    try {
      return await this.prisma.debateSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
          messages: true,
        },
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
  }

  async updateSessionState(
    sessionId: string,
    newState: string
  ): Promise<DebateSession> {
    try {
      return await this.prisma.debateSession.update({
        where: { id: sessionId },
        data: { state: newState },
      });
    } catch (error) {
      console.error("Error updating session state:", error);
      throw error;
    }
  }

  async addParticipant(
    sessionId: string,
    participant: {
      id: string;
      name: string;
      role: string;
      isConnected?: boolean;
      score?: number;
    }
  ): Promise<DebateParticipant> {
    try {
      return await this.prisma.debateParticipant.create({
        data: {
          name: participant.name,
          role: participant.role,
          isConnected: participant.isConnected ?? true,
          score: participant.score ?? 0,
          sessionId,
        },
      });
    } catch (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
  }

  async updateParticipantScore(
    participantId: string,
    newScore: number
  ): Promise<DebateParticipant> {
    try {
      return await this.prisma.debateParticipant.update({
        where: { id: participantId },
        data: { score: newScore },
      });
    } catch (error) {
      console.error("Error updating participant score:", error);
      throw error;
    }
  }

  async addMessage(
    sessionId: string,
    message: {
      senderId: string;
      content: string;
      timestamp?: number;
      type: "chat" | "voice" | "video";
    }
  ): Promise<DebateMessage> {
    try {
      return await this.prisma.debateMessage.create({
        data: {
          senderId: message.senderId,
          content: message.content,
          timestamp: message.timestamp ?? Date.now(),
          type: message.type,
          sessionId,
        },
      });
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }
  async markParticipantConnected(participantId: string): Promise<void> {
    await this.prisma.debateParticipant.update({
      where: { id: participantId },
      data: { isConnected: true },
    });
  }

  async markParticipantDisconnected(participantId: string): Promise<void> {
    await this.prisma.debateParticipant.update({
      where: { id: participantId },
      data: { isConnected: false },
    });
  }

  async removeParticipantsBySession(sessionId: string): Promise<void> {
    await this.prisma.debateParticipant.deleteMany({
      where: { sessionId },
    });
  }
  async updateSessionTurn(sessionId: string, newTurn: string): Promise<DebateSession> {
    try {
      return await this.prisma.debateSession.update({
        where: { id: sessionId },
        data: { currentTurn: newTurn },
      });
    } catch (error) {
      console.error('Error updating session turn:', error);
      throw error;
    }
  }

  async endSession(
    sessionId: string,
    endTime: number = Date.now()
  ): Promise<DebateSession> {
    try {
      return await this.prisma.debateSession.update({
        where: { id: sessionId },
        data: {
          state: "ended",
          endTime,
        },
      });
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

export const dbConnector = new DBConnector();

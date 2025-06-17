// src/services/MatchService.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export class MatchService {
  static async createMatch(data: {
    userAId: string;
    userBId: string;
    debateType: string;
    mode: string;
    score: number;
  }) {
    return prisma.match.create({
      data: {
        userAId: data.userAId,
        userBId: data.userBId,
        debateType: data.debateType as any,
        mode: data.mode as any,
        matchScore: data.score,
        status: "PENDING",
      },
    });
  }

  static async getAllMatches() {
    return prisma.match.findMany();
  }
}

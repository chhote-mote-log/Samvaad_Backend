import { prisma } from "../prisma/client";

function getTitleFromElo(elo: number, type: "professional" | "fun"): string {
  const levels = [
    { min: 0, max: 999, pro: "Newbie", fun: "Beginner" },
    { min: 1000, max: 1199, pro: "Speaker", fun: "Rationalist" },
    { min: 1200, max: 1399, pro: "Debater", fun: "Analyst" },
    { min: 1400, max: 1599, pro: "Contender", fun: "Orator" },
    { min: 1600, max: 1799, pro: "Challenger", fun: "Philosopher" },
    { min: 1800, max: 1999, pro: "Grand Debater", fun: "Diplomat" },
    { min: 2000, max: Infinity, pro: "Legend", fun: "Mastermind" },
  ];

  const match = levels.find(lvl => elo >= lvl.min && elo <= lvl.max);
  if (!match) return "Unknown";

  return type === "professional" ? match.pro : match.fun;
}



function getRankFromElo(elo: number) {
  if (elo <= 999) return { rank: "Bronze", color: "Brown" };
  if (elo <= 1399) return { rank: "Silver", color: "Gray" };
  if (elo <= 1599) return { rank: "Gold", color: "Yellow" };
  if (elo <= 1799) return { rank: "Emerald", color: "Green" };
  if (elo <= 1999) return { rank: "Diamond", color: "Purple" };
  return { rank: "Legend"}
}

export const updateMultipleUsersStats = async (
  results: {
    userId: string;
    xpEarned: number;
    eloDelta: number;
    title:string,
    level:number
    newEloRating: number;
    outcome: "win" | "loss" | "draw";
    totalScore: number;
    debateType: "professional" | "fun"
  }[]
) => {
  for (const result of results) {
    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (!user) continue;

    let updatedWins = user.wins;
    let updatedLosses = user.losses;

    if (result.outcome === "win") updatedWins += 1;
    else if (result.outcome === "loss") updatedLosses += 1;

    const { rank } = getRankFromElo(result.newEloRating);
    

    await prisma.user.update({
      where: { id: result.userId },
      data: {
        elo_rating: result.newEloRating,
        xp: user.xp + result.xpEarned,
        level: result.level,
        // title: getTitleFromElo(result.newEloRating, result.debateType),
        rank: rank,
        wins: updatedWins,
        losses: updatedLosses,
        total_debates: user.total_debates + 1,
        updated_at: new Date(),
      },
    });
  }
};

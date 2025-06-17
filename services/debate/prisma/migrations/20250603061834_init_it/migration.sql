-- AlterTable
ALTER TABLE "DebateParticipant" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DebateSession" ALTER COLUMN "updatedAt" DROP NOT NULL;

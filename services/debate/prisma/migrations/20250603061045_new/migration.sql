/*
  Warnings:

  - Changed the type of `type` on the `DebateMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `DebateParticipant` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `DebateParticipant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `DebateSession` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `currentTurn` on the `DebateSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DebateMessage" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL;

-- AlterTable
ALTER TABLE "DebateParticipant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "DebateRole" NOT NULL;

-- AlterTable
ALTER TABLE "DebateSession" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "currentTurn",
ADD COLUMN     "currentTurn" "DebateRole" NOT NULL;

-- CreateIndex
CREATE INDEX "DebateMessage_sessionId_idx" ON "DebateMessage"("sessionId");

-- CreateIndex
CREATE INDEX "DebateParticipant_sessionId_idx" ON "DebateParticipant"("sessionId");

/*
  Warnings:

  - The `startTime` column on the `DebateSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `endTime` column on the `DebateSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `type` to the `DebateMessage` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `timestamp` on the `DebateMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `currentTurn` to the `DebateSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DebateRole" AS ENUM ('pro', 'con');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('chat', 'voice', 'video');

-- AlterTable
ALTER TABLE "DebateMessage" ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "DebateSession" ADD COLUMN     "currentTurn" TEXT NOT NULL,
ADD COLUMN     "pausedAt" BIGINT,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" BIGINT,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" BIGINT,
ALTER COLUMN "totalPausedDuration" SET DATA TYPE BIGINT;

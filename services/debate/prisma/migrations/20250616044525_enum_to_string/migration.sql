/*
  Warnings:

  - Changed the type of `role` on the `DebateParticipant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currentTurn` on the `DebateSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
-- First, convert enum columns to TEXT

ALTER TABLE "DebateParticipant"
  ALTER COLUMN "role" TYPE TEXT;

ALTER TABLE "DebateSession"
  ALTER COLUMN "currentTurn" TYPE TEXT;

-- Then drop the unused enum type (optional but clean)
DROP TYPE IF EXISTS "DebateRole";

-- CreateEnum
CREATE TYPE "DebateType" AS ENUM ('PROFESSIONAL', 'UNPROFESSIONAL');

-- CreateEnum
CREATE TYPE "DebateMode" AS ENUM ('TEXT', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "debates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "chat_enabled" BOOLEAN NOT NULL,
    "visibility" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "ai_moderation" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "ai_summary" TEXT,
    "winner_id" TEXT,
    "xp_reward" INTEGER NOT NULL,
    "tags" TEXT[],
    "language" TEXT NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_for" TIMESTAMP(3),
    "ai_winner_id" TEXT,
    "toxicity_score" DECIMAL(65,30),
    "recording_url" TEXT,

    CONSTRAINT "debates_pkey" PRIMARY KEY ("id")
);

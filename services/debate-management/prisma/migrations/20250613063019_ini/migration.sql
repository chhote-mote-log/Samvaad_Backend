-- CreateTable
CREATE TABLE "debate_participants" (
    "id" SERIAL NOT NULL,
    "debate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_winner" BOOLEAN NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "position" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "left_at" TIMESTAMP(3),
    "feedback" TEXT,
    "is_host" BOOLEAN NOT NULL,
    "xp_earned" INTEGER NOT NULL,

    CONSTRAINT "debate_participants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "debate_participants" ADD CONSTRAINT "debate_participants_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "debates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

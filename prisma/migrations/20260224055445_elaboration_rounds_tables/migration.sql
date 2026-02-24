/*
  Warnings:

  - You are about to drop the column `elaborationRounds` on the `Idea` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Idea" DROP COLUMN "elaborationRounds";

-- CreateTable
CREATE TABLE "ElaborationRound" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "companyUuid" TEXT NOT NULL,
    "ideaUuid" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_answers',
    "createdByType" TEXT NOT NULL,
    "createdByUuid" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElaborationRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElaborationQuestion" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "roundUuid" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "selectedOptionId" TEXT,
    "customText" TEXT,
    "answeredAt" TIMESTAMP(3),
    "answeredByType" TEXT,
    "answeredByUuid" TEXT,
    "issueType" TEXT,
    "issueDescription" TEXT,

    CONSTRAINT "ElaborationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ElaborationRound_uuid_key" ON "ElaborationRound"("uuid");

-- CreateIndex
CREATE INDEX "ElaborationRound_ideaUuid_idx" ON "ElaborationRound"("ideaUuid");

-- CreateIndex
CREATE INDEX "ElaborationRound_companyUuid_idx" ON "ElaborationRound"("companyUuid");

-- CreateIndex
CREATE UNIQUE INDEX "ElaborationQuestion_uuid_key" ON "ElaborationQuestion"("uuid");

-- CreateIndex
CREATE INDEX "ElaborationQuestion_roundUuid_idx" ON "ElaborationQuestion"("roundUuid");

-- CreateIndex
CREATE UNIQUE INDEX "ElaborationQuestion_roundUuid_questionId_key" ON "ElaborationQuestion"("roundUuid", "questionId");

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "elaborationDepth" TEXT,
ADD COLUMN     "elaborationRounds" JSONB,
ADD COLUMN     "elaborationStatus" TEXT;

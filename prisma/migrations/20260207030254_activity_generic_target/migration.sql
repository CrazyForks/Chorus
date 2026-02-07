/*
  Warnings:

  - You are about to drop the column `documentUuid` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `ideaUuid` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `proposalUuid` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `taskUuid` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `outputData` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `outputType` on the `Proposal` table. All the data in the column will be lost.
  - Added the required column `targetType` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetUuid` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Activity_taskUuid_idx";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "documentUuid",
DROP COLUMN "ideaUuid",
DROP COLUMN "payload",
DROP COLUMN "proposalUuid",
DROP COLUMN "taskUuid",
ADD COLUMN     "targetType" TEXT NOT NULL,
ADD COLUMN     "targetUuid" TEXT NOT NULL,
ADD COLUMN     "value" JSONB;

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "outputData",
DROP COLUMN "outputType",
ADD COLUMN     "createdByType" TEXT NOT NULL DEFAULT 'agent',
ADD COLUMN     "documentDrafts" JSONB,
ADD COLUMN     "taskDrafts" JSONB,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "acceptanceCriteria" TEXT;

-- CreateIndex
CREATE INDEX "Activity_targetType_targetUuid_idx" ON "Activity"("targetType", "targetUuid");

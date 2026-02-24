-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "elaborationAnswered" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "elaborationRequested" BOOLEAN NOT NULL DEFAULT true;

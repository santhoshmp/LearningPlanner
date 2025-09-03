-- AlterTable - Add new columns
ALTER TABLE "help_requests" ADD COLUMN "activityId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "tokensUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable - Rename column
ALTER TABLE "help_requests" RENAME COLUMN "claudeResponse" TO "response";

-- After migration, remove the default value for activityId
ALTER TABLE "help_requests" ALTER COLUMN "activityId" DROP DEFAULT;
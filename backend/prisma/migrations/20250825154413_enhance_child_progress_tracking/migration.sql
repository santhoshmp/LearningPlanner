-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('DAILY', 'WEEKLY', 'ACTIVITY_COMPLETION', 'PERFECT_SCORE', 'HELP_FREE');

-- AlterTable
ALTER TABLE "achievements" ADD COLUMN     "celebrationShown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "earnedInSession" TEXT,
ADD COLUMN     "parentNotified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "progress_records" ADD COLUMN     "helpRequestsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pauseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resumeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionData" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "child_login_sessions" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutTime" TIMESTAMP(3),
    "deviceInfo" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "sessionDuration" INTEGER,
    "activitiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_streaks" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "streakType" "StreakType" NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "longestCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "streakStartDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "child_login_sessions_childId_idx" ON "child_login_sessions"("childId");

-- CreateIndex
CREATE INDEX "child_login_sessions_loginTime_idx" ON "child_login_sessions"("loginTime");

-- CreateIndex
CREATE INDEX "child_login_sessions_isActive_idx" ON "child_login_sessions"("isActive");

-- CreateIndex
CREATE INDEX "learning_streaks_childId_idx" ON "learning_streaks"("childId");

-- CreateIndex
CREATE INDEX "learning_streaks_streakType_idx" ON "learning_streaks"("streakType");

-- CreateIndex
CREATE INDEX "learning_streaks_isActive_idx" ON "learning_streaks"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "learning_streaks_childId_streakType_key" ON "learning_streaks"("childId", "streakType");

-- AddForeignKey
ALTER TABLE "child_login_sessions" ADD CONSTRAINT "child_login_sessions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_streaks" ADD CONSTRAINT "learning_streaks_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

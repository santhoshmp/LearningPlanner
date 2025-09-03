-- CreateTable
CREATE TABLE "conversation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "concerns" JSONB DEFAULT '[]',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversation_logs_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "conversation_logs_childId_idx" ON "conversation_logs"("childId");

-- CreateIndex
CREATE INDEX "conversation_logs_activityId_idx" ON "conversation_logs"("activityId");

-- CreateIndex
CREATE INDEX "conversation_logs_flagged_idx" ON "conversation_logs"("flagged");

-- CreateIndex
CREATE INDEX "conversation_logs_timestamp_idx" ON "conversation_logs"("timestamp");
-- CreateTable
CREATE TABLE "StudyPlanAccessLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "planId" TEXT,
    "activityId" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "responseTime" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlanAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressUpdateLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "planId" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "scoreChange" DOUBLE PRECISION,
    "timeSpent" INTEGER,
    "validationErrors" TEXT,
    "consistencyIssues" TEXT,
    "responseTime" INTEGER,
    "sessionData" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardAccessLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "studyPlansCount" INTEGER,
    "progressRecordsCount" INTEGER,
    "streaksCount" INTEGER,
    "badgesCount" INTEGER,
    "responseTime" INTEGER,
    "cacheHit" BOOLEAN,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabasePerformanceLog" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "recordsAffected" INTEGER,
    "indexesUsed" TEXT,
    "queryComplexity" TEXT,
    "childId" TEXT,
    "planId" TEXT,
    "activityId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabasePerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlanAccessLog_childId_timestamp_idx" ON "StudyPlanAccessLog"("childId", "timestamp");
CREATE INDEX "StudyPlanAccessLog_action_success_idx" ON "StudyPlanAccessLog"("action", "success");
CREATE INDEX "StudyPlanAccessLog_timestamp_idx" ON "StudyPlanAccessLog"("timestamp");

-- CreateIndex
CREATE INDEX "ProgressUpdateLog_childId_timestamp_idx" ON "ProgressUpdateLog"("childId", "timestamp");
CREATE INDEX "ProgressUpdateLog_activityId_timestamp_idx" ON "ProgressUpdateLog"("activityId", "timestamp");
CREATE INDEX "ProgressUpdateLog_action_success_idx" ON "ProgressUpdateLog"("action", "success");
CREATE INDEX "ProgressUpdateLog_timestamp_idx" ON "ProgressUpdateLog"("timestamp");

-- CreateIndex
CREATE INDEX "DashboardAccessLog_childId_timestamp_idx" ON "DashboardAccessLog"("childId", "timestamp");
CREATE INDEX "DashboardAccessLog_action_success_idx" ON "DashboardAccessLog"("action", "success");
CREATE INDEX "DashboardAccessLog_timestamp_idx" ON "DashboardAccessLog"("timestamp");

-- CreateIndex
CREATE INDEX "DatabasePerformanceLog_operation_timestamp_idx" ON "DatabasePerformanceLog"("operation", "timestamp");
CREATE INDEX "DatabasePerformanceLog_tableName_timestamp_idx" ON "DatabasePerformanceLog"("tableName", "timestamp");
CREATE INDEX "DatabasePerformanceLog_executionTime_idx" ON "DatabasePerformanceLog"("executionTime");
CREATE INDEX "DatabasePerformanceLog_timestamp_idx" ON "DatabasePerformanceLog"("timestamp");
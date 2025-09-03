-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM (
  'AUTHENTICATION',
  'AUTHORIZATION',
  'ACCESS_CONTROL',
  'DATA_ACCESS',
  'ACCOUNT_CHANGE',
  'SUSPICIOUS_ACTIVITY',
  'SYSTEM'
);

-- CreateTable
CREATE TABLE "security_logs" (
  "id" TEXT NOT NULL,
  "eventType" "SecurityEventType" NOT NULL,
  "userId" TEXT,
  "childId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "details" JSONB NOT NULL DEFAULT '{}',
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_logs_eventType_idx" ON "security_logs"("eventType");

-- CreateIndex
CREATE INDEX "security_logs_userId_idx" ON "security_logs"("userId");

-- CreateIndex
CREATE INDEX "security_logs_childId_idx" ON "security_logs"("childId");

-- CreateIndex
CREATE INDEX "security_logs_timestamp_idx" ON "security_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
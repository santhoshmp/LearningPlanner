-- CreateTable
CREATE TABLE "resource_usage" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_usage_childId_timestamp_idx" ON "resource_usage"("childId", "timestamp");

-- CreateIndex
CREATE INDEX "resource_usage_resourceId_timestamp_idx" ON "resource_usage"("resourceId", "timestamp");

-- AddForeignKey
ALTER TABLE "resource_usage" ADD CONSTRAINT "resource_usage_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_usage" ADD CONSTRAINT "resource_usage_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "topic_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

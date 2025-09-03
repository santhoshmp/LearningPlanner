-- CreateTable
CREATE TABLE "parent_notifications" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "helpRequestCount" INTEGER NOT NULL DEFAULT 0,
    "timeframe" TEXT NOT NULL DEFAULT 'week',
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

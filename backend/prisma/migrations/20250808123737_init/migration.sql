-- CreateTable
CREATE TABLE "rate_limit_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_entries_key_idx" ON "rate_limit_entries"("key");

-- CreateIndex
CREATE INDEX "rate_limit_entries_createdAt_idx" ON "rate_limit_entries"("createdAt");

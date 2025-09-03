-- CreateEnum
CREATE TYPE "ParentalApprovalContentType" AS ENUM ('STUDY_PLAN', 'CONTENT_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "ParentalApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "parental_approval_requests" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "contentType" "ParentalApprovalContentType" NOT NULL,
    "contentData" TEXT NOT NULL,
    "safetyResults" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "ParentalApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "parentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parental_approval_requests_childId_idx" ON "parental_approval_requests"("childId");

-- CreateIndex
CREATE INDEX "parental_approval_requests_status_idx" ON "parental_approval_requests"("status");

-- CreateIndex
CREATE INDEX "parental_approval_requests_requestedAt_idx" ON "parental_approval_requests"("requestedAt");

-- AddForeignKey
ALTER TABLE "parental_approval_requests" ADD CONSTRAINT "parental_approval_requests_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

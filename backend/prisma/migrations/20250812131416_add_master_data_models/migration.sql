-- CreateEnum
CREATE TYPE "EducationalLevel" AS ENUM ('ELEMENTARY', 'MIDDLE', 'HIGH');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('CORE_ACADEMIC', 'STEM', 'LANGUAGE_ARTS', 'SOCIAL_STUDIES', 'ARTS', 'PHYSICAL_EDUCATION', 'LIFE_SKILLS', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('VIDEO', 'ARTICLE', 'INTERACTIVE', 'WORKSHEET', 'GAME', 'BOOK', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "SafetyRating" AS ENUM ('SAFE', 'REVIEW_NEEDED', 'RESTRICTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'NEEDS_UPDATE', 'BROKEN', 'REMOVED');

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "ageTypical" INTEGER NOT NULL,
    "educationalLevel" "EducationalLevel" NOT NULL,
    "prerequisites" JSONB NOT NULL DEFAULT '[]',
    "nextGrade" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_subjects" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL DEFAULT 0,
    "prerequisites" JSONB NOT NULL DEFAULT '[]',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "estimatedHours" INTEGER NOT NULL DEFAULT 1,
    "prerequisites" JSONB NOT NULL DEFAULT '[]',
    "learningObjectives" JSONB NOT NULL DEFAULT '[]',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "assessmentCriteria" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_resources" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "ageAppropriate" BOOLEAN NOT NULL DEFAULT true,
    "safetyRating" "SafetyRating" NOT NULL DEFAULT 'SAFE',
    "source" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "lastValidated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_levels_grade_key" ON "grade_levels"("grade");

-- CreateIndex
CREATE INDEX "grade_levels_grade_idx" ON "grade_levels"("grade");

-- CreateIndex
CREATE INDEX "grade_levels_educationalLevel_idx" ON "grade_levels"("educationalLevel");

-- CreateIndex
CREATE INDEX "grade_levels_sortOrder_idx" ON "grade_levels"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE INDEX "subjects_category_idx" ON "subjects"("category");

-- CreateIndex
CREATE INDEX "subjects_isCore_idx" ON "subjects"("isCore");

-- CreateIndex
CREATE INDEX "subjects_sortOrder_idx" ON "subjects"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "grade_subjects_gradeId_subjectId_key" ON "grade_subjects"("gradeId", "subjectId");

-- CreateIndex
CREATE INDEX "topics_gradeId_subjectId_idx" ON "topics"("gradeId", "subjectId");

-- CreateIndex
CREATE INDEX "topics_difficulty_idx" ON "topics"("difficulty");

-- CreateIndex
CREATE INDEX "topics_sortOrder_idx" ON "topics"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "topics_gradeId_subjectId_name_key" ON "topics"("gradeId", "subjectId", "name");

-- CreateIndex
CREATE INDEX "topic_resources_topicId_idx" ON "topic_resources"("topicId");

-- CreateIndex
CREATE INDEX "topic_resources_type_idx" ON "topic_resources"("type");

-- CreateIndex
CREATE INDEX "topic_resources_safetyRating_idx" ON "topic_resources"("safetyRating");

-- CreateIndex
CREATE INDEX "topic_resources_validationStatus_idx" ON "topic_resources"("validationStatus");

-- AddForeignKey
ALTER TABLE "grade_subjects" ADD CONSTRAINT "grade_subjects_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_subjects" ADD CONSTRAINT "grade_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_resources" ADD CONSTRAINT "topic_resources_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

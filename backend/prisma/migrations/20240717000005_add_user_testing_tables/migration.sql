-- CreateTable
CREATE TABLE "user_testing_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "child_age" INTEGER,
    "testing_session" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "specific_feature" TEXT,
    "device_info" JSONB NOT NULL,
    "session_duration" INTEGER NOT NULL,
    "completed_tasks" JSONB NOT NULL,
    "struggled_tasks" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_testing_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_results" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "device_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usability_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "child_age" INTEGER,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "total_scenarios" INTEGER NOT NULL DEFAULT 0,
    "completed_scenarios" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "device_info" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usability_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "metric_type" TEXT NOT NULL,
    "metric_value" DECIMAL(10,4) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_info" JSONB,
    "user_context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_testing_feedback_user_id_idx" ON "user_testing_feedback"("user_id");
CREATE INDEX "user_testing_feedback_testing_session_idx" ON "user_testing_feedback"("testing_session");
CREATE INDEX "user_testing_feedback_category_idx" ON "user_testing_feedback"("category");
CREATE INDEX "user_testing_feedback_timestamp_idx" ON "user_testing_feedback"("timestamp");

-- CreateIndex
CREATE INDEX "ab_test_results_test_id_idx" ON "ab_test_results"("test_id");
CREATE INDEX "ab_test_results_variant_idx" ON "ab_test_results"("variant");
CREATE INDEX "ab_test_results_timestamp_idx" ON "ab_test_results"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "usability_sessions_session_id_key" ON "usability_sessions"("session_id");
CREATE INDEX "usability_sessions_user_type_idx" ON "usability_sessions"("user_type");
CREATE INDEX "usability_sessions_start_time_idx" ON "usability_sessions"("start_time");

-- CreateIndex
CREATE INDEX "performance_metrics_session_id_idx" ON "performance_metrics"("session_id");
CREATE INDEX "performance_metrics_metric_type_idx" ON "performance_metrics"("metric_type");
CREATE INDEX "performance_metrics_timestamp_idx" ON "performance_metrics"("timestamp");
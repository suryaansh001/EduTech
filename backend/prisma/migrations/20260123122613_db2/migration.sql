-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'DROPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "profileImage" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualification" TEXT,
    "experience" TEXT,
    "specialization" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grade" TEXT,
    "interests" TEXT[],
    "learningGoals" TEXT,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "completedCourses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "grade" TEXT,
    "maxStudents" INTEGER,
    "status" "ClassStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "meetingLink" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentGrade" DOUBLE PRECISION,
    "attendanceRate" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT NOT NULL,
    "timeLimit" INTEGER,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageScore" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "averageTimeMinutes" SMALLINT,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuizType" NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentMinutes" SMALLINT,
    "percentageScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "classId" TEXT,
    "event" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "classId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "classId" TEXT,
    "authorId" TEXT NOT NULL,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallGPA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuizzesTaken" INTEGER NOT NULL DEFAULT 0,
    "averageQuizScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAssignments" INTEGER NOT NULL DEFAULT 0,
    "completedAssignments" INTEGER NOT NULL DEFAULT 0,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLoginDays" INTEGER NOT NULL DEFAULT 0,
    "avgDailyMinutes" INTEGER NOT NULL DEFAULT 0,
    "consecutiveActiveDays" SMALLINT NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "conceptsMastered" INTEGER NOT NULL DEFAULT 0,
    "skillsImproved" SMALLINT NOT NULL DEFAULT 0,
    "weeklyGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(10) NOT NULL DEFAULT 'LOW',
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskFactors" VARCHAR(50)[],
    "subjectScores" JSONB,
    "strengths" VARCHAR(50)[],
    "weaknesses" VARCHAR(50)[],
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" SMALLINT NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_analytics" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "averageGrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "medianGrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gradeStdDev" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEngagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeStudentCount" SMALLINT NOT NULL DEFAULT 0,
    "totalEnrolled" SMALLINT NOT NULL DEFAULT 0,
    "avgAttendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAssignments" SMALLINT NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgQuizScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atRiskCount" SMALLINT NOT NULL DEFAULT 0,
    "criticalRiskCount" SMALLINT NOT NULL DEFAULT 0,
    "improvingCount" SMALLINT NOT NULL DEFAULT 0,
    "decliningCount" SMALLINT NOT NULL DEFAULT 0,
    "predictedPassRate" DOUBLE PRECISION,
    "predictedAvgGrade" DOUBLE PRECISION,
    "weeklyTrends" JSONB,
    "topPerformers" TEXT[],
    "needsAttention" TEXT[],
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "date" DATE NOT NULL,
    "minutesActive" SMALLINT NOT NULL,
    "quizzesAttempted" SMALLINT NOT NULL,
    "assignmentsSubmitted" SMALLINT NOT NULL,
    "notesViewed" SMALLINT NOT NULL,
    "messagesPosted" SMALLINT NOT NULL,
    "filesDownloaded" SMALLINT NOT NULL,
    "activityScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "subject" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(100) NOT NULL,
    "attemptCount" SMALLINT NOT NULL DEFAULT 0,
    "correctCount" SMALLINT NOT NULL DEFAULT 0,
    "accuracyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryLevel" VARCHAR(20) NOT NULL DEFAULT 'NOVICE',
    "lastAttemptScore" DOUBLE PRECISION,
    "trend" VARCHAR(15) NOT NULL DEFAULT 'STABLE',
    "firstAttemptAt" TIMESTAMP(3) NOT NULL,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "classId" TEXT,
    "scope" VARCHAR(20) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(15) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "recommendations" JSONB,
    "relatedMetrics" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_query_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "serverName" VARCHAR(50) NOT NULL,
    "query" TEXT NOT NULL,
    "queryType" VARCHAR(30) NOT NULL,
    "toolCalled" VARCHAR(50),
    "responseTime" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "tokensUsed" INTEGER,
    "contextSize" INTEGER,
    "resultCount" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_jobs" (
    "id" TEXT NOT NULL,
    "jobType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "targetId" TEXT,
    "targetType" VARCHAR(20),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "executionTime" INTEGER,
    "recordsProcessed" INTEGER,
    "error" TEXT,
    "result" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "classes_teacherId_status_idx" ON "classes"("teacherId", "status");

-- CreateIndex
CREATE INDEX "classes_status_startDate_idx" ON "classes"("status", "startDate");

-- CreateIndex
CREATE INDEX "classes_subject_grade_idx" ON "classes"("subject", "grade");

-- CreateIndex
CREATE INDEX "enrollments_userId_status_idx" ON "enrollments"("userId", "status");

-- CreateIndex
CREATE INDEX "enrollments_classId_status_idx" ON "enrollments"("classId", "status");

-- CreateIndex
CREATE INDEX "enrollments_status_lastActivityAt_idx" ON "enrollments"("status", "lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_classId_key" ON "enrollments"("userId", "classId");

-- CreateIndex
CREATE INDEX "quizzes_classId_isActive_idx" ON "quizzes"("classId", "isActive");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_completedAt_idx" ON "quiz_attempts"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_score_idx" ON "quiz_attempts"("quizId", "score");

-- CreateIndex
CREATE INDEX "chat_messages_classId_createdAt_idx" ON "chat_messages"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_createdAt_idx" ON "analytics"("event", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_classId_isActive_idx" ON "announcements"("classId", "isActive");

-- CreateIndex
CREATE INDEX "notes_classId_isPublic_idx" ON "notes"("classId", "isPublic");

-- CreateIndex
CREATE INDEX "notes_subject_tags_idx" ON "notes"("subject", "tags");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_profiles_userId_key" ON "analytics_profiles"("userId");

-- CreateIndex
CREATE INDEX "analytics_profiles_riskLevel_riskScore_idx" ON "analytics_profiles"("riskLevel", "riskScore");

-- CreateIndex
CREATE INDEX "analytics_profiles_overallGPA_idx" ON "analytics_profiles"("overallGPA");

-- CreateIndex
CREATE INDEX "analytics_profiles_lastActiveDate_idx" ON "analytics_profiles"("lastActiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "class_analytics_classId_key" ON "class_analytics"("classId");

-- CreateIndex
CREATE INDEX "class_analytics_averageGrade_idx" ON "class_analytics"("averageGrade");

-- CreateIndex
CREATE INDEX "class_analytics_atRiskCount_idx" ON "class_analytics"("atRiskCount");

-- CreateIndex
CREATE INDEX "learning_activities_userId_date_idx" ON "learning_activities"("userId", "date");

-- CreateIndex
CREATE INDEX "learning_activities_classId_date_idx" ON "learning_activities"("classId", "date");

-- CreateIndex
CREATE INDEX "learning_activities_date_idx" ON "learning_activities"("date");

-- CreateIndex
CREATE UNIQUE INDEX "learning_activities_userId_date_key" ON "learning_activities"("userId", "date");

-- CreateIndex
CREATE INDEX "performance_records_userId_masteryLevel_idx" ON "performance_records"("userId", "masteryLevel");

-- CreateIndex
CREATE INDEX "performance_records_subject_topic_idx" ON "performance_records"("subject", "topic");

-- CreateIndex
CREATE INDEX "performance_records_classId_subject_idx" ON "performance_records"("classId", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "performance_records_userId_subject_topic_key" ON "performance_records"("userId", "subject", "topic");

-- CreateIndex
CREATE INDEX "ai_insights_userId_isActive_isRead_idx" ON "ai_insights"("userId", "isActive", "isRead");

-- CreateIndex
CREATE INDEX "ai_insights_scope_type_createdAt_idx" ON "ai_insights"("scope", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ai_insights_severity_isActive_idx" ON "ai_insights"("severity", "isActive");

-- CreateIndex
CREATE INDEX "mcp_query_logs_serverName_success_idx" ON "mcp_query_logs"("serverName", "success");

-- CreateIndex
CREATE INDEX "mcp_query_logs_createdAt_idx" ON "mcp_query_logs"("createdAt");

-- CreateIndex
CREATE INDEX "mcp_query_logs_userId_createdAt_idx" ON "mcp_query_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_jobs_status_scheduledFor_idx" ON "analytics_jobs"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "analytics_jobs_jobType_status_idx" ON "analytics_jobs"("jobType", "status");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_profiles" ADD CONSTRAINT "analytics_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_analytics" ADD CONSTRAINT "class_analytics_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_records" ADD CONSTRAINT "performance_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_records" ADD CONSTRAINT "performance_records_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_query_logs" ADD CONSTRAINT "mcp_query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

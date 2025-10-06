-- =====================================================
-- SAFE WAY TO DROP ALL TABLES
-- =====================================================
-- ⚠️  WARNING: This will delete ALL data in the database!
-- Only use this for development/testing purposes
-- =====================================================

BEGIN;

-- Drop tables in reverse dependency order (children first, then parents)

-- Level 5: Tables that depend on level 4
DROP TABLE IF EXISTS "visaNotifications" CASCADE;

-- Level 4: Tables that depend on level 3
DROP TABLE IF EXISTS "taskAssignments" CASCADE;
DROP TABLE IF EXISTS "visaDocuments" CASCADE;

-- Level 3: Tables that depend on level 2
DROP TABLE IF EXISTS "employeeAssignments" CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Level 2: Tables that directly depend on users and other core tables
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS "candidateProfiles" CASCADE;
DROP TABLE IF EXISTS "clientProfiles" CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS "employeeProfiles" CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS "jobApplications" CASCADE;
DROP TABLE IF EXISTS "jobPostings" CASCADE;
DROP TABLE IF EXISTS "leaveRequests" CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS "serviceRequests" CASCADE;
DROP TABLE IF EXISTS "supplierProfiles" CASCADE;

-- Level 1: Core tables
DROP TABLE IF EXISTS "serviceCategories" CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS "applicationStatusEnum" CASCADE;
DROP TYPE IF EXISTS "assignmentPriorityEnum" CASCADE;
DROP TYPE IF EXISTS "assignmentStatusEnum" CASCADE;
DROP TYPE IF EXISTS "attendanceStatusEnum" CASCADE;
DROP TYPE IF EXISTS "documentCategoryEnum" CASCADE;
DROP TYPE IF EXISTS "interviewStatusEnum" CASCADE;
DROP TYPE IF EXISTS "jobStatusEnum" CASCADE;
DROP TYPE IF EXISTS "jobTypeEnum" CASCADE;
DROP TYPE IF EXISTS "leaveStatusEnum" CASCADE;
DROP TYPE IF EXISTS "leaveTypeEnum" CASCADE;
DROP TYPE IF EXISTS "messageTypeEnum" CASCADE;
DROP TYPE IF EXISTS "notificationTypeEnum" CASCADE;
DROP TYPE IF EXISTS "priorityEnum" CASCADE;
DROP TYPE IF EXISTS "quotationStatusEnum" CASCADE;
DROP TYPE IF EXISTS "requestStatusEnum" CASCADE;
DROP TYPE IF EXISTS "userRoleEnum" CASCADE;
DROP TYPE IF EXISTS "visaNotificationType" CASCADE;
DROP TYPE IF EXISTS "visaStatusEnum" CASCADE;
DROP TYPE IF EXISTS "visaTypeEnum" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

COMMIT;

SELECT 'All tables, types, and functions dropped successfully.' AS status;

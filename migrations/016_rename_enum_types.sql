-- =====================================================
-- RENAME ALL ENUM TYPES TO CAMELCASE
-- =====================================================
-- Purpose: Rename all ENUM custom types to camelCase
-- Note: PostgreSQL doesn't support ALTER TYPE RENAME for ENUMs,
-- so we need to create new types and migrate columns
-- =====================================================

BEGIN;

-- Step 1: Drop all defaults that reference ENUM types
ALTER TABLE attendance ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "employeeAssignments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE interviews ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobApplications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobPostings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leaveRequests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN "messageType" DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE quotations ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "serviceRequests" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "serviceRequests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "taskAssignments" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "taskAssignments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "visaDocuments" ALTER COLUMN "status" DROP DEFAULT;

-- Step 2: Create new camelCase ENUM types
CREATE TYPE "applicationStatusEnum" AS ENUM ('applied', 'screening', 'interview', 'hired', 'rejected');
CREATE TYPE "assignmentPriorityEnum" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "assignmentStatusEnum" AS ENUM ('assigned', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE "attendanceStatusEnum" AS ENUM ('present', 'absent', 'late', 'half_day', 'holiday');
CREATE TYPE "documentCategoryEnum" AS ENUM ('resume', 'certificate', 'license', 'contract', 'invoice', 'passport', 'visa', 'insurance', 'other');
CREATE TYPE "interviewStatusEnum" AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE "jobStatusEnum" AS ENUM ('draft', 'published', 'closed', 'cancelled');
CREATE TYPE "jobTypeEnum" AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE "leaveStatusEnum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE "leaveTypeEnum" AS ENUM ('annual', 'sick', 'emergency', 'maternity', 'paternity');
CREATE TYPE "messageTypeEnum" AS ENUM ('direct', 'service_request', 'job_application', 'system');
CREATE TYPE "notificationTypeEnum" AS ENUM ('message', 'application', 'interview', 'payment', 'document', 'system', 'reminder');
CREATE TYPE "priorityEnum" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "quotationStatusEnum" AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE "requestStatusEnum" AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE "userRoleEnum" AS ENUM ('admin', 'client', 'supplier', 'employee', 'candidate');
CREATE TYPE "visaNotificationType" AS ENUM ('email', 'system', 'both');
CREATE TYPE "visaStatusEnum" AS ENUM ('active', 'expired', 'expiring_soon', 'expiring_critical', 'pending', 'cancelled', 'renewal_required');
CREATE TYPE "visaTypeEnum" AS ENUM ('tourist', 'work', 'student', 'business', 'transit', 'residence', 'family', 'medical', 'diplomatic', 'other');

-- Step 3: Update columns to use new ENUM types
-- Users table
ALTER TABLE users ALTER COLUMN "role" TYPE "userRoleEnum" USING "role"::text::"userRoleEnum";

-- Service requests
ALTER TABLE "serviceRequests" ALTER COLUMN "priority" TYPE "priorityEnum" USING "priority"::text::"priorityEnum";
ALTER TABLE "serviceRequests" ALTER COLUMN "status" TYPE "requestStatusEnum" USING "status"::text::"requestStatusEnum";

-- Quotations
ALTER TABLE quotations ALTER COLUMN "status" TYPE "quotationStatusEnum" USING "status"::text::"quotationStatusEnum";

-- Job postings
ALTER TABLE "jobPostings" ALTER COLUMN "jobType" TYPE "jobTypeEnum" USING "jobType"::text::"jobTypeEnum";
ALTER TABLE "jobPostings" ALTER COLUMN "status" TYPE "jobStatusEnum" USING "status"::text::"jobStatusEnum";

-- Job applications
ALTER TABLE "jobApplications" ALTER COLUMN "status" TYPE "applicationStatusEnum" USING "status"::text::"applicationStatusEnum";

-- Interviews
ALTER TABLE interviews ALTER COLUMN "status" TYPE "interviewStatusEnum" USING "status"::text::"interviewStatusEnum";

-- Attendance
ALTER TABLE attendance ALTER COLUMN "status" TYPE "attendanceStatusEnum" USING "status"::text::"attendanceStatusEnum";

-- Leave requests
ALTER TABLE "leaveRequests" ALTER COLUMN "leaveType" TYPE "leaveTypeEnum" USING "leaveType"::text::"leaveTypeEnum";
ALTER TABLE "leaveRequests" ALTER COLUMN "status" TYPE "leaveStatusEnum" USING "status"::text::"leaveStatusEnum";

-- Documents
ALTER TABLE documents ALTER COLUMN "category" TYPE "documentCategoryEnum" USING "category"::text::"documentCategoryEnum";

-- Messages
ALTER TABLE messages ALTER COLUMN "messageType" TYPE "messageTypeEnum" USING "messageType"::text::"messageTypeEnum";

-- Notifications
ALTER TABLE notifications ALTER COLUMN "type" TYPE "notificationTypeEnum" USING "type"::text::"notificationTypeEnum";

-- Projects
ALTER TABLE projects ALTER COLUMN "status" TYPE "assignmentStatusEnum" USING "status"::text::"assignmentStatusEnum";
ALTER TABLE projects ALTER COLUMN "priority" TYPE "assignmentPriorityEnum" USING "priority"::text::"assignmentPriorityEnum";

-- Employee assignments
ALTER TABLE "employeeAssignments" ALTER COLUMN "status" TYPE "assignmentStatusEnum" USING "status"::text::"assignmentStatusEnum";

-- Task assignments
ALTER TABLE "taskAssignments" ALTER COLUMN "status" TYPE "assignmentStatusEnum" USING "status"::text::"assignmentStatusEnum";
ALTER TABLE "taskAssignments" ALTER COLUMN "priority" TYPE "assignmentPriorityEnum" USING "priority"::text::"assignmentPriorityEnum";

-- Visa documents
ALTER TABLE "visaDocuments" ALTER COLUMN "visaType" TYPE "visaTypeEnum" USING "visaType"::text::"visaTypeEnum";
ALTER TABLE "visaDocuments" ALTER COLUMN "status" TYPE "visaStatusEnum" USING "status"::text::"visaStatusEnum";

-- Visa notifications
ALTER TABLE "visaNotifications" ALTER COLUMN "notificationType" TYPE "visaNotificationType" USING "notificationType"::text::"visaNotificationType";

-- Step 4: Re-add defaults with new type names
ALTER TABLE attendance ALTER COLUMN "status" SET DEFAULT 'present'::"attendanceStatusEnum";
ALTER TABLE "employeeAssignments" ALTER COLUMN "status" SET DEFAULT 'assigned'::"assignmentStatusEnum";
ALTER TABLE interviews ALTER COLUMN "status" SET DEFAULT 'scheduled'::"interviewStatusEnum";
ALTER TABLE "jobApplications" ALTER COLUMN "status" SET DEFAULT 'applied'::"applicationStatusEnum";
ALTER TABLE "jobPostings" ALTER COLUMN "status" SET DEFAULT 'draft'::"jobStatusEnum";
ALTER TABLE "leaveRequests" ALTER COLUMN "status" SET DEFAULT 'pending'::"leaveStatusEnum";
ALTER TABLE messages ALTER COLUMN "messageType" SET DEFAULT 'direct'::"messageTypeEnum";
ALTER TABLE projects ALTER COLUMN "priority" SET DEFAULT 'medium'::"assignmentPriorityEnum";
ALTER TABLE projects ALTER COLUMN "status" SET DEFAULT 'assigned'::"assignmentStatusEnum";
ALTER TABLE quotations ALTER COLUMN "status" SET DEFAULT 'pending'::"quotationStatusEnum";
ALTER TABLE "serviceRequests" ALTER COLUMN "priority" SET DEFAULT 'medium'::"priorityEnum";
ALTER TABLE "serviceRequests" ALTER COLUMN "status" SET DEFAULT 'draft'::"requestStatusEnum";
ALTER TABLE "taskAssignments" ALTER COLUMN "priority" SET DEFAULT 'medium'::"assignmentPriorityEnum";
ALTER TABLE "taskAssignments" ALTER COLUMN "status" SET DEFAULT 'assigned'::"assignmentStatusEnum";
ALTER TABLE "visaDocuments" ALTER COLUMN "status" SET DEFAULT 'active'::"visaStatusEnum";

-- Step 5: Drop old ENUM types
DROP TYPE application_status_enum;
DROP TYPE assignment_priority_enum;
DROP TYPE assignment_status_enum;
DROP TYPE attendance_status_enum;
DROP TYPE document_category_enum;
DROP TYPE interview_status_enum;
DROP TYPE job_status_enum;
DROP TYPE job_type_enum;
DROP TYPE leave_status_enum;
DROP TYPE leave_type_enum;
DROP TYPE message_type_enum;
DROP TYPE notification_type_enum;
DROP TYPE priority_enum;
DROP TYPE quotation_status_enum;
DROP TYPE request_status_enum;
DROP TYPE user_role_enum;
DROP TYPE visa_notification_type;
DROP TYPE visa_status_enum;
DROP TYPE visa_type_enum;

COMMIT;

SELECT 'All ENUM types renamed to camelCase successfully.' AS status;

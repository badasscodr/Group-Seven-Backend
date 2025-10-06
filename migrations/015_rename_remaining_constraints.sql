-- =====================================================
-- RENAME REMAINING CONSTRAINTS TO CAMELCASE
-- =====================================================
-- Purpose: Rename constraints for tables that weren't included in the first pass
-- =====================================================

BEGIN;

-- Quotations
ALTER TABLE quotations RENAME CONSTRAINT "quotations_pkey" TO "quotationsPkey";
ALTER TABLE quotations RENAME CONSTRAINT "quotations_serviceRequestId_fkey" TO "quotationsServiceRequestIdFkey";
ALTER TABLE quotations RENAME CONSTRAINT "quotations_supplierId_fkey" TO "quotationsSupplierIdFkey";

-- Payments
ALTER TABLE payments RENAME CONSTRAINT "payments_pkey" TO "paymentsPkey";
ALTER TABLE payments RENAME CONSTRAINT "payments_quotationId_fkey" TO "paymentsQuotationIdFkey";
ALTER TABLE payments RENAME CONSTRAINT "payments_supplierId_fkey" TO "paymentsSupplierIdFkey";
ALTER TABLE payments RENAME CONSTRAINT "payments_clientId_fkey" TO "paymentsClientIdFkey";
ALTER TABLE payments RENAME CONSTRAINT "payments_approvedBy_fkey" TO "paymentsApprovedByFkey";
ALTER TABLE payments RENAME CONSTRAINT "payments_status_check" TO "paymentsStatusCheck";

-- Interviews
ALTER TABLE interviews RENAME CONSTRAINT "interviews_pkey" TO "interviewsPkey";
ALTER TABLE interviews RENAME CONSTRAINT "interviews_applicationId_fkey" TO "interviewsApplicationIdFkey";
ALTER TABLE interviews RENAME CONSTRAINT "interviews_interviewerId_fkey" TO "interviewsInterviewerIdFkey";

-- Attendance
ALTER TABLE attendance RENAME CONSTRAINT "attendance_pkey" TO "attendancePkey";
ALTER TABLE attendance RENAME CONSTRAINT "attendance_employeeId_fkey" TO "attendanceEmployeeIdFkey";
ALTER TABLE attendance RENAME CONSTRAINT "attendance_employeeId_date_key" TO "attendanceEmployeeIdDateKey";

-- Documents
ALTER TABLE documents RENAME CONSTRAINT "documents_pkey" TO "documentsPkey";
ALTER TABLE documents RENAME CONSTRAINT "documents_userId_fkey" TO "documentsUserIdFkey";

-- Messages
ALTER TABLE messages RENAME CONSTRAINT "messages_pkey" TO "messagesPkey";
ALTER TABLE messages RENAME CONSTRAINT "messages_senderId_fkey" TO "messagesSenderIdFkey";
ALTER TABLE messages RENAME CONSTRAINT "messages_recipientId_fkey" TO "messagesRecipientIdFkey";

-- Notifications
ALTER TABLE notifications RENAME CONSTRAINT "notifications_pkey" TO "notificationsPkey";
ALTER TABLE notifications RENAME CONSTRAINT "notifications_userId_fkey" TO "notificationsUserIdFkey";

-- Projects
ALTER TABLE projects RENAME CONSTRAINT "projects_pkey" TO "projectsPkey";
ALTER TABLE projects RENAME CONSTRAINT "projects_clientId_fkey" TO "projectsClientIdFkey";
ALTER TABLE projects RENAME CONSTRAINT "projects_projectManagerId_fkey" TO "projectsProjectManagerIdFkey";

-- Users
ALTER TABLE users RENAME CONSTRAINT "users_pkey" TO "usersPkey";
ALTER TABLE users RENAME CONSTRAINT "users_email_key" TO "usersEmailKey";

-- Note: Constraint renames (PRIMARY KEY, UNIQUE) automatically rename their associated indexes,
-- so we don't need to rename them separately. PostgreSQL handles this automatically.

COMMIT;

SELECT 'All remaining constraints and indexes renamed to camelCase successfully.' AS status;

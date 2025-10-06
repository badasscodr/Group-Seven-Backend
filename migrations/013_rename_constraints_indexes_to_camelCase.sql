-- =====================================================
-- RENAME ALL CONSTRAINTS AND INDEXES TO CAMELCASE
-- =====================================================
-- Purpose: Rename all constraint and index names to camelCase
-- =====================================================

BEGIN;

-- =====================================================
-- DROP OLD INDEXES (will be recreated with camelCase names)
-- =====================================================

-- Attendance indexes
DROP INDEX IF EXISTS idx_attendance_employeeId;
DROP INDEX IF EXISTS idx_attendance_date;

-- Documents indexes
DROP INDEX IF EXISTS idx_documents_userId;
DROP INDEX IF EXISTS idx_documents_category;

-- Employee assignments indexes
DROP INDEX IF EXISTS idx_employee_assignments_employeeId;
DROP INDEX IF EXISTS idx_employee_assignments_projectId;

-- Job applications indexes
DROP INDEX IF EXISTS idx_job_applications_jobId;
DROP INDEX IF EXISTS idx_job_applications_candidateId;
DROP INDEX IF EXISTS idx_job_applications_status;

-- Job postings indexes
DROP INDEX IF EXISTS idx_job_postings_status;
DROP INDEX IF EXISTS idx_job_postings_postedBy;
DROP INDEX IF EXISTS idx_job_postings_jobType;
DROP INDEX IF EXISTS idx_job_postings_createdAt;

-- Messages indexes
DROP INDEX IF EXISTS idx_messages_senderId;
DROP INDEX IF EXISTS idx_messages_recipientId;
DROP INDEX IF EXISTS idx_messages_isRead;

-- Notifications indexes
DROP INDEX IF EXISTS idx_notifications_userId;
DROP INDEX IF EXISTS idx_notifications_isRead;

-- Payments indexes
DROP INDEX IF EXISTS idx_payments_supplierId;
DROP INDEX IF EXISTS idx_payments_clientId;
DROP INDEX IF EXISTS idx_payments_quotationId;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_dueDate;

-- Projects indexes
DROP INDEX IF EXISTS idx_projects_clientId;
DROP INDEX IF EXISTS idx_projects_status;

-- Quotations indexes
DROP INDEX IF EXISTS idx_quotations_serviceRequestId;
DROP INDEX IF EXISTS idx_quotations_supplierId;
DROP INDEX IF EXISTS idx_quotations_status;

-- Service requests indexes
DROP INDEX IF EXISTS idx_service_requests_clientId;
DROP INDEX IF EXISTS idx_service_requests_status;
DROP INDEX IF EXISTS idx_service_requests_category;
DROP INDEX IF EXISTS idx_service_requests_createdAt;

-- Users indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_isActive;

-- Visa documents indexes
DROP INDEX IF EXISTS idx_visa_documents_userId;
DROP INDEX IF EXISTS idx_visa_documents_expiryDate;
DROP INDEX IF EXISTS idx_visa_documents_status;

-- =====================================================
-- RENAME PRIMARY KEY CONSTRAINTS
-- =====================================================

ALTER TABLE "clientProfiles" RENAME CONSTRAINT client_profiles_pkey TO "clientProfiles_pkey";
ALTER TABLE "supplierProfiles" RENAME CONSTRAINT supplier_profiles_pkey TO "supplierProfiles_pkey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT employee_profiles_pkey TO "employeeProfiles_pkey";
ALTER TABLE "candidateProfiles" RENAME CONSTRAINT candidate_profiles_pkey TO "candidateProfiles_pkey";
ALTER TABLE "serviceCategories" RENAME CONSTRAINT service_categories_pkey TO "serviceCategories_pkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT service_requests_pkey TO "serviceRequests_pkey";
ALTER TABLE "jobPostings" RENAME CONSTRAINT job_postings_pkey TO "jobPostings_pkey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT job_applications_pkey TO "jobApplications_pkey";
ALTER TABLE "leaveRequests" RENAME CONSTRAINT leave_requests_pkey TO "leaveRequests_pkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT employee_assignments_pkey TO "employeeAssignments_pkey";
ALTER TABLE "taskAssignments" RENAME CONSTRAINT task_assignments_pkey TO "taskAssignments_pkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT visa_documents_pkey TO "visaDocuments_pkey";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT visa_notifications_pkey TO "visaNotifications_pkey";

-- =====================================================
-- RENAME FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Client profiles
ALTER TABLE "clientProfiles" RENAME CONSTRAINT client_profiles_userId_fkey TO "clientProfiles_userId_fkey";

-- Supplier profiles
ALTER TABLE "supplierProfiles" RENAME CONSTRAINT supplier_profiles_userId_fkey TO "supplierProfiles_userId_fkey";

-- Employee profiles
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT employee_profiles_userId_fkey TO "employeeProfiles_userId_fkey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT employee_profiles_managerId_fkey TO "employeeProfiles_managerId_fkey";

-- Candidate profiles
ALTER TABLE "candidateProfiles" RENAME CONSTRAINT candidate_profiles_userId_fkey TO "candidateProfiles_userId_fkey";

-- Service requests
ALTER TABLE "serviceRequests" RENAME CONSTRAINT service_requests_clientId_fkey TO "serviceRequests_clientId_fkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT service_requests_assignedSupplierId_fkey TO "serviceRequests_assignedSupplierId_fkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT service_requests_assignedEmployeeId_fkey TO "serviceRequests_assignedEmployeeId_fkey";

-- Quotations
ALTER TABLE quotations RENAME CONSTRAINT quotations_serviceRequestId_fkey TO "quotations_serviceRequestId_fkey";
ALTER TABLE quotations RENAME CONSTRAINT quotations_supplierId_fkey TO "quotations_supplierId_fkey";

-- Payments
ALTER TABLE payments RENAME CONSTRAINT payments_quotationId_fkey TO "payments_quotationId_fkey";
ALTER TABLE payments RENAME CONSTRAINT payments_supplierId_fkey TO "payments_supplierId_fkey";
ALTER TABLE payments RENAME CONSTRAINT payments_clientId_fkey TO "payments_clientId_fkey";
ALTER TABLE payments RENAME CONSTRAINT payments_approvedBy_fkey TO "payments_approvedBy_fkey";

-- Job postings
ALTER TABLE "jobPostings" RENAME CONSTRAINT job_postings_postedBy_fkey TO "jobPostings_postedBy_fkey";

-- Job applications
ALTER TABLE "jobApplications" RENAME CONSTRAINT job_applications_jobId_fkey TO "jobApplications_jobId_fkey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT job_applications_candidateId_fkey TO "jobApplications_candidateId_fkey";

-- Interviews
ALTER TABLE interviews RENAME CONSTRAINT interviews_applicationId_fkey TO "interviews_applicationId_fkey";
ALTER TABLE interviews RENAME CONSTRAINT interviews_interviewerId_fkey TO "interviews_interviewerId_fkey";

-- Attendance
ALTER TABLE attendance RENAME CONSTRAINT attendance_employeeId_fkey TO "attendance_employeeId_fkey";

-- Leave requests
ALTER TABLE "leaveRequests" RENAME CONSTRAINT leave_requests_employeeId_fkey TO "leaveRequests_employeeId_fkey";
ALTER TABLE "leaveRequests" RENAME CONSTRAINT leave_requests_approvedBy_fkey TO "leaveRequests_approvedBy_fkey";

-- Documents
ALTER TABLE documents RENAME CONSTRAINT documents_userId_fkey TO "documents_userId_fkey";

-- Messages
ALTER TABLE messages RENAME CONSTRAINT messages_senderId_fkey TO "messages_senderId_fkey";
ALTER TABLE messages RENAME CONSTRAINT messages_recipientId_fkey TO "messages_recipientId_fkey";

-- Notifications
ALTER TABLE notifications RENAME CONSTRAINT notifications_userId_fkey TO "notifications_userId_fkey";

-- Projects
ALTER TABLE projects RENAME CONSTRAINT projects_clientId_fkey TO "projects_clientId_fkey";
ALTER TABLE projects RENAME CONSTRAINT projects_projectManagerId_fkey TO "projects_projectManagerId_fkey";

-- Employee assignments
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT employee_assignments_employeeId_fkey TO "employeeAssignments_employeeId_fkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT employee_assignments_projectId_fkey TO "employeeAssignments_projectId_fkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT employee_assignments_assignedBy_fkey TO "employeeAssignments_assignedBy_fkey";

-- Task assignments
ALTER TABLE "taskAssignments" RENAME CONSTRAINT task_assignments_assignmentId_fkey TO "taskAssignments_assignmentId_fkey";

-- Visa documents
ALTER TABLE "visaDocuments" RENAME CONSTRAINT visa_documents_userId_fkey TO "visaDocuments_userId_fkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT visa_documents_documentId_fkey TO "visaDocuments_documentId_fkey";

-- Visa notifications
ALTER TABLE "visaNotifications" RENAME CONSTRAINT visa_notifications_userId_fkey TO "visaNotifications_userId_fkey";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT visa_notifications_visaId_fkey TO "visaNotifications_visaId_fkey";

-- =====================================================
-- RENAME UNIQUE CONSTRAINTS
-- =====================================================

ALTER TABLE "serviceCategories" RENAME CONSTRAINT service_categories_name_key TO "serviceCategories_name_key";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT employee_profiles_employeeId_key TO "employeeProfiles_employeeId_key";
ALTER TABLE "jobApplications" RENAME CONSTRAINT job_applications_jobId_candidateId_key TO "jobApplications_jobId_candidateId_key";
ALTER TABLE attendance RENAME CONSTRAINT attendance_employeeId_date_key TO "attendance_employeeId_date_key";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT unique_document_visa TO "visaDocuments_documentId_key";

-- =====================================================
-- RENAME CHECK CONSTRAINTS
-- =====================================================

ALTER TABLE payments RENAME CONSTRAINT payments_status_check TO "payments_status_check";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT visa_expiry_after_issued TO "visaDocuments_expiryAfterIssued_check";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT visa_notifications_status_check TO "visaNotifications_status_check";

-- =====================================================
-- CREATE NEW INDEXES WITH CAMELCASE NAMES
-- =====================================================

-- Users indexes
CREATE INDEX "idx_users_email" ON users("email");
CREATE INDEX "idx_users_role" ON users("role");
CREATE INDEX "idx_users_isActive" ON users("isActive");

-- Service requests indexes
CREATE INDEX "idx_serviceRequests_clientId" ON "serviceRequests"("clientId");
CREATE INDEX "idx_serviceRequests_status" ON "serviceRequests"("status");
CREATE INDEX "idx_serviceRequests_category" ON "serviceRequests"("category");
CREATE INDEX "idx_serviceRequests_createdAt" ON "serviceRequests"("createdAt");

-- Quotations indexes
CREATE INDEX "idx_quotations_serviceRequestId" ON quotations("serviceRequestId");
CREATE INDEX "idx_quotations_supplierId" ON quotations("supplierId");
CREATE INDEX "idx_quotations_status" ON quotations("status");

-- Payments indexes
CREATE INDEX "idx_payments_supplierId" ON payments("supplierId");
CREATE INDEX "idx_payments_clientId" ON payments("clientId");
CREATE INDEX "idx_payments_quotationId" ON payments("quotationId");
CREATE INDEX "idx_payments_status" ON payments("status");
CREATE INDEX "idx_payments_dueDate" ON payments("dueDate");

-- Job postings indexes
CREATE INDEX "idx_jobPostings_status" ON "jobPostings"("status");
CREATE INDEX "idx_jobPostings_postedBy" ON "jobPostings"("postedBy");
CREATE INDEX "idx_jobPostings_jobType" ON "jobPostings"("jobType");
CREATE INDEX "idx_jobPostings_createdAt" ON "jobPostings"("createdAt");

-- Job applications indexes
CREATE INDEX "idx_jobApplications_jobId" ON "jobApplications"("jobId");
CREATE INDEX "idx_jobApplications_candidateId" ON "jobApplications"("candidateId");
CREATE INDEX "idx_jobApplications_status" ON "jobApplications"("status");

-- Attendance indexes
CREATE INDEX "idx_attendance_employeeId" ON attendance("employeeId");
CREATE INDEX "idx_attendance_date" ON attendance("date");

-- Documents indexes
CREATE INDEX "idx_documents_userId" ON documents("userId");
CREATE INDEX "idx_documents_category" ON documents("category");

-- Messages indexes
CREATE INDEX "idx_messages_senderId" ON messages("senderId");
CREATE INDEX "idx_messages_recipientId" ON messages("recipientId");
CREATE INDEX "idx_messages_isRead" ON messages("isRead");

-- Notifications indexes
CREATE INDEX "idx_notifications_userId" ON notifications("userId");
CREATE INDEX "idx_notifications_isRead" ON notifications("isRead");

-- Projects indexes
CREATE INDEX "idx_projects_clientId" ON projects("clientId");
CREATE INDEX "idx_projects_status" ON projects("status");

-- Employee assignments indexes
CREATE INDEX "idx_employeeAssignments_employeeId" ON "employeeAssignments"("employeeId");
CREATE INDEX "idx_employeeAssignments_projectId" ON "employeeAssignments"("projectId");

-- Visa documents indexes
CREATE INDEX "idx_visaDocuments_userId" ON "visaDocuments"("userId");
CREATE INDEX "idx_visaDocuments_expiryDate" ON "visaDocuments"("expiryDate");
CREATE INDEX "idx_visaDocuments_status" ON "visaDocuments"("status");

COMMIT;

SELECT 'All constraints and indexes renamed to camelCase successfully.' AS status;

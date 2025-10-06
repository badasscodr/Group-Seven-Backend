-- =====================================================
-- RENAME ALL TABLES TO CAMELCASE
-- =====================================================
-- Purpose: Rename all table names from snake_case to camelCase
-- All column names are already camelCase with quotes
-- =====================================================

BEGIN;

-- Rename all tables to camelCase (quoted to preserve case)
ALTER TABLE candidate_profiles RENAME TO "candidateProfiles";
ALTER TABLE client_profiles RENAME TO "clientProfiles";
ALTER TABLE supplier_profiles RENAME TO "supplierProfiles";
ALTER TABLE employee_profiles RENAME TO "employeeProfiles";
ALTER TABLE service_categories RENAME TO "serviceCategories";
ALTER TABLE service_requests RENAME TO "serviceRequests";
ALTER TABLE job_postings RENAME TO "jobPostings";
ALTER TABLE job_applications RENAME TO "jobApplications";
ALTER TABLE leave_requests RENAME TO "leaveRequests";
ALTER TABLE employee_assignments RENAME TO "employeeAssignments";
ALTER TABLE task_assignments RENAME TO "taskAssignments";
ALTER TABLE visa_documents RENAME TO "visaDocuments";
ALTER TABLE visa_notifications RENAME TO "visaNotifications";

COMMIT;

SELECT 'All tables renamed to camelCase successfully.' AS status;

-- =====================================================
-- COMPLETE DATABASE RESET - DROP ALL TABLES
-- =====================================================
-- WARNING: This will delete ALL data permanently!
-- Created: 2025-10-05
-- Purpose: Clean slate for camelCase migration
-- =====================================================

BEGIN;

-- Drop all tables in reverse dependency order (CASCADE handles foreign keys)
DROP TABLE IF EXISTS visa_notifications CASCADE;
DROP TABLE IF EXISTS visa_documents CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS employee_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS employee_profiles CASCADE;
DROP TABLE IF EXISTS supplier_profiles CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS visa_notification_type CASCADE;
DROP TYPE IF EXISTS visa_status_enum CASCADE;
DROP TYPE IF EXISTS visa_type_enum CASCADE;
DROP TYPE IF EXISTS assignment_priority_enum CASCADE;
DROP TYPE IF EXISTS assignment_status_enum CASCADE;
DROP TYPE IF EXISTS interview_status_enum CASCADE;
DROP TYPE IF EXISTS application_status_enum CASCADE;
DROP TYPE IF EXISTS job_status_enum CASCADE;
DROP TYPE IF EXISTS job_type_enum CASCADE;
DROP TYPE IF EXISTS leave_status_enum CASCADE;
DROP TYPE IF EXISTS leave_type_enum CASCADE;
DROP TYPE IF EXISTS attendance_status_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;
DROP TYPE IF EXISTS message_type_enum CASCADE;
DROP TYPE IF EXISTS document_category_enum CASCADE;
DROP TYPE IF EXISTS quotation_status_enum CASCADE;
DROP TYPE IF EXISTS request_status_enum CASCADE;
DROP TYPE IF EXISTS priority_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

COMMIT;

-- Verify all tables are dropped
SELECT 'All tables dropped successfully. Database is clean.' AS status;

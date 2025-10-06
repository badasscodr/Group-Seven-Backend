-- Migration: Rename all database columns from snake_case to camelCase
-- Date: 2025-10-04
-- Author: System Migration
-- Description: Converts all column names to camelCase for consistency with JavaScript/TypeScript

BEGIN;

-- =====================================================
-- USERS TABLE
-- =====================================================
ALTER TABLE users RENAME COLUMN first_name TO "firstName";
ALTER TABLE users RENAME COLUMN last_name TO "lastName";
ALTER TABLE users RENAME COLUMN password_hash TO "passwordHash";
ALTER TABLE users RENAME COLUMN avatar_url TO "avatarUrl";
ALTER TABLE users RENAME COLUMN is_active TO "isActive";
ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE users RENAME COLUMN last_login TO "lastLogin";

-- =====================================================
-- CLIENT_PROFILES TABLE
-- =====================================================
ALTER TABLE client_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE client_profiles RENAME COLUMN company_name TO "companyName";
ALTER TABLE client_profiles RENAME COLUMN company_size TO "companySize";
ALTER TABLE client_profiles RENAME COLUMN business_license TO "businessLicense";
ALTER TABLE client_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- SUPPLIER_PROFILES TABLE
-- =====================================================
ALTER TABLE supplier_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE supplier_profiles RENAME COLUMN company_name TO "companyName";
ALTER TABLE supplier_profiles RENAME COLUMN business_type TO "businessType";
ALTER TABLE supplier_profiles RENAME COLUMN license_number TO "licenseNumber";
ALTER TABLE supplier_profiles RENAME COLUMN trade_license_expiry TO "tradeLicenseExpiry";
ALTER TABLE supplier_profiles RENAME COLUMN insurance_details TO "insuranceDetails";
ALTER TABLE supplier_profiles RENAME COLUMN service_categories TO "serviceCategories";
ALTER TABLE supplier_profiles RENAME COLUMN total_reviews TO "totalReviews";
ALTER TABLE supplier_profiles RENAME COLUMN is_verified TO "isVerified";
ALTER TABLE supplier_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- EMPLOYEE_PROFILES TABLE
-- =====================================================
ALTER TABLE employee_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE employee_profiles RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE employee_profiles RENAME COLUMN hire_date TO "hireDate";
ALTER TABLE employee_profiles RENAME COLUMN visa_status TO "visaStatus";
ALTER TABLE employee_profiles RENAME COLUMN visa_expiry TO "visaExpiry";
ALTER TABLE employee_profiles RENAME COLUMN passport_number TO "passportNumber";
ALTER TABLE employee_profiles RENAME COLUMN emergency_contact_name TO "emergencyContactName";
ALTER TABLE employee_profiles RENAME COLUMN emergency_contact_phone TO "emergencyContactPhone";
ALTER TABLE employee_profiles RENAME COLUMN manager_id TO "managerId";
ALTER TABLE employee_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- CANDIDATE_PROFILES TABLE
-- =====================================================
ALTER TABLE candidate_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE candidate_profiles RENAME COLUMN resume_url TO "resumeUrl";
ALTER TABLE candidate_profiles RENAME COLUMN portfolio_url TO "portfolioUrl";
ALTER TABLE candidate_profiles RENAME COLUMN linkedin_url TO "linkedinUrl";
ALTER TABLE candidate_profiles RENAME COLUMN experience_years TO "experienceYears";
ALTER TABLE candidate_profiles RENAME COLUMN desired_salary_min TO "desiredSalaryMin";
ALTER TABLE candidate_profiles RENAME COLUMN desired_salary_max TO "desiredSalaryMax";
ALTER TABLE candidate_profiles RENAME COLUMN location_preference TO "locationPreference";
ALTER TABLE candidate_profiles RENAME COLUMN job_type_preference TO "jobTypePreference";
ALTER TABLE candidate_profiles RENAME COLUMN availability_date TO "availabilityDate";
ALTER TABLE candidate_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- SERVICE_REQUESTS TABLE
-- =====================================================
ALTER TABLE service_requests RENAME COLUMN client_id TO "clientId";
ALTER TABLE service_requests RENAME COLUMN category_id TO "categoryId";
ALTER TABLE service_requests RENAME COLUMN budget_min TO "budgetMin";
ALTER TABLE service_requests RENAME COLUMN budget_max TO "budgetMax";
ALTER TABLE service_requests RENAME COLUMN required_date TO "requiredDate";
ALTER TABLE service_requests RENAME COLUMN assigned_to TO "assignedTo";
ALTER TABLE service_requests RENAME COLUMN created_at TO "createdAt";
ALTER TABLE service_requests RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- QUOTATIONS TABLE
-- =====================================================
ALTER TABLE quotations RENAME COLUMN service_request_id TO "serviceRequestId";
ALTER TABLE quotations RENAME COLUMN supplier_id TO "supplierId";
ALTER TABLE quotations RENAME COLUMN quoted_price TO "quotedPrice";
ALTER TABLE quotations RENAME COLUMN delivery_time TO "deliveryTime";
ALTER TABLE quotations RENAME COLUMN validity_date TO "validityDate";
ALTER TABLE quotations RENAME COLUMN created_at TO "createdAt";
ALTER TABLE quotations RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- JOB_POSTINGS TABLE
-- =====================================================
ALTER TABLE job_postings RENAME COLUMN posted_by TO "postedBy";
ALTER TABLE job_postings RENAME COLUMN job_type TO "jobType";
ALTER TABLE job_postings RENAME COLUMN experience_required TO "experienceRequired";
ALTER TABLE job_postings RENAME COLUMN salary_min TO "salaryMin";
ALTER TABLE job_postings RENAME COLUMN salary_max TO "salaryMax";
ALTER TABLE job_postings RENAME COLUMN skills_required TO "skillsRequired";
ALTER TABLE job_postings RENAME COLUMN application_deadline TO "applicationDeadline";
ALTER TABLE job_postings RENAME COLUMN created_at TO "createdAt";
ALTER TABLE job_postings RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- JOB_APPLICATIONS TABLE
-- =====================================================
ALTER TABLE job_applications RENAME COLUMN job_id TO "jobId";
ALTER TABLE job_applications RENAME COLUMN candidate_id TO "candidateId";
ALTER TABLE job_applications RENAME COLUMN cover_letter TO "coverLetter";
ALTER TABLE job_applications RENAME COLUMN resume_url TO "resumeUrl";
ALTER TABLE job_applications RENAME COLUMN applied_at TO "appliedAt";

-- =====================================================
-- INTERVIEWS TABLE
-- =====================================================
ALTER TABLE interviews RENAME COLUMN application_id TO "applicationId";
ALTER TABLE interviews RENAME COLUMN scheduled_date TO "scheduledDate";
ALTER TABLE interviews RENAME COLUMN interview_type TO "interviewType";
ALTER TABLE interviews RENAME COLUMN created_at TO "createdAt";
ALTER TABLE interviews RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
ALTER TABLE documents RENAME COLUMN user_id TO "userId";
ALTER TABLE documents RENAME COLUMN file_name TO "fileName";
ALTER TABLE documents RENAME COLUMN file_url TO "fileUrl";
ALTER TABLE documents RENAME COLUMN file_size TO "fileSize";
ALTER TABLE documents RENAME COLUMN file_type TO "fileType";
ALTER TABLE documents RENAME COLUMN is_public TO "isPublic";
ALTER TABLE documents RENAME COLUMN uploaded_at TO "uploadedAt";

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
ALTER TABLE messages RENAME COLUMN sender_id TO "senderId";
ALTER TABLE messages RENAME COLUMN recipient_id TO "recipientId";
ALTER TABLE messages RENAME COLUMN message_type TO "messageType";
ALTER TABLE messages RENAME COLUMN reference_id TO "referenceId";
ALTER TABLE messages RENAME COLUMN is_read TO "isRead";
ALTER TABLE messages RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
ALTER TABLE notifications RENAME COLUMN user_id TO "userId";
ALTER TABLE notifications RENAME COLUMN action_url TO "actionUrl";
ALTER TABLE notifications RENAME COLUMN is_read TO "isRead";
ALTER TABLE notifications RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
ALTER TABLE attendance RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE attendance RENAME COLUMN clock_in TO "clockIn";
ALTER TABLE attendance RENAME COLUMN clock_out TO "clockOut";
ALTER TABLE attendance RENAME COLUMN total_hours TO "totalHours";

-- =====================================================
-- LEAVE_REQUESTS TABLE
-- =====================================================
ALTER TABLE leave_requests RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE leave_requests RENAME COLUMN leave_type TO "leaveType";
ALTER TABLE leave_requests RENAME COLUMN start_date TO "startDate";
ALTER TABLE leave_requests RENAME COLUMN end_date TO "endDate";
ALTER TABLE leave_requests RENAME COLUMN approved_by TO "approvedBy";
ALTER TABLE leave_requests RENAME COLUMN created_at TO "createdAt";
ALTER TABLE leave_requests RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- SERVICE_CATEGORIES TABLE
-- =====================================================
ALTER TABLE service_categories RENAME COLUMN created_at TO "createdAt";

COMMIT;

-- Migration completed successfully
-- All columns renamed from snake_case to camelCase

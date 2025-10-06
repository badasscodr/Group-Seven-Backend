-- Rollback Migration: Revert camelCase columns back to snake_case
-- Date: 2025-10-04
-- Description: Emergency rollback script in case migration needs to be reverted

BEGIN;

-- =====================================================
-- USERS TABLE
-- =====================================================
ALTER TABLE users RENAME COLUMN "firstName" TO first_name;
ALTER TABLE users RENAME COLUMN "lastName" TO last_name;
ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;
ALTER TABLE users RENAME COLUMN "avatarUrl" TO avatar_url;
ALTER TABLE users RENAME COLUMN "isActive" TO is_active;
ALTER TABLE users RENAME COLUMN "emailVerified" TO email_verified;
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE users RENAME COLUMN "lastLogin" TO last_login;

-- =====================================================
-- CLIENT_PROFILES TABLE
-- =====================================================
ALTER TABLE client_profiles RENAME COLUMN "userId" TO user_id;
ALTER TABLE client_profiles RENAME COLUMN "companyName" TO company_name;
ALTER TABLE client_profiles RENAME COLUMN "companySize" TO company_size;
ALTER TABLE client_profiles RENAME COLUMN "businessLicense" TO business_license;
ALTER TABLE client_profiles RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- SUPPLIER_PROFILES TABLE
-- =====================================================
ALTER TABLE supplier_profiles RENAME COLUMN "userId" TO user_id;
ALTER TABLE supplier_profiles RENAME COLUMN "companyName" TO company_name;
ALTER TABLE supplier_profiles RENAME COLUMN "businessType" TO business_type;
ALTER TABLE supplier_profiles RENAME COLUMN "licenseNumber" TO license_number;
ALTER TABLE supplier_profiles RENAME COLUMN "tradeLicenseExpiry" TO trade_license_expiry;
ALTER TABLE supplier_profiles RENAME COLUMN "insuranceDetails" TO insurance_details;
ALTER TABLE supplier_profiles RENAME COLUMN "serviceCategories" TO service_categories;
ALTER TABLE supplier_profiles RENAME COLUMN "totalReviews" TO total_reviews;
ALTER TABLE supplier_profiles RENAME COLUMN "isVerified" TO is_verified;
ALTER TABLE supplier_profiles RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- EMPLOYEE_PROFILES TABLE
-- =====================================================
ALTER TABLE employee_profiles RENAME COLUMN "userId" TO user_id;
ALTER TABLE employee_profiles RENAME COLUMN "employeeId" TO employee_id;
ALTER TABLE employee_profiles RENAME COLUMN "hireDate" TO hire_date;
ALTER TABLE employee_profiles RENAME COLUMN "visaStatus" TO visa_status;
ALTER TABLE employee_profiles RENAME COLUMN "visaExpiry" TO visa_expiry;
ALTER TABLE employee_profiles RENAME COLUMN "passportNumber" TO passport_number;
ALTER TABLE employee_profiles RENAME COLUMN "emergencyContactName" TO emergency_contact_name;
ALTER TABLE employee_profiles RENAME COLUMN "emergencyContactPhone" TO emergency_contact_phone;
ALTER TABLE employee_profiles RENAME COLUMN "managerId" TO manager_id;
ALTER TABLE employee_profiles RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- CANDIDATE_PROFILES TABLE
-- =====================================================
ALTER TABLE candidate_profiles RENAME COLUMN "userId" TO user_id;
ALTER TABLE candidate_profiles RENAME COLUMN "resumeUrl" TO resume_url;
ALTER TABLE candidate_profiles RENAME COLUMN "portfolioUrl" TO portfolio_url;
ALTER TABLE candidate_profiles RENAME COLUMN "linkedinUrl" TO linkedin_url;
ALTER TABLE candidate_profiles RENAME COLUMN "experienceYears" TO experience_years;
ALTER TABLE candidate_profiles RENAME COLUMN "desiredSalaryMin" TO desired_salary_min;
ALTER TABLE candidate_profiles RENAME COLUMN "desiredSalaryMax" TO desired_salary_max;
ALTER TABLE candidate_profiles RENAME COLUMN "locationPreference" TO location_preference;
ALTER TABLE candidate_profiles RENAME COLUMN "jobTypePreference" TO job_type_preference;
ALTER TABLE candidate_profiles RENAME COLUMN "availabilityDate" TO availability_date;
ALTER TABLE candidate_profiles RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- SERVICE_REQUESTS TABLE
-- =====================================================
ALTER TABLE service_requests RENAME COLUMN "clientId" TO client_id;
ALTER TABLE service_requests RENAME COLUMN "categoryId" TO category_id;
ALTER TABLE service_requests RENAME COLUMN "budgetMin" TO budget_min;
ALTER TABLE service_requests RENAME COLUMN "budgetMax" TO budget_max;
ALTER TABLE service_requests RENAME COLUMN "requiredDate" TO required_date;
ALTER TABLE service_requests RENAME COLUMN "assignedTo" TO assigned_to;
ALTER TABLE service_requests RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE service_requests RENAME COLUMN "updatedAt" TO updated_at;

-- =====================================================
-- QUOTATIONS TABLE
-- =====================================================
ALTER TABLE quotations RENAME COLUMN "serviceRequestId" TO service_request_id;
ALTER TABLE quotations RENAME COLUMN "supplierId" TO supplier_id;
ALTER TABLE quotations RENAME COLUMN "quotedPrice" TO quoted_price;
ALTER TABLE quotations RENAME COLUMN "deliveryTime" TO delivery_time;
ALTER TABLE quotations RENAME COLUMN "validityDate" TO validity_date;
ALTER TABLE quotations RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE quotations RENAME COLUMN "updatedAt" TO updated_at;

-- =====================================================
-- JOB_POSTINGS TABLE
-- =====================================================
ALTER TABLE job_postings RENAME COLUMN "postedBy" TO posted_by;
ALTER TABLE job_postings RENAME COLUMN "jobType" TO job_type;
ALTER TABLE job_postings RENAME COLUMN "experienceRequired" TO experience_required;
ALTER TABLE job_postings RENAME COLUMN "salaryMin" TO salary_min;
ALTER TABLE job_postings RENAME COLUMN "salaryMax" TO salary_max;
ALTER TABLE job_postings RENAME COLUMN "skillsRequired" TO skills_required;
ALTER TABLE job_postings RENAME COLUMN "applicationDeadline" TO application_deadline;
ALTER TABLE job_postings RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE job_postings RENAME COLUMN "updatedAt" TO updated_at;

-- =====================================================
-- JOB_APPLICATIONS TABLE
-- =====================================================
ALTER TABLE job_applications RENAME COLUMN "jobId" TO job_id;
ALTER TABLE job_applications RENAME COLUMN "candidateId" TO candidate_id;
ALTER TABLE job_applications RENAME COLUMN "coverLetter" TO cover_letter;
ALTER TABLE job_applications RENAME COLUMN "resumeUrl" TO resume_url;
ALTER TABLE job_applications RENAME COLUMN "appliedAt" TO applied_at;

-- =====================================================
-- INTERVIEWS TABLE
-- =====================================================
ALTER TABLE interviews RENAME COLUMN "applicationId" TO application_id;
ALTER TABLE interviews RENAME COLUMN "scheduledDate" TO scheduled_date;
ALTER TABLE interviews RENAME COLUMN "interviewType" TO interview_type;
ALTER TABLE interviews RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE interviews RENAME COLUMN "updatedAt" TO updated_at;

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
ALTER TABLE documents RENAME COLUMN "userId" TO user_id;
ALTER TABLE documents RENAME COLUMN "fileName" TO file_name;
ALTER TABLE documents RENAME COLUMN "fileUrl" TO file_url;
ALTER TABLE documents RENAME COLUMN "fileSize" TO file_size;
ALTER TABLE documents RENAME COLUMN "fileType" TO file_type;
ALTER TABLE documents RENAME COLUMN "isPublic" TO is_public;
ALTER TABLE documents RENAME COLUMN "uploadedAt" TO uploaded_at;

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
ALTER TABLE messages RENAME COLUMN "senderId" TO sender_id;
ALTER TABLE messages RENAME COLUMN "recipientId" TO recipient_id;
ALTER TABLE messages RENAME COLUMN "messageType" TO message_type;
ALTER TABLE messages RENAME COLUMN "referenceId" TO reference_id;
ALTER TABLE messages RENAME COLUMN "isRead" TO is_read;
ALTER TABLE messages RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
ALTER TABLE notifications RENAME COLUMN "userId" TO user_id;
ALTER TABLE notifications RENAME COLUMN "actionUrl" TO action_url;
ALTER TABLE notifications RENAME COLUMN "isRead" TO is_read;
ALTER TABLE notifications RENAME COLUMN "createdAt" TO created_at;

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
ALTER TABLE attendance RENAME COLUMN "employeeId" TO employee_id;
ALTER TABLE attendance RENAME COLUMN "clockIn" TO clock_in;
ALTER TABLE attendance RENAME COLUMN "clockOut" TO clock_out;
ALTER TABLE attendance RENAME COLUMN "totalHours" TO total_hours;

-- =====================================================
-- LEAVE_REQUESTS TABLE
-- =====================================================
ALTER TABLE leave_requests RENAME COLUMN "employeeId" TO employee_id;
ALTER TABLE leave_requests RENAME COLUMN "leaveType" TO leave_type;
ALTER TABLE leave_requests RENAME COLUMN "startDate" TO start_date;
ALTER TABLE leave_requests RENAME COLUMN "endDate" TO end_date;
ALTER TABLE leave_requests RENAME COLUMN "approvedBy" TO approved_by;
ALTER TABLE leave_requests RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE leave_requests RENAME COLUMN "updatedAt" TO updated_at;

-- =====================================================
-- SERVICE_CATEGORIES TABLE
-- =====================================================
ALTER TABLE service_categories RENAME COLUMN "createdAt" TO created_at;

COMMIT;

-- Rollback completed successfully
-- All columns reverted from camelCase to snake_case

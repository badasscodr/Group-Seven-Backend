-- Corrected Migration: Rename all columns to camelCase
-- Generated: 2025-10-04T22:24:55.877Z

BEGIN;

-- =====================================================
-- USERS
-- =====================================================
ALTER TABLE users RENAME COLUMN id TO "id";
ALTER TABLE users RENAME COLUMN email TO "email";
ALTER TABLE users RENAME COLUMN password_hash TO "passwordHash";
ALTER TABLE users RENAME COLUMN role TO "role";
ALTER TABLE users RENAME COLUMN first_name TO "firstName";
ALTER TABLE users RENAME COLUMN last_name TO "lastName";
ALTER TABLE users RENAME COLUMN phone TO "phone";
ALTER TABLE users RENAME COLUMN avatar_url TO "avatarUrl";
ALTER TABLE users RENAME COLUMN is_active TO "isActive";
ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE users RENAME COLUMN last_login TO "lastLogin";

-- =====================================================
-- CLIENT_PROFILES
-- =====================================================
ALTER TABLE client_profiles RENAME COLUMN id TO "id";
ALTER TABLE client_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE client_profiles RENAME COLUMN company_name TO "companyName";
ALTER TABLE client_profiles RENAME COLUMN industry TO "industry";
ALTER TABLE client_profiles RENAME COLUMN company_size TO "companySize";
ALTER TABLE client_profiles RENAME COLUMN address TO "address";
ALTER TABLE client_profiles RENAME COLUMN city TO "city";
ALTER TABLE client_profiles RENAME COLUMN country TO "country";
ALTER TABLE client_profiles RENAME COLUMN website TO "website";
ALTER TABLE client_profiles RENAME COLUMN business_license TO "businessLicense";
ALTER TABLE client_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- SUPPLIER_PROFILES
-- =====================================================
ALTER TABLE supplier_profiles RENAME COLUMN id TO "id";
ALTER TABLE supplier_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE supplier_profiles RENAME COLUMN company_name TO "companyName";
ALTER TABLE supplier_profiles RENAME COLUMN business_type TO "businessType";
ALTER TABLE supplier_profiles RENAME COLUMN license_number TO "licenseNumber";
ALTER TABLE supplier_profiles RENAME COLUMN trade_license_expiry TO "tradeLicenseExpiry";
ALTER TABLE supplier_profiles RENAME COLUMN insurance_details TO "insuranceDetails";
ALTER TABLE supplier_profiles RENAME COLUMN service_categories TO "serviceCategories";
ALTER TABLE supplier_profiles RENAME COLUMN rating TO "rating";
ALTER TABLE supplier_profiles RENAME COLUMN total_reviews TO "totalReviews";
ALTER TABLE supplier_profiles RENAME COLUMN is_verified TO "isVerified";
ALTER TABLE supplier_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- EMPLOYEE_PROFILES
-- =====================================================
ALTER TABLE employee_profiles RENAME COLUMN id TO "id";
ALTER TABLE employee_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE employee_profiles RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE employee_profiles RENAME COLUMN department TO "department";
ALTER TABLE employee_profiles RENAME COLUMN position TO "position";
ALTER TABLE employee_profiles RENAME COLUMN hire_date TO "hireDate";
ALTER TABLE employee_profiles RENAME COLUMN salary TO "salary";
ALTER TABLE employee_profiles RENAME COLUMN visa_status TO "visaStatus";
ALTER TABLE employee_profiles RENAME COLUMN visa_expiry TO "visaExpiry";
ALTER TABLE employee_profiles RENAME COLUMN passport_number TO "passportNumber";
ALTER TABLE employee_profiles RENAME COLUMN emergency_contact_name TO "emergencyContactName";
ALTER TABLE employee_profiles RENAME COLUMN emergency_contact_phone TO "emergencyContactPhone";
ALTER TABLE employee_profiles RENAME COLUMN manager_id TO "managerId";
ALTER TABLE employee_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- CANDIDATE_PROFILES
-- =====================================================
ALTER TABLE candidate_profiles RENAME COLUMN id TO "id";
ALTER TABLE candidate_profiles RENAME COLUMN user_id TO "userId";
ALTER TABLE candidate_profiles RENAME COLUMN resume_url TO "resumeUrl";
ALTER TABLE candidate_profiles RENAME COLUMN portfolio_url TO "portfolioUrl";
ALTER TABLE candidate_profiles RENAME COLUMN linkedin_url TO "linkedinUrl";
ALTER TABLE candidate_profiles RENAME COLUMN experience_years TO "experienceYears";
ALTER TABLE candidate_profiles RENAME COLUMN desired_salary_min TO "desiredSalaryMin";
ALTER TABLE candidate_profiles RENAME COLUMN desired_salary_max TO "desiredSalaryMax";
ALTER TABLE candidate_profiles RENAME COLUMN location_preference TO "locationPreference";
ALTER TABLE candidate_profiles RENAME COLUMN job_type_preference TO "jobTypePreference";
ALTER TABLE candidate_profiles RENAME COLUMN skills TO "skills";
ALTER TABLE candidate_profiles RENAME COLUMN languages TO "languages";
ALTER TABLE candidate_profiles RENAME COLUMN availability_date TO "availabilityDate";
ALTER TABLE candidate_profiles RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- SERVICE_REQUESTS
-- =====================================================
ALTER TABLE service_requests RENAME COLUMN id TO "id";
ALTER TABLE service_requests RENAME COLUMN client_id TO "clientId";
ALTER TABLE service_requests RENAME COLUMN title TO "title";
ALTER TABLE service_requests RENAME COLUMN description TO "description";
ALTER TABLE service_requests RENAME COLUMN category TO "category";
ALTER TABLE service_requests RENAME COLUMN priority TO "priority";
ALTER TABLE service_requests RENAME COLUMN status TO "status";
ALTER TABLE service_requests RENAME COLUMN budget_min TO "budgetMin";
ALTER TABLE service_requests RENAME COLUMN budget_max TO "budgetMax";
ALTER TABLE service_requests RENAME COLUMN deadline TO "deadline";
ALTER TABLE service_requests RENAME COLUMN location TO "location";
ALTER TABLE service_requests RENAME COLUMN requirements TO "requirements";
ALTER TABLE service_requests RENAME COLUMN assigned_supplier_id TO "assignedSupplierId";
ALTER TABLE service_requests RENAME COLUMN assigned_employee_id TO "assignedEmployeeId";
ALTER TABLE service_requests RENAME COLUMN created_at TO "createdAt";
ALTER TABLE service_requests RENAME COLUMN updated_at TO "updatedAt";

-- =====================================================
-- QUOTATIONS
-- =====================================================
ALTER TABLE quotations RENAME COLUMN id TO "id";
ALTER TABLE quotations RENAME COLUMN service_request_id TO "serviceRequestId";
ALTER TABLE quotations RENAME COLUMN supplier_id TO "supplierId";
ALTER TABLE quotations RENAME COLUMN amount TO "amount";
ALTER TABLE quotations RENAME COLUMN description TO "description";
ALTER TABLE quotations RENAME COLUMN estimated_duration TO "estimatedDuration";
ALTER TABLE quotations RENAME COLUMN terms_conditions TO "termsConditions";
ALTER TABLE quotations RENAME COLUMN status TO "status";
ALTER TABLE quotations RENAME COLUMN valid_until TO "validUntil";
ALTER TABLE quotations RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- JOB_POSTINGS
-- =====================================================
ALTER TABLE job_postings RENAME COLUMN id TO "id";
ALTER TABLE job_postings RENAME COLUMN title TO "title";
ALTER TABLE job_postings RENAME COLUMN description TO "description";
ALTER TABLE job_postings RENAME COLUMN company TO "company";
ALTER TABLE job_postings RENAME COLUMN location TO "location";
ALTER TABLE job_postings RENAME COLUMN job_type TO "jobType";
ALTER TABLE job_postings RENAME COLUMN experience_required TO "experienceRequired";
ALTER TABLE job_postings RENAME COLUMN salary_min TO "salaryMin";
ALTER TABLE job_postings RENAME COLUMN salary_max TO "salaryMax";
ALTER TABLE job_postings RENAME COLUMN skills_required TO "skillsRequired";
ALTER TABLE job_postings RENAME COLUMN benefits TO "benefits";
ALTER TABLE job_postings RENAME COLUMN status TO "status";
ALTER TABLE job_postings RENAME COLUMN posted_by TO "postedBy";
ALTER TABLE job_postings RENAME COLUMN application_deadline TO "applicationDeadline";
ALTER TABLE job_postings RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- JOB_APPLICATIONS
-- =====================================================
ALTER TABLE job_applications RENAME COLUMN id TO "id";
ALTER TABLE job_applications RENAME COLUMN job_id TO "jobId";
ALTER TABLE job_applications RENAME COLUMN candidate_id TO "candidateId";
ALTER TABLE job_applications RENAME COLUMN cover_letter TO "coverLetter";
ALTER TABLE job_applications RENAME COLUMN resume_url TO "resumeUrl";
ALTER TABLE job_applications RENAME COLUMN status TO "status";
ALTER TABLE job_applications RENAME COLUMN applied_at TO "appliedAt";

-- =====================================================
-- INTERVIEWS
-- =====================================================
ALTER TABLE interviews RENAME COLUMN id TO "id";
ALTER TABLE interviews RENAME COLUMN application_id TO "applicationId";
ALTER TABLE interviews RENAME COLUMN scheduled_date TO "scheduledDate";
ALTER TABLE interviews RENAME COLUMN duration TO "duration";
ALTER TABLE interviews RENAME COLUMN interview_type TO "interviewType";
ALTER TABLE interviews RENAME COLUMN location TO "location";
ALTER TABLE interviews RENAME COLUMN interviewer_id TO "interviewerId";
ALTER TABLE interviews RENAME COLUMN status TO "status";
ALTER TABLE interviews RENAME COLUMN notes TO "notes";
ALTER TABLE interviews RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- DOCUMENTS
-- =====================================================
ALTER TABLE documents RENAME COLUMN id TO "id";
ALTER TABLE documents RENAME COLUMN user_id TO "userId";
ALTER TABLE documents RENAME COLUMN filename TO "filename";
ALTER TABLE documents RENAME COLUMN original_name TO "originalName";
ALTER TABLE documents RENAME COLUMN file_url TO "fileUrl";
ALTER TABLE documents RENAME COLUMN file_size TO "fileSize";
ALTER TABLE documents RENAME COLUMN mime_type TO "mimeType";
ALTER TABLE documents RENAME COLUMN category TO "category";
ALTER TABLE documents RENAME COLUMN is_public TO "isPublic";
ALTER TABLE documents RENAME COLUMN uploaded_at TO "uploadedAt";

-- =====================================================
-- MESSAGES
-- =====================================================
ALTER TABLE messages RENAME COLUMN id TO "id";
ALTER TABLE messages RENAME COLUMN sender_id TO "senderId";
ALTER TABLE messages RENAME COLUMN recipient_id TO "recipientId";
ALTER TABLE messages RENAME COLUMN subject TO "subject";
ALTER TABLE messages RENAME COLUMN content TO "content";
ALTER TABLE messages RENAME COLUMN is_read TO "isRead";
ALTER TABLE messages RENAME COLUMN message_type TO "messageType";
ALTER TABLE messages RENAME COLUMN reference_id TO "referenceId";
ALTER TABLE messages RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
ALTER TABLE notifications RENAME COLUMN id TO "id";
ALTER TABLE notifications RENAME COLUMN user_id TO "userId";
ALTER TABLE notifications RENAME COLUMN title TO "title";
ALTER TABLE notifications RENAME COLUMN content TO "content";
ALTER TABLE notifications RENAME COLUMN type TO "type";
ALTER TABLE notifications RENAME COLUMN is_read TO "isRead";
ALTER TABLE notifications RENAME COLUMN action_url TO "actionUrl";
ALTER TABLE notifications RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- ATTENDANCE
-- =====================================================
ALTER TABLE attendance RENAME COLUMN id TO "id";
ALTER TABLE attendance RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE attendance RENAME COLUMN date TO "date";
ALTER TABLE attendance RENAME COLUMN check_in TO "checkIn";
ALTER TABLE attendance RENAME COLUMN check_out TO "checkOut";
ALTER TABLE attendance RENAME COLUMN break_duration TO "breakDuration";
ALTER TABLE attendance RENAME COLUMN total_hours TO "totalHours";
ALTER TABLE attendance RENAME COLUMN status TO "status";
ALTER TABLE attendance RENAME COLUMN notes TO "notes";
ALTER TABLE attendance RENAME COLUMN created_at TO "createdAt";

-- =====================================================
-- LEAVE_REQUESTS
-- =====================================================
ALTER TABLE leave_requests RENAME COLUMN id TO "id";
ALTER TABLE leave_requests RENAME COLUMN employee_id TO "employeeId";
ALTER TABLE leave_requests RENAME COLUMN leave_type TO "leaveType";
ALTER TABLE leave_requests RENAME COLUMN start_date TO "startDate";
ALTER TABLE leave_requests RENAME COLUMN end_date TO "endDate";
ALTER TABLE leave_requests RENAME COLUMN days_requested TO "daysRequested";
ALTER TABLE leave_requests RENAME COLUMN reason TO "reason";
ALTER TABLE leave_requests RENAME COLUMN status TO "status";
ALTER TABLE leave_requests RENAME COLUMN approved_by TO "approvedBy";
ALTER TABLE leave_requests RENAME COLUMN approved_at TO "approvedAt";
ALTER TABLE leave_requests RENAME COLUMN created_at TO "createdAt";

COMMIT;

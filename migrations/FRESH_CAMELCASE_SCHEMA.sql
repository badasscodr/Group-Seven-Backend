-- =====================================================
-- COMPLETE DATABASE SCHEMA - CAMELCASE WITH QUOTED IDENTIFIERS
-- =====================================================
-- Created: 2025-10-05
-- Purpose: Full schema with consistent camelCase naming
-- Convention: ALL column names use "camelCase" with quotes
-- =====================================================

BEGIN;

-- =====================================================
-- CUSTOM TYPES (ENUMS)
-- =====================================================

CREATE TYPE userRoleEnum AS ENUM ('admin', 'client', 'supplier', 'employee', 'candidate');
CREATE TYPE priorityEnum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE requestStatusEnum AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE quotationStatusEnum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE documentCategoryEnum AS ENUM ('resume', 'certificate', 'license', 'contract', 'invoice', 'passport', 'visa', 'insurance', 'other');
CREATE TYPE messageTypeEnum AS ENUM ('direct', 'service_request', 'job_application', 'system');
CREATE TYPE notificationTypeEnum AS ENUM ('message', 'application', 'interview', 'payment', 'document', 'system', 'reminder');
CREATE TYPE attendanceStatusEnum AS ENUM ('present', 'absent', 'late', 'half_day', 'holiday');
CREATE TYPE leaveTypeEnum AS ENUM ('annual', 'sick', 'emergency', 'maternity', 'paternity');
CREATE TYPE leaveStatusEnum AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE jobTypeEnum AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE jobStatusEnum AS ENUM ('draft', 'published', 'closed', 'cancelled');
CREATE TYPE applicationStatusEnum AS ENUM ('applied', 'screening', 'interview', 'hired', 'rejected');
CREATE TYPE interviewStatusEnum AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE assignmentStatusEnum AS ENUM ('assigned', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE assignment_priorityEnum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE visaTypeEnum AS ENUM ('tourist', 'work', 'student', 'business', 'transit', 'residence', 'family', 'medical', 'diplomatic', 'other');
CREATE TYPE visaStatusEnum AS ENUM ('active', 'expired', 'expiring_soon', 'expiring_critical', 'pending', 'cancelled', 'renewal_required');
CREATE TYPE visaNotificationType AS ENUM ('email', 'system', 'both');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users table (central authentication)
CREATE TABLE users (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" userRoleEnum NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "emailVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP,
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMP
);

-- Client profiles
CREATE TABLE client_profiles (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "companyName" VARCHAR(255),
    "industry" VARCHAR(100),
    "companySize" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "website" VARCHAR(255),
    "businessLicense" VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier profiles
CREATE TABLE supplier_profiles (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "companyName" VARCHAR(255) NOT NULL,
    "businessType" VARCHAR(100),
    "licenseNumber" VARCHAR(100),
    "tradeLicenseExpiry" DATE,
    "insuranceDetails" TEXT,
    "serviceCategories" TEXT[],
    "rating" DECIMAL(3,2) DEFAULT 0.00,
    "totalReviews" INTEGER DEFAULT 0,
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee profiles
CREATE TABLE employee_profiles (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "employeeId" VARCHAR(50) UNIQUE,
    "department" VARCHAR(100),
    "position" VARCHAR(100),
    "hireDate" DATE,
    "salary" DECIMAL(10,2),
    "visaStatus" VARCHAR(50),
    "visaExpiry" DATE,
    "passportNumber" VARCHAR(50),
    "emergencyContactName" VARCHAR(255),
    "emergencyContactPhone" VARCHAR(20),
    "managerId" UUID REFERENCES users("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate profiles
CREATE TABLE candidate_profiles (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "resumeUrl" TEXT,
    "portfolioUrl" TEXT,
    "linkedinUrl" TEXT,
    "experienceYears" INTEGER,
    "desiredSalaryMin" DECIMAL(10,2),
    "desiredSalaryMax" DECIMAL(10,2),
    "locationPreference" VARCHAR(100),
    "jobTypePreference" VARCHAR(50),
    "skills" TEXT[],
    "languages" TEXT[],
    "availabilityDate" DATE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVICE MANAGEMENT TABLES
-- =====================================================

-- Service categories
CREATE TABLE service_categories (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT,
    "icon" VARCHAR(50),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service requests
CREATE TABLE service_requests (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID REFERENCES users("id") NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "priority" priorityEnum DEFAULT 'medium',
    "status" requestStatusEnum DEFAULT 'draft',
    "budgetMin" DECIMAL(10,2),
    "budgetMax" DECIMAL(10,2),
    "deadline" DATE,
    "location" VARCHAR(255),
    "requirements" TEXT,
    "assignedSupplierId" UUID REFERENCES users("id"),
    "assignedEmployeeId" UUID REFERENCES users("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotations
CREATE TABLE quotations (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceRequestId" UUID REFERENCES service_requests("id") NOT NULL,
    "supplierId" UUID REFERENCES users("id") NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "estimatedDuration" VARCHAR(100),
    "termsConditions" TEXT,
    "status" quotationStatusEnum DEFAULT 'pending',
    "validUntil" DATE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENT MANAGEMENT
-- =====================================================

CREATE TABLE payments (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quotationId" UUID REFERENCES quotations("id") ON DELETE CASCADE,
    "supplierId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "clientId" UUID REFERENCES users("id") ON DELETE CASCADE,
    "amount" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'USD',
    "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'processing', 'paid', 'rejected', 'cancelled')),
    "paymentMethod" VARCHAR(50),
    "paymentDate" TIMESTAMP,
    "dueDate" DATE,
    "invoiceNumber" VARCHAR(100),
    "notes" TEXT,
    "approvedBy" UUID REFERENCES users("id"),
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- JOB MANAGEMENT TABLES
-- =====================================================

-- Job postings
CREATE TABLE job_postings (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "company" VARCHAR(255),
    "location" VARCHAR(255),
    "jobType" jobTypeEnum NOT NULL,
    "experienceRequired" INTEGER,
    "salaryMin" DECIMAL(12, 2),
    "salaryMax" DECIMAL(12, 2),
    "skillsRequired" TEXT[],
    "benefits" TEXT[],
    "status" jobStatusEnum DEFAULT 'draft',
    "postedBy" UUID REFERENCES users("id") ON DELETE SET NULL,
    "applicationDeadline" DATE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job applications
CREATE TABLE job_applications (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "jobId" UUID REFERENCES job_postings("id") ON DELETE CASCADE NOT NULL,
    "candidateId" UUID REFERENCES users("id") ON DELETE CASCADE NOT NULL,
    "coverLetter" TEXT,
    "resumeUrl" TEXT,
    "status" applicationStatusEnum DEFAULT 'applied',
    "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("jobId", "candidateId")
);

-- Interviews
CREATE TABLE interviews (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "applicationId" UUID REFERENCES job_applications("id") ON DELETE CASCADE NOT NULL,
    "scheduledDate" TIMESTAMP NOT NULL,
    "duration" INTEGER DEFAULT 60,
    "interviewType" VARCHAR(50),
    "location" VARCHAR(255),
    "interviewerId" UUID REFERENCES users("id") ON DELETE SET NULL,
    "status" interviewStatusEnum DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EMPLOYEE MANAGEMENT TABLES
-- =====================================================

-- Attendance
CREATE TABLE attendance (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" UUID REFERENCES users("id") NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP,
    "checkOut" TIMESTAMP,
    "breakDuration" INTEGER DEFAULT 0,
    "totalHours" DECIMAL(4,2),
    "status" attendanceStatusEnum DEFAULT 'present',
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("employeeId", "date")
);

-- Leave requests
CREATE TABLE leave_requests (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" UUID REFERENCES users("id") NOT NULL,
    "leaveType" leaveTypeEnum NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "daysRequested" INTEGER NOT NULL,
    "reason" TEXT,
    "status" leaveStatusEnum DEFAULT 'pending',
    "approvedBy" UUID REFERENCES users("id"),
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DOCUMENT MANAGEMENT
-- =====================================================

CREATE TABLE documents (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "category" documentCategoryEnum,
    "isPublic" BOOLEAN DEFAULT false,
    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Messages
CREATE TABLE messages (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "senderId" UUID REFERENCES users("id") NOT NULL,
    "recipientId" UUID REFERENCES users("id") NOT NULL,
    "subject" VARCHAR(255),
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "messageType" messageTypeEnum DEFAULT 'direct',
    "referenceId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users("id") NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" notificationTypeEnum NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROJECT & ASSIGNMENT MANAGEMENT
-- =====================================================

-- Projects
CREATE TABLE projects (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "clientId" UUID REFERENCES users("id"),
    "projectManagerId" UUID REFERENCES users("id"),
    "startDate" DATE,
    "endDate" DATE,
    "budget" DECIMAL(12,2),
    "status" assignmentStatusEnum DEFAULT 'assigned',
    "priority" assignment_priorityEnum DEFAULT 'medium',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee assignments
CREATE TABLE employee_assignments (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL REFERENCES users("id"),
    "projectId" UUID NOT NULL REFERENCES projects("id"),
    "roleInProject" VARCHAR(100),
    "assignedBy" UUID REFERENCES users("id"),
    "startDate" DATE,
    "endDate" DATE,
    "hoursAllocated" INTEGER,
    "status" assignmentStatusEnum DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task assignments
CREATE TABLE task_assignments (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "assignmentId" UUID NOT NULL REFERENCES employee_assignments("id"),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dueDate" DATE,
    "status" assignmentStatusEnum DEFAULT 'assigned',
    "priority" assignment_priorityEnum DEFAULT 'medium',
    "estimatedHours" DECIMAL(5,2),
    "actualHours" DECIMAL(5,2),
    "completionPercentage" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VISA MANAGEMENT
-- =====================================================

-- Visa documents
CREATE TABLE visa_documents (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    "documentId" UUID NOT NULL REFERENCES documents("id") ON DELETE CASCADE,
    "visaType" visaTypeEnum NOT NULL,
    "visaNumber" VARCHAR(100) NOT NULL,
    "issuedDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "issuingCountry" VARCHAR(100) NOT NULL,
    "status" visaStatusEnum NOT NULL DEFAULT 'active',
    "notificationsSent" INTEGER DEFAULT 0,
    "lastNotificationDate" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visa_expiry_after_issued" CHECK ("expiryDate" > "issuedDate"),
    CONSTRAINT "unique_document_visa" UNIQUE ("documentId")
);

-- Visa notifications
CREATE TABLE visa_notifications (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    "visaId" UUID NOT NULL REFERENCES visa_documents("id") ON DELETE CASCADE,
    "notificationType" visaNotificationType NOT NULL,
    "daysBeforeExpiry" INTEGER NOT NULL,
    "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('sent', 'failed', 'pending')),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX "idx_users_email" ON users("email");
CREATE INDEX "idx_users_role" ON users("role");
CREATE INDEX "idx_users_isActive" ON users("isActive");

-- Service requests indexes
CREATE INDEX "idx_service_requests_clientId" ON service_requests("clientId");
CREATE INDEX "idx_service_requests_status" ON service_requests("status");
CREATE INDEX "idx_service_requests_category" ON service_requests("category");
CREATE INDEX "idx_service_requests_createdAt" ON service_requests("createdAt");

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
CREATE INDEX "idx_job_postings_status" ON job_postings("status");
CREATE INDEX "idx_job_postings_postedBy" ON job_postings("postedBy");
CREATE INDEX "idx_job_postings_jobType" ON job_postings("jobType");
CREATE INDEX "idx_job_postings_createdAt" ON job_postings("createdAt");

-- Job applications indexes
CREATE INDEX "idx_job_applications_jobId" ON job_applications("jobId");
CREATE INDEX "idx_job_applications_candidateId" ON job_applications("candidateId");
CREATE INDEX "idx_job_applications_status" ON job_applications("status");

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
CREATE INDEX "idx_employee_assignments_employeeId" ON employee_assignments("employeeId");
CREATE INDEX "idx_employee_assignments_projectId" ON employee_assignments("projectId");

-- Visa documents indexes
CREATE INDEX "idx_visa_documents_userId" ON visa_documents("userId");
CREATE INDEX "idx_visa_documents_expiryDate" ON visa_documents("expiryDate");
CREATE INDEX "idx_visa_documents_status" ON visa_documents("status");

COMMIT;

-- Success message
SELECT 'All tables created successfully with camelCase naming convention.' AS status;

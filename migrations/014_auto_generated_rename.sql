-- =====================================================
-- RENAME ALL CONSTRAINTS AND INDEXES TO CAMELCASE (AUTO-GENERATED)
-- =====================================================

BEGIN;

-- =====================================================
-- RENAME CONSTRAINTS
-- =====================================================

ALTER TABLE "clientProfiles" RENAME CONSTRAINT "client_profiles_pkey" TO "clientProfilesPkey";
ALTER TABLE "clientProfiles" RENAME CONSTRAINT "client_profiles_userId_fkey" TO "clientProfilesUserIdFkey";
ALTER TABLE "supplierProfiles" RENAME CONSTRAINT "supplier_profiles_pkey" TO "supplierProfilesPkey";
ALTER TABLE "supplierProfiles" RENAME CONSTRAINT "supplier_profiles_userId_fkey" TO "supplierProfilesUserIdFkey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT "employee_profiles_employeeId_key" TO "employeeProfilesEmployeeIdKey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT "employee_profiles_managerId_fkey" TO "employeeProfilesManagerIdFkey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT "employee_profiles_pkey" TO "employeeProfilesPkey";
ALTER TABLE "employeeProfiles" RENAME CONSTRAINT "employee_profiles_userId_fkey" TO "employeeProfilesUserIdFkey";
ALTER TABLE "candidateProfiles" RENAME CONSTRAINT "candidate_profiles_pkey" TO "candidateProfilesPkey";
ALTER TABLE "candidateProfiles" RENAME CONSTRAINT "candidate_profiles_userId_fkey" TO "candidateProfilesUserIdFkey";
ALTER TABLE "serviceCategories" RENAME CONSTRAINT "service_categories_name_key" TO "serviceCategoriesNameKey";
ALTER TABLE "serviceCategories" RENAME CONSTRAINT "service_categories_pkey" TO "serviceCategoriesPkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT "service_requests_assignedEmployeeId_fkey" TO "serviceRequestsAssignedEmployeeIdFkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT "service_requests_assignedSupplierId_fkey" TO "serviceRequestsAssignedSupplierIdFkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT "service_requests_clientId_fkey" TO "serviceRequestsClientIdFkey";
ALTER TABLE "serviceRequests" RENAME CONSTRAINT "service_requests_pkey" TO "serviceRequestsPkey";
ALTER TABLE "jobPostings" RENAME CONSTRAINT "job_postings_pkey" TO "jobPostingsPkey";
ALTER TABLE "jobPostings" RENAME CONSTRAINT "job_postings_postedBy_fkey" TO "jobPostingsPostedByFkey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT "job_applications_candidateId_fkey" TO "jobApplicationsCandidateIdFkey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT "job_applications_jobId_candidateId_key" TO "jobApplicationsJobIdCandidateIdKey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT "job_applications_jobId_fkey" TO "jobApplicationsJobIdFkey";
ALTER TABLE "jobApplications" RENAME CONSTRAINT "job_applications_pkey" TO "jobApplicationsPkey";
ALTER TABLE "leaveRequests" RENAME CONSTRAINT "leave_requests_approvedBy_fkey" TO "leaveRequestsApprovedByFkey";
ALTER TABLE "leaveRequests" RENAME CONSTRAINT "leave_requests_employeeId_fkey" TO "leaveRequestsEmployeeIdFkey";
ALTER TABLE "leaveRequests" RENAME CONSTRAINT "leave_requests_pkey" TO "leaveRequestsPkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT "employee_assignments_assignedBy_fkey" TO "employeeAssignmentsAssignedByFkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT "employee_assignments_employeeId_fkey" TO "employeeAssignmentsEmployeeIdFkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT "employee_assignments_pkey" TO "employeeAssignmentsPkey";
ALTER TABLE "employeeAssignments" RENAME CONSTRAINT "employee_assignments_projectId_fkey" TO "employeeAssignmentsProjectIdFkey";
ALTER TABLE "taskAssignments" RENAME CONSTRAINT "task_assignments_assignmentId_fkey" TO "taskAssignmentsAssignmentIdFkey";
ALTER TABLE "taskAssignments" RENAME CONSTRAINT "task_assignments_pkey" TO "taskAssignmentsPkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT "unique_document_visa" TO "uniqueDocumentVisa";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT "visa_documents_documentId_fkey" TO "visaDocumentsDocumentIdFkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT "visa_documents_pkey" TO "visaDocumentsPkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT "visa_documents_userId_fkey" TO "visaDocumentsUserIdFkey";
ALTER TABLE "visaDocuments" RENAME CONSTRAINT "visa_expiry_after_issued" TO "visaExpiryAfterIssued";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT "visa_notifications_pkey" TO "visaNotificationsPkey";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT "visa_notifications_status_check" TO "visaNotificationsStatusCheck";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT "visa_notifications_userId_fkey" TO "visaNotificationsUserIdFkey";
ALTER TABLE "visaNotifications" RENAME CONSTRAINT "visa_notifications_visaId_fkey" TO "visaNotificationsVisaIdFkey";

-- =====================================================
-- RENAME INDEXES
-- =====================================================

ALTER INDEX "idx_attendance_date" RENAME TO "idxAttendanceDate";
ALTER INDEX "idx_attendance_employeeId" RENAME TO "idxAttendanceEmployeeId";
ALTER INDEX "idx_documents_category" RENAME TO "idxDocumentsCategory";
ALTER INDEX "idx_documents_userId" RENAME TO "idxDocumentsUserId";
ALTER INDEX "idx_employee_assignments_employeeId" RENAME TO "idxEmployeeAssignmentsEmployeeId";
ALTER INDEX "idx_employee_assignments_projectId" RENAME TO "idxEmployeeAssignmentsProjectId";
ALTER INDEX "idx_job_applications_candidateId" RENAME TO "idxJobApplicationsCandidateId";
ALTER INDEX "idx_job_applications_jobId" RENAME TO "idxJobApplicationsJobId";
ALTER INDEX "idx_job_applications_status" RENAME TO "idxJobApplicationsStatus";
ALTER INDEX "idx_job_postings_createdAt" RENAME TO "idxJobPostingsCreatedAt";
ALTER INDEX "idx_job_postings_jobType" RENAME TO "idxJobPostingsJobType";
ALTER INDEX "idx_job_postings_postedBy" RENAME TO "idxJobPostingsPostedBy";
ALTER INDEX "idx_job_postings_status" RENAME TO "idxJobPostingsStatus";
ALTER INDEX "idx_messages_isRead" RENAME TO "idxMessagesIsRead";
ALTER INDEX "idx_messages_recipientId" RENAME TO "idxMessagesRecipientId";
ALTER INDEX "idx_messages_senderId" RENAME TO "idxMessagesSenderId";
ALTER INDEX "idx_notifications_isRead" RENAME TO "idxNotificationsIsRead";
ALTER INDEX "idx_notifications_userId" RENAME TO "idxNotificationsUserId";
ALTER INDEX "idx_payments_clientId" RENAME TO "idxPaymentsClientId";
ALTER INDEX "idx_payments_dueDate" RENAME TO "idxPaymentsDueDate";
ALTER INDEX "idx_payments_quotationId" RENAME TO "idxPaymentsQuotationId";
ALTER INDEX "idx_payments_status" RENAME TO "idxPaymentsStatus";
ALTER INDEX "idx_payments_supplierId" RENAME TO "idxPaymentsSupplierId";
ALTER INDEX "idx_projects_clientId" RENAME TO "idxProjectsClientId";
ALTER INDEX "idx_projects_status" RENAME TO "idxProjectsStatus";
ALTER INDEX "idx_quotations_serviceRequestId" RENAME TO "idxQuotationsServiceRequestId";
ALTER INDEX "idx_quotations_status" RENAME TO "idxQuotationsStatus";
ALTER INDEX "idx_quotations_supplierId" RENAME TO "idxQuotationsSupplierId";
ALTER INDEX "idx_service_requests_category" RENAME TO "idxServiceRequestsCategory";
ALTER INDEX "idx_service_requests_clientId" RENAME TO "idxServiceRequestsClientId";
ALTER INDEX "idx_service_requests_createdAt" RENAME TO "idxServiceRequestsCreatedAt";
ALTER INDEX "idx_service_requests_status" RENAME TO "idxServiceRequestsStatus";
ALTER INDEX "idx_users_email" RENAME TO "idxUsersEmail";
ALTER INDEX "idx_users_isActive" RENAME TO "idxUsersIsActive";
ALTER INDEX "idx_users_role" RENAME TO "idxUsersRole";
ALTER INDEX "idx_visa_documents_expiryDate" RENAME TO "idxVisaDocumentsExpiryDate";
ALTER INDEX "idx_visa_documents_status" RENAME TO "idxVisaDocumentsStatus";
ALTER INDEX "idx_visa_documents_userId" RENAME TO "idxVisaDocumentsUserId";

COMMIT;

SELECT 'All constraints and indexes renamed to camelCase successfully.' AS status;

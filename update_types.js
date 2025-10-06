const fs = require('fs');
const path = require('path');

// Map of snake_case to camelCase for type properties
const typeMappings = {
  // Common fields
  'first_name': 'firstName',
  'last_name': 'lastName',
  'password_hash': 'passwordHash',
  'user_id': 'userId',
  'client_id': 'clientId',
  'supplier_id': 'supplierId',
  'employee_id': 'employeeId',
  'candidate_id': 'candidateId',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'is_active': 'isActive',
  'is_verified': 'isVerified',
  'avatar_url': 'avatarUrl',

  // Service requests
  'budget_min': 'budgetMin',
  'budget_max': 'budgetMax',
  'start_date': 'startDate',
  'end_date': 'endDate',
  'due_date': 'dueDate',

  // Profile fields
  'company_name': 'companyName',
  'company_size': 'companySize',
  'business_type': 'businessType',
  'business_license': 'businessLicense',
  'license_number': 'licenseNumber',
  'service_categories': 'serviceCategories',
  'total_reviews': 'totalReviews',

  // Job fields
  'job_type': 'jobType',
  'job_id': 'jobId',
  'cover_letter': 'coverLetter',
  'resume_url': 'resumeUrl',
  'scheduled_date': 'scheduledDate',
  'interview_type': 'interviewType',

  // Payment fields
  'payment_method': 'paymentMethod',
  'quotation_id': 'quotationId',
  'invoice_number': 'invoiceNumber',
  'approved_by': 'approvedBy',
  'approved_at': 'approvedAt',

  // Leave fields
  'leave_type': 'leaveType',
  'leave_id': 'leaveId',
  'hire_date': 'hireDate',
  'manager_id': 'managerId',

  // Document fields
  'document_id': 'documentId',
  'file_url': 'fileUrl',
  'file_size': 'fileSize',
  'mime_type': 'mimeType',
  'original_name': 'originalName',

  // Other fields
  'project_id': 'projectId',
  'service_request_id': 'serviceRequestId',
  'task_id': 'taskId',
  'project_manager_id': 'projectManagerId',
  'role_in_project': 'roleInProject',
  'hours_allocated': 'hoursAllocated',
  'assignment_id': 'assignmentId',
  'estimated_hours': 'estimatedHours',
  'actual_hours': 'actualHours',
  'completion_percentage': 'completionPercentage',
};

const filesToUpdate = [
  'src/modules/assignments/assignment.types.ts',
  'src/modules/payments/payment.types.ts',
  'src/modules/client/client.types.ts',
  'src/modules/supplier/supplier.types.ts',
  'src/modules/jobs/job.types.ts',
  'src/modules/employee/employee.types.ts',
  'src/modules/auth/auth.types.ts',
  'src/modules/users/users.types.ts',
  'src/modules/documents/documents.types.ts',
  'src/modules/shared/messages/messages.types.ts',
  'src/modules/visa/visa.types.ts',
  'src/modules/admin/admin.types.ts',
];

let totalChanges = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  // Update interface/type property names
  Object.entries(typeMappings).forEach(([snakeCase, camelCase]) => {
    // Match property declarations in interfaces/types
    // Handles: property_name?: type, property_name: type, property_name?:type, etc.
    const propertyPattern = new RegExp(`(^|\\s|\\{)${snakeCase}(\\??\\s*:\\s*)`, 'gm');
    const matches = content.match(propertyPattern);
    if (matches) {
      fileChanges += matches.length;
      content = content.replace(propertyPattern, `$1${camelCase}$2`);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${file}: ${fileChanges} changes`);
    totalChanges += fileChanges;
  } else {
    console.log(`✓ ${file}: No changes needed`);
  }
});

console.log(`\n🎉 Total changes: ${totalChanges}`);

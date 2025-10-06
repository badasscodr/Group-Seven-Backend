// Automated SQL Query Updater - Converts snake_case to camelCase in SQL queries
// Run with: node migrations/update_sql_queries.js

const fs = require('fs');
const path = require('path');

// Map of snake_case -> camelCase conversions
const replacements = {
  // User table
  'first_name': '"firstName"',
  'last_name': '"lastName"',
  'password_hash': '"passwordHash"',
  'avatar_url': '"avatarUrl"',
  'is_active': '"isActive"',
  'email_verified': '"emailVerified"',
  'created_at': '"createdAt"',
  'updated_at': '"updatedAt"',
  'last_login': '"lastLogin"',

  // Foreign keys
  'user_id': '"userId"',
  'client_id': '"clientId"',
  'supplier_id': '"supplierId"',
  'employee_id': '"employeeId"',
  'candidate_id': '"candidateId"',
  'posted_by': '"postedBy"',
  'assigned_to': '"assignedTo"',
  'approved_by': '"approvedBy"',
  'manager_id': '"managerId"',

  // Profile tables
  'company_name': '"companyName"',
  'company_size': '"companySize"',
  'business_type': '"businessType"',
  'business_license': '"businessLicense"',
  'license_number': '"licenseNumber"',
  'service_categories': '"serviceCategories"',
  'total_reviews': '"totalReviews"',
  'is_verified': '"isVerified"',
  'trade_license_expiry': '"tradeLicenseExpiry"',
  'insurance_details': '"insuranceDetails"',

  // Service requests & quotations
  'service_request_id': '"serviceRequestId"',
  'budget_min': '"budgetMin"',
  'budget_max': '"budgetMax"',
  'required_date': '"requiredDate"',
  'category_id': '"categoryId"',
  'quoted_price': '"quotedPrice"',
  'delivery_time': '"deliveryTime"',
  'validity_date': '"validityDate"',

  // Jobs
  'job_id': '"jobId"',
  'job_type': '"jobType"',
  'experience_required': '"experienceRequired"',
  'salary_min': '"salaryMin"',
  'salary_max': '"salaryMax"',
  'skills_required': '"skillsRequired"',
  'application_deadline': '"applicationDeadline"',
  'cover_letter': '"coverLetter"',
  'resume_url': '"resumeUrl"',
  'applied_at': '"appliedAt"',
  'application_id': '"applicationId"',
  'scheduled_date': '"scheduledDate"',
  'interview_type': '"interviewType"',

  // Employee
  'hire_date': '"hireDate"',
  'visa_status': '"visaStatus"',
  'visa_expiry': '"visaExpiry"',
  'passport_number': '"passportNumber"',
  'emergency_contact_name': '"emergencyContactName"',
  'emergency_contact_phone': '"emergencyContactPhone"',
  'clock_in': '"clockIn"',
  'clock_out': '"clockOut"',
  'total_hours': '"totalHours"',
  'leave_type': '"leaveType"',
  'start_date': '"startDate"',
  'end_date': '"endDate"',

  // Candidate
  'portfolio_url': '"portfolioUrl"',
  'linkedin_url': '"linkedinUrl"',
  'experience_years': '"experienceYears"',
  'desired_salary_min': '"desiredSalaryMin"',
  'desired_salary_max': '"desiredSalaryMax"',
  'location_preference': '"locationPreference"',
  'job_type_preference': '"jobTypePreference"',
  'availability_date': '"availabilityDate"',

  // Documents
  'file_name': '"fileName"',
  'file_url': '"fileUrl"',
  'file_size': '"fileSize"',
  'file_type': '"fileType"',
  'is_public': '"isPublic"',
  'uploaded_at': '"uploadedAt"',

  // Messages
  'sender_id': '"senderId"',
  'recipient_id': '"recipientId"',
  'message_type': '"messageType"',
  'reference_id': '"referenceId"',
  'is_read': '"isRead"',

  // Notifications
  'action_url': '"actionUrl"',

  // Payments
  'payment_method': '"paymentMethod"',
  'payment_date': '"paymentDate"',
  'transaction_id': '"transactionId"',
};

// Files to update
const filesToUpdate = [
  'src/modules/admin/admin.service.ts',
  'src/modules/client/client.service.ts',
  'src/modules/supplier/supplier.service.ts',
  'src/modules/employee/employee.service.ts',
  'src/modules/documents/documents.service.ts',
  'src/modules/shared/messages/messages.service.ts',
  'src/modules/assignments/assignment.service.ts',
  'src/modules/jobs/job.service.ts',
  'src/modules/payments/payment.service.ts',
  'src/modules/visa/visa.service.ts',
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping (not found): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changeCount = 0;

  // Apply all replacements
  for (const [snakeCase, camelCase] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${snakeCase}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(regex, camelCase);
    }
  }

  // Also update JavaScript object destructuring (e.g., password_hash in result.rows[0])
  content = content.replace(/\.password_hash\b/g, '.passwordHash');
  content = content.replace(/{ password_hash/g, '{ passwordHash');

  // Save updated content
  fs.writeFileSync(fullPath, content, 'utf8');

  console.log(`✅ Updated: ${filePath} (${changeCount} changes)`);
}

console.log('🚀 Starting SQL query updates...\n');

filesToUpdate.forEach(file => {
  try {
    updateFile(file);
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

console.log('\n✅ All files updated!');
console.log('\nNext steps:');
console.log('1. Run: npm run build');
console.log('2. Run migration: psql -U postgres -d group_seven_db -f migrations/011_rename_to_camelCase.sql');
console.log('3. Start backend: npm start');
console.log('4. Test all endpoints');

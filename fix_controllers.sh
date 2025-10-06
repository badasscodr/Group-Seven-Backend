#!/bin/bash

# Fix job.controller.ts
sed -i "s/job_type:/jobType:/g" "src/modules/jobs/job.controller.ts"
sed -i "s/job_id:/jobId:/g" "src/modules/jobs/job.controller.ts"

# Fix supplier.controller.ts
sed -i "s/budget_min:/budgetMin:/g" "src/modules/supplier/supplier.controller.ts"
sed -i "s/budget_max:/budgetMax:/g" "src/modules/supplier/supplier.controller.ts"

# Fix assignments/assignment.service.ts
sed -i "s/project_id,/projectId,/g" "src/modules/assignments/assignment.service.ts"
sed -i "s/due_date,/dueDate,/g" "src/modules/assignments/assignment.service.ts"

echo "✅ Controller files fixed"

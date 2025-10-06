import pool from '../../core/config/database';
import {
  Project,
  EmployeeAssignment,
  TaskAssignment,
  CreateProjectData,
  CreateAssignmentData,
  CreateTaskData
} from './assignment.types';

// Project Management
export const getAllProjects = async (): Promise<Project[]> => {
  const result = await pool.query(`
    SELECT p.*,
           u1."firstName" || ' ' || u1."lastName" AS "clientName",
           u2."firstName" || ' ' || u2."lastName" AS "managerName"
    FROM projects p
    LEFT JOIN users u1 ON p."clientId" = u1."id"
    LEFT JOIN users u2 ON p."projectManagerId" = u2."id"
    ORDER BY p."createdAt" DESC
  `);

  return result.rows;
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const result = await pool.query(`
    SELECT p.*,
           u1."firstName" || ' ' || u1."lastName" AS "clientName",
           u2."firstName" || ' ' || u2."lastName" AS "managerName"
    FROM projects p
    LEFT JOIN users u1 ON p."clientId" = u1."id"
    LEFT JOIN users u2 ON p."projectManagerId" = u2."id"
    WHERE p."id" = $1
  `, [projectId]);

  return result.rows[0] || null;
};

export const createProject = async (projectData: CreateProjectData, createdBy: string): Promise<Project> => {
  const {
    title,
    description,
    clientId,
    projectManagerId,
    startDate,
    endDate,
    budget,
    priority = 'medium'
  } = projectData;

  const result = await pool.query(`
    INSERT INTO projects (
      "title", "description", "clientId", "projectManagerId",
      "startDate", "endDate", "budget", "priority"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [title, description, clientId, projectManagerId, startDate, endDate, budget, priority]);

  return result.rows[0];
};

export const updateProject = async (projectId: string, updateData: Partial<CreateProjectData>): Promise<Project> => {
  const fields = Object.keys(updateData).filter(key => updateData[key as keyof CreateProjectData] !== undefined);
  const values = fields.map(key => updateData[key as keyof CreateProjectData]);

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

  const result = await pool.query(`
    UPDATE projects
    SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = $1
    RETURNING *
  `, [projectId, ...values]);

  if (result.rows.length === 0) {
    throw new Error('Project not found');
  }

  return result.rows[0];
};

// Employee Assignment Management
export const getAllAssignments = async (): Promise<EmployeeAssignment[]> => {
  const result = await pool.query(`
    SELECT
      ea.*,
      p."title" AS "projectTitle",
      p."description" AS "projectDescription",
      p."status" AS "projectStatus",
      p."priority" AS "projectPriority",
      p."startDate" AS "projectStartDate",
      p."endDate" AS "projectEndDate",
      u1."firstName" || ' ' || u1."lastName" AS "employeeName",
      u2."firstName" || ' ' || u2."lastName" AS "assignedByName"
    FROM "employeeAssignments" ea
    JOIN projects p ON ea."projectId" = p."id"
    JOIN users u1 ON ea."employeeId" = u1."id"
    LEFT JOIN users u2 ON ea."assignedBy" = u2."id"
    ORDER BY ea."createdAt" DESC
  `);

  return result.rows;
};

export const getEmployeeAssignments = async (employeeId: string): Promise<EmployeeAssignment[]> => {
  const result = await pool.query(`
    SELECT
      ea.*,
      p."title" AS "projectTitle",
      p."description" AS "projectDescription",
      p."status" AS "projectStatus",
      p."priority" AS "projectPriority",
      p."startDate" AS "projectStartDate",
      p."endDate" AS "projectEndDate",
      u2."firstName" || ' ' || u2."lastName" AS "assignedByName"
    FROM "employeeAssignments" ea
    JOIN projects p ON ea."projectId" = p."id"
    LEFT JOIN users u2 ON ea."assignedBy" = u2."id"
    WHERE ea."employeeId" = $1
    ORDER BY ea."createdAt" DESC
  `, [employeeId]);

  return result.rows;
};

export const createAssignment = async (assignmentData: CreateAssignmentData, assignedBy: string): Promise<EmployeeAssignment> => {
  const {
    employeeId,
    projectId,
    roleInProject,
    startDate,
    endDate,
    hoursAllocated,
    notes
  } = assignmentData;

  // Verify employee and project exist
  const employeeCheck = await pool.query('SELECT "id", "role" FROM users WHERE "id" = $1', [employeeId]);
  if (employeeCheck.rows.length === 0) {
    throw new Error('Employee not found');
  }
  if (employeeCheck.rows[0].role !== 'employee') {
    throw new Error('User is not an employee');
  }

  const projectCheck = await pool.query('SELECT "id" FROM projects WHERE "id" = $1', [projectId]);
  if (projectCheck.rows.length === 0) {
    throw new Error('Project not found');
  }

  const result = await pool.query(`
    INSERT INTO "employeeAssignments" (
      "employeeId", "projectId", "roleInProject", "assignedBy",
      "startDate", "endDate", "hoursAllocated", "notes"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [employeeId, projectId, roleInProject, assignedBy, startDate, endDate, hoursAllocated, notes]);

  return result.rows[0];
};

export const updateAssignmentStatus = async (assignmentId: string, status: string): Promise<EmployeeAssignment> => {
  const result = await pool.query(`
    UPDATE "employeeAssignments"
    SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = $2
    RETURNING *
  `, [status, assignmentId]);

  if (result.rows.length === 0) {
    throw new Error('Assignment not found');
  }

  return result.rows[0];
};

// Task Management
export const getAssignmentTasks = async (assignmentId: string): Promise<TaskAssignment[]> => {
  const result = await pool.query(`
    SELECT * FROM "taskAssignments"
    WHERE "assignmentId" = $1
    ORDER BY "createdAt" DESC
  `, [assignmentId]);

  return result.rows;
};

export const createTask = async (taskData: CreateTaskData): Promise<TaskAssignment> => {
  const {
    assignmentId,
    title,
    description,
    dueDate,
    priority = 'medium',
    estimatedHours
  } = taskData;

  // Verify assignment exists
  const assignmentCheck = await pool.query('SELECT "id" FROM "employeeAssignments" WHERE "id" = $1', [assignmentId]);
  if (assignmentCheck.rows.length === 0) {
    throw new Error('Assignment not found');
  }

  const result = await pool.query(`
    INSERT INTO "taskAssignments" (
      "assignmentId", "title", "description", "dueDate", "priority", "estimatedHours"
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [assignmentId, title, description, dueDate, priority, estimatedHours]);

  return result.rows[0];
};

export const updateTaskProgress = async (
  taskId: string,
  completion_percentage: number,
  actual_hours?: number
): Promise<TaskAssignment> => {
  let status = 'assigned';
  if (completion_percentage > 0 && completion_percentage < 100) {
    status = 'in_progress';
  } else if (completion_percentage === 100) {
    status = 'completed';
  }

  const result = await pool.query(`
    UPDATE "taskAssignments"
    SET "completionPercentage" = $1, "actualHours" = $2, "status" = $3, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = $4
    RETURNING *
  `, [completion_percentage, actual_hours, status, taskId]);

  if (result.rows.length === 0) {
    throw new Error('Task not found');
  }

  return result.rows[0];
};

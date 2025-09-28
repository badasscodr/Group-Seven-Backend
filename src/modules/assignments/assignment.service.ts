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
           u1.first_name || ' ' || u1.last_name as client_name,
           u2.first_name || ' ' || u2.last_name as manager_name
    FROM projects p
    LEFT JOIN users u1 ON p.client_id = u1.id
    LEFT JOIN users u2 ON p.project_manager_id = u2.id
    ORDER BY p.created_at DESC
  `);

  return result.rows;
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const result = await pool.query(`
    SELECT p.*,
           u1.first_name || ' ' || u1.last_name as client_name,
           u2.first_name || ' ' || u2.last_name as manager_name
    FROM projects p
    LEFT JOIN users u1 ON p.client_id = u1.id
    LEFT JOIN users u2 ON p.project_manager_id = u2.id
    WHERE p.id = $1
  `, [projectId]);

  return result.rows[0] || null;
};

export const createProject = async (projectData: CreateProjectData, createdBy: string): Promise<Project> => {
  const {
    title,
    description,
    client_id,
    project_manager_id,
    start_date,
    end_date,
    budget,
    priority = 'medium'
  } = projectData;

  const result = await pool.query(`
    INSERT INTO projects (
      title, description, client_id, project_manager_id,
      start_date, end_date, budget, priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [title, description, client_id, project_manager_id, start_date, end_date, budget, priority]);

  return result.rows[0];
};

export const updateProject = async (projectId: string, updateData: Partial<CreateProjectData>): Promise<Project> => {
  const fields = Object.keys(updateData).filter(key => updateData[key as keyof CreateProjectData] !== undefined);
  const values = fields.map(key => updateData[key as keyof CreateProjectData]);

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

  const result = await pool.query(`
    UPDATE projects
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
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
      p.title as project_title,
      p.description as project_description,
      p.status as project_status,
      p.priority as project_priority,
      p.start_date as project_start_date,
      p.end_date as project_end_date,
      u1.first_name || ' ' || u1.last_name as employee_name,
      u2.first_name || ' ' || u2.last_name as assigned_by_name
    FROM employee_assignments ea
    JOIN projects p ON ea.project_id = p.id
    JOIN users u1 ON ea.employee_id = u1.id
    LEFT JOIN users u2 ON ea.assigned_by = u2.id
    ORDER BY ea.created_at DESC
  `);

  return result.rows;
};

export const getEmployeeAssignments = async (employeeId: string): Promise<EmployeeAssignment[]> => {
  const result = await pool.query(`
    SELECT
      ea.*,
      p.title as project_title,
      p.description as project_description,
      p.status as project_status,
      p.priority as project_priority,
      p.start_date as project_start_date,
      p.end_date as project_end_date,
      u2.first_name || ' ' || u2.last_name as assigned_by_name
    FROM employee_assignments ea
    JOIN projects p ON ea.project_id = p.id
    LEFT JOIN users u2 ON ea.assigned_by = u2.id
    WHERE ea.employee_id = $1
    ORDER BY ea.created_at DESC
  `, [employeeId]);

  return result.rows;
};

export const createAssignment = async (assignmentData: CreateAssignmentData, assignedBy: string): Promise<EmployeeAssignment> => {
  const {
    employee_id,
    project_id,
    role_in_project,
    start_date,
    end_date,
    hours_allocated,
    notes
  } = assignmentData;

  // Verify employee and project exist
  const employeeCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [employee_id]);
  if (employeeCheck.rows.length === 0) {
    throw new Error('Employee not found');
  }
  if (employeeCheck.rows[0].role !== 'employee') {
    throw new Error('User is not an employee');
  }

  const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [project_id]);
  if (projectCheck.rows.length === 0) {
    throw new Error('Project not found');
  }

  const result = await pool.query(`
    INSERT INTO employee_assignments (
      employee_id, project_id, role_in_project, assigned_by,
      start_date, end_date, hours_allocated, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [employee_id, project_id, role_in_project, assignedBy, start_date, end_date, hours_allocated, notes]);

  return result.rows[0];
};

export const updateAssignmentStatus = async (assignmentId: string, status: string): Promise<EmployeeAssignment> => {
  const result = await pool.query(`
    UPDATE employee_assignments
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
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
    SELECT * FROM task_assignments
    WHERE assignment_id = $1
    ORDER BY created_at DESC
  `, [assignmentId]);

  return result.rows;
};

export const createTask = async (taskData: CreateTaskData): Promise<TaskAssignment> => {
  const {
    assignment_id,
    title,
    description,
    due_date,
    priority = 'medium',
    estimated_hours
  } = taskData;

  // Verify assignment exists
  const assignmentCheck = await pool.query('SELECT id FROM employee_assignments WHERE id = $1', [assignment_id]);
  if (assignmentCheck.rows.length === 0) {
    throw new Error('Assignment not found');
  }

  const result = await pool.query(`
    INSERT INTO task_assignments (
      assignment_id, title, description, due_date, priority, estimated_hours
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [assignment_id, title, description, due_date, priority, estimated_hours]);

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
    UPDATE task_assignments
    SET completion_percentage = $1, actual_hours = $2, status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `, [completion_percentage, actual_hours, status, taskId]);

  if (result.rows.length === 0) {
    throw new Error('Task not found');
  }

  return result.rows[0];
};
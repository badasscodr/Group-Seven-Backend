export interface Project {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface EmployeeAssignment {
  id: string;
  employee_id: string;
  project_id: string;
  role_in_project?: string;
  assigned_by?: string;
  assigned_at: string;
  start_date?: string;
  end_date?: string;
  hours_allocated?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: Project;
  employee_name?: string;
  assigned_by_name?: string;
}

export interface TaskAssignment {
  id: string;
  assignment_id: string;
  title: string;
  description?: string;
  assigned_date: string;
  due_date?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours?: number;
  actual_hours?: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateAssignmentData {
  employee_id: string;
  project_id: string;
  role_in_project?: string;
  start_date?: string;
  end_date?: string;
  hours_allocated?: number;
  notes?: string;
}

export interface CreateTaskData {
  assignment_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours?: number;
}
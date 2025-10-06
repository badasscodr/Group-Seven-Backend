export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  projectManagerId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  projectId: string;
  roleInProject?: string;
  assigned_by?: string;
  assigned_at: string;
  startDate?: string;
  endDate?: string;
  hoursAllocated?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  project?: Project;
  employee_name?: string;
  assigned_by_name?: string;
}

export interface TaskAssignment {
  id: string;
  assignmentId: string;
  title: string;
  description?: string;
  assigned_date: string;
  dueDate?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  clientId?: string;
  projectManagerId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateAssignmentData {
  employeeId: string;
  projectId: string;
  roleInProject?: string;
  startDate?: string;
  endDate?: string;
  hoursAllocated?: number;
  notes?: string;
}

export interface CreateTaskData {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
}
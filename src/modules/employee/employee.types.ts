export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in_time: Date | null;
  clock_out_time: Date | null;
  total_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity';
  start_date: Date;
  end_date: Date;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: Date;
  salary?: number;
  manager_id?: string;
  status: 'active' | 'inactive' | 'terminated';
  annual_leave_balance: number;
  sick_leave_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface AttendanceSummary {
  employee_id: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  average_hours_per_day: number;
}
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clock_in_time: Date | null;
  clock_out_time: Date | null;
  total_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity';
  startDate: Date;
  endDate: Date;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejection_reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  position: string;
  hireDate: Date;
  salary?: number;
  managerId?: string;
  status: 'active' | 'inactive' | 'terminated';
  annual_leave_balance: number;
  sick_leave_balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSummary {
  employeeId: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  average_hours_per_day: number;
}
import pool from '../../core/config/database';
import { AttendanceRecord, LeaveRequest, EmployeeProfile, AttendanceSummary } from './employee.types';

// Attendance Management
export const clockIn = async (employeeId: string): Promise<AttendanceRecord> => {
  const today = new Date().toISOString().split('T')[0];

  // Check if already clocked in today
  const existingRecord = await pool.query(
    'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
    [employeeId, today]
  );

  if (existingRecord.rows.length > 0 && existingRecord.rows[0].clock_in_time) {
    throw new Error('Already clocked in today');
  }

  const clockInTime = new Date();

  if (existingRecord.rows.length > 0) {
    // Update existing record
    const result = await pool.query(
      `UPDATE attendance_records
       SET clock_in_time = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $3 AND date = $4
       RETURNING *`,
      [clockInTime, 'present', employeeId, today]
    );
    return result.rows[0];
  } else {
    // Create new record
    const result = await pool.query(
      `INSERT INTO attendance_records (employee_id, date, clock_in_time, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [employeeId, today, clockInTime, 'present']
    );
    return result.rows[0];
  }
};

export const clockOut = async (employeeId: string): Promise<AttendanceRecord> => {
  const today = new Date().toISOString().split('T')[0];

  const existingRecord = await pool.query(
    'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
    [employeeId, today]
  );

  if (existingRecord.rows.length === 0 || !existingRecord.rows[0].clock_in_time) {
    throw new Error('Must clock in before clocking out');
  }

  if (existingRecord.rows[0].clock_out_time) {
    throw new Error('Already clocked out today');
  }

  const clockOutTime = new Date();
  const clockInTime = new Date(existingRecord.rows[0].clock_in_time);
  const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

  const result = await pool.query(
    `UPDATE attendance_records
     SET clock_out_time = $1, total_hours = $2, updated_at = CURRENT_TIMESTAMP
     WHERE employee_id = $3 AND date = $4
     RETURNING *`,
    [clockOutTime, totalHours, employeeId, today]
  );

  return result.rows[0];
};

export const getAttendanceRecords = async (
  employeeId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): Promise<AttendanceRecord[]> => {
  let query = `
    SELECT * FROM attendance_records
    WHERE employee_id = $1
  `;
  const params: any[] = [employeeId];

  if (startDate) {
    query += ` AND date >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND date <= $${params.length + 1}`;
    params.push(endDate);
  }

  query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

export const getTodayAttendance = async (employeeId: string): Promise<AttendanceRecord | null> => {
  const today = new Date().toISOString().split('T')[0];

  const result = await pool.query(
    'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
    [employeeId, today]
  );

  return result.rows[0] || null;
};

// Leave Management
export const submitLeaveRequest = async (
  employeeId: string,
  leaveData: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
  }
): Promise<LeaveRequest> => {
  const { leave_type, start_date, end_date, reason } = leaveData;

  // Calculate days requested
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  const timeDiff = endDateObj.getTime() - startDateObj.getTime();
  const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

  const result = await pool.query(
    `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [employeeId, leave_type, start_date, end_date, daysRequested, reason]
  );

  return result.rows[0];
};

export const getLeaveRequests = async (employeeId: string): Promise<LeaveRequest[]> => {
  const result = await pool.query(
    'SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC',
    [employeeId]
  );

  return result.rows;
};

export const updateLeaveRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  approvedBy: string,
  rejectionReason?: string
): Promise<LeaveRequest> => {
  const result = await pool.query(
    `UPDATE leave_requests
     SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 RETURNING *`,
    [status, approvedBy, rejectionReason || null, requestId]
  );

  if (result.rows.length === 0) {
    throw new Error('Leave request not found');
  }

  return result.rows[0];
};

// Employee Profile
export const getEmployeeProfile = async (userId: string): Promise<EmployeeProfile | null> => {
  const result = await pool.query(
    'SELECT * FROM employee_profiles WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

export const createEmployeeProfile = async (
  userId: string,
  profileData: {
    employee_id: string;
    department: string;
    position: string;
    hire_date: string;
    salary?: number;
    manager_id?: string;
  }
): Promise<EmployeeProfile> => {
  const { employee_id, department, position, hire_date, salary, manager_id } = profileData;

  const result = await pool.query(
    `INSERT INTO employee_profiles (user_id, employee_id, department, position, hire_date, salary, manager_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, employee_id, department, position, hire_date, salary || null, manager_id || null]
  );

  return result.rows[0];
};

// Admin/HR Functions
export const getAllEmployeeAttendance = async (date?: string): Promise<AttendanceSummary[]> => {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const result = await pool.query(
    `SELECT
       ar.employee_id,
       u.first_name || ' ' || u.last_name as employee_name,
       ar.date,
       ar.clock_in_time,
       ar.clock_out_time,
       ar.total_hours,
       ar.status
     FROM attendance_records ar
     JOIN employee_profiles ep ON ar.employee_id = ep.user_id
     JOIN users u ON ep.user_id = u.id
     WHERE ar.date = $1
     ORDER BY ar.clock_in_time ASC`,
    [targetDate]
  );

  return result.rows;
};

export const getAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const result = await pool.query(
    `SELECT
       lr.*,
       u.first_name || ' ' || u.last_name as employee_name,
       ep.department,
       ep.position
     FROM leave_requests lr
     JOIN employee_profiles ep ON lr.employee_id = ep.user_id
     JOIN users u ON ep.user_id = u.id
     ORDER BY lr.created_at DESC`
  );

  return result.rows;
};

export const getAttendanceSummary = async (
  employeeId?: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSummary[]> => {
  let query = `
    SELECT
      employee_id,
      COUNT(*) as total_days,
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
      COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
      COALESCE(SUM(total_hours), 0) as total_hours,
      COALESCE(AVG(total_hours), 0) as average_hours_per_day
    FROM attendance_records
    WHERE 1=1
  `;
  const params: any[] = [];

  if (employeeId) {
    query += ` AND employee_id = $${params.length + 1}`;
    params.push(employeeId);
  }

  if (startDate) {
    query += ` AND date >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND date <= $${params.length + 1}`;
    params.push(endDate);
  }

  query += ` GROUP BY employee_id`;

  const result = await pool.query(query, params);
  return result.rows;
};
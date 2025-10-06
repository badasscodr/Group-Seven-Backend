import pool from '../../core/config/database';
import { AttendanceRecord, LeaveRequest, EmployeeProfile, AttendanceSummary } from './employee.types';

// Attendance Management
export const clockIn = async (employeeId: string): Promise<AttendanceRecord> => {
  const today = new Date().toISOString().split('T')[0];

  // Check if already clocked in today
  const existingRecord = await pool.query(
    'SELECT * FROM attendance WHERE "employeeId" = $1 AND "date" = $2',
    [employeeId, today]
  );

  if (existingRecord.rows.length > 0 && existingRecord.rows[0].checkIn) {
    throw new Error('Already clocked in today');
  }

  const clockInTime = new Date();

  if (existingRecord.rows.length > 0) {
    // Update existing record
    const result = await pool.query(
      `UPDATE attendance
       SET "checkIn" = $1, "status" = $2, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "employeeId" = $3 AND "date" = $4
       RETURNING *`,
      [clockInTime, 'present', employeeId, today]
    );
    return result.rows[0];
  } else {
    // Create new record
    const result = await pool.query(
      `INSERT INTO attendance ("employeeId", "date", "checkIn", "status")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [employeeId, today, clockInTime, 'present']
    );
    return result.rows[0];
  }
};

export const clockOut = async (employeeId: string): Promise<AttendanceRecord> => {
  const today = new Date().toISOString().split('T')[0];

  const existingRecord = await pool.query(
    'SELECT * FROM attendance WHERE "employeeId" = $1 AND "date" = $2',
    [employeeId, today]
  );

  if (existingRecord.rows.length === 0 || !existingRecord.rows[0].checkIn) {
    throw new Error('Must clock in before clocking out');
  }

  if (existingRecord.rows[0].checkOut) {
    throw new Error('Already clocked out today');
  }

  const clockOutTime = new Date();
  const clockInTime = new Date(existingRecord.rows[0].checkIn);
  const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

  const result = await pool.query(
    `UPDATE attendance
     SET "checkOut" = $1, "totalHours" = $2, "updatedAt" = CURRENT_TIMESTAMP
     WHERE "employeeId" = $3 AND "date" = $4
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
    SELECT * FROM attendance
    WHERE "employeeId" = $1
  `;
  const params: any[] = [employeeId];

  if (startDate) {
    query += ` AND "date" >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND "date" <= $${params.length + 1}`;
    params.push(endDate);
  }

  query += ` ORDER BY "date" DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

export const getTodayAttendance = async (employeeId: string): Promise<AttendanceRecord | null> => {
  const today = new Date().toISOString().split('T')[0];

  const result = await pool.query(
    'SELECT * FROM attendance WHERE "employeeId" = $1 AND "date" = $2',
    [employeeId, today]
  );

  return result.rows[0] || null;
};

// Leave Management
export const submitLeaveRequest = async (
  employeeId: string,
  leaveData: {
  leaveType: string;
  startDate: string;
  endDate: string;
    reason: string;
  }
): Promise<LeaveRequest> => {
  const { leaveType, startDate, endDate, reason } = leaveData;

  // Calculate days requested
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const timeDiff = endDateObj.getTime() - startDateObj.getTime();
  const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

  const result = await pool.query(
    `INSERT INTO "leaveRequests" ("employeeId", "leaveType", "startDate", "endDate", "daysRequested", "reason", "status")
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [employeeId, leaveType, startDate, endDate, daysRequested, reason]
  );

  return result.rows[0];
};

export const getLeaveRequests = async (employeeId: string): Promise<LeaveRequest[]> => {
  const result = await pool.query(
    'SELECT * FROM "leaveRequests" WHERE "employeeId" = $1 ORDER BY "createdAt" DESC',
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
    `UPDATE "leaveRequests"
     SET "status" = $1, "approvedBy" = $2, "approvedAt" = CURRENT_TIMESTAMP, "rejectionReason" = $3, "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $4 RETURNING *`,
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
    'SELECT * FROM "employeeProfiles" WHERE "userId" = $1',
    [userId]
  );

  return result.rows[0] || null;
};

export const createEmployeeProfile = async (
  userId: string,
  profileData: {
  employeeId: string;
    department: string;
    position: string;
  hireDate: string;
    salary?: number;
    managerId?: string;
  }
): Promise<EmployeeProfile> => {
  const { employeeId, department, position, hireDate, salary, managerId } = profileData;

  const result = await pool.query(
    `INSERT INTO "employeeProfiles" ("userId", "employeeId", "department", "position", "hireDate", "salary", "managerId")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, employeeId, department, position, hireDate, salary || null, managerId || null]
  );

  return result.rows[0];
};

// Admin/HR Functions
export const getAllEmployeeAttendance = async (date?: string): Promise<AttendanceSummary[]> => {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const result = await pool.query(
    `SELECT
       ar."employeeId",
       u."firstName" || ' ' || u."lastName" as "employeeName",
       ar."date",
       ar."checkIn",
       ar."checkOut",
       ar."totalHours",
       ar."status"
     FROM attendance ar
     JOIN "employeeProfiles" ep ON ar."employeeId" = ep."userId"
     JOIN users u ON ep."userId" = u."id"
     WHERE ar."date" = $1
     ORDER BY ar."checkIn" ASC`,
    [targetDate]
  );

  return result.rows;
};

export const getAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const result = await pool.query(
    `SELECT
       lr.*,
       u."firstName" || ' ' || u."lastName" as "employeeName",
       ep."department",
       ep."position"
     FROM "leaveRequests" lr
     JOIN "employeeProfiles" ep ON lr."employeeId" = ep."userId"
     JOIN users u ON ep."userId" = u."id"
     ORDER BY lr."createdAt" DESC`
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
      "employeeId",
      COUNT(*) as "totalDays",
      COUNT(CASE WHEN "status" = 'present' THEN 1 END) as "presentDays",
      COUNT(CASE WHEN "status" = 'absent' THEN 1 END) as "absentDays",
      COUNT(CASE WHEN "status" = 'late' THEN 1 END) as "lateDays",
      COALESCE(SUM("totalHours"), 0) as "totalHours",
      COALESCE(AVG("totalHours"), 0) as "averageHoursPerDay"
    FROM attendance
    WHERE 1=1
  `;
  const params: any[] = [];

  if (employeeId) {
    query += ` AND "employeeId" = $${params.length + 1}`;
    params.push(employeeId);
  }

  if (startDate) {
    query += ` AND "date" >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND "date" <= $${params.length + 1}`;
    params.push(endDate);
  }

  query += ` GROUP BY "employeeId"`;

  const result = await pool.query(query, params);
  return result.rows;
};

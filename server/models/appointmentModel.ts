import { pool, getProdPool as prodPool } from '../config/database.js';
import { format } from 'date-fns';

const getAllAppointments = async (
  offset: number,
  limit: number,
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  employeeId?: number,
  memberId?: number,
  sortOrder: 'asc' | 'desc' = 'desc',
  status?: 'upcoming' | 'finished'
) => {
  try {
    const now = new Date();
    const toDateStr = (d?: Date | string | null): string | null => {
      if (d == null) return null;
      if (d instanceof Date) {
        return d.toISOString().split('T')[0];
      }
      const s = d.toString().trim();
      return s === '' ? null : s;
    };

    const filters: string[] = [];
    const values: (string | number | null)[] = [limit, offset];
    let paramIndex = 3;

    // --- MAIN QUERY WHERE CLAUSE ---
    if (startDate || endDate) {
      filters.push(
        `a.appointment_date BETWEEN COALESCE($${paramIndex++}::DATE, '0001-01-01') AND COALESCE($${paramIndex++}::DATE, '9999-12-31')`
      );
      values.push(toDateStr(startDate), toDateStr(endDate));
    }

    if (employeeId) {
      filters.push(`a.servicing_employee_id = $${paramIndex}`);
      values.push(employeeId);
      paramIndex++;
    }

    if (memberId) {
      filters.push(`a.member_id = $${paramIndex}`);
      values.push(memberId);
      paramIndex++;
    }

    if (status === 'upcoming') {
      filters.push(`(a.appointment_date + a.start_time) > $${paramIndex}`);
      values.push(toDateStr(now));
      paramIndex++;
    } else if (status === 'finished') {
      filters.push(`(a.appointment_date + a.start_time) <= $${paramIndex}`);
      values.push(toDateStr(now));
      paramIndex++;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.*,
        m.name AS member_name,
        e.employee_name AS servicing_employee_name
      FROM appointments a
      LEFT JOIN members m ON a.member_id = m.id
      LEFT JOIN employees e ON a.servicing_employee_id = e.id
      ${whereClause}
      ORDER BY a.appointment_date ${sortOrder.toUpperCase()}, a.start_time ${sortOrder.toUpperCase()}
      LIMIT $1 OFFSET $2
    `;

    const result = await pool().query(query, values);

    // --- REBUILD COUNT QUERY WITH REINDEXED PARAMS ---
    const countFilters: string[] = [];
    const countValues: (string | number | null)[] = [];
    let idx = 1;

    if (startDate || endDate) {
      countFilters.push(
        `a.appointment_date BETWEEN COALESCE($${idx++}::DATE, '0001-01-01') AND COALESCE($${idx++}::DATE, '9999-12-31')`
      );
      countValues.push(toDateStr(startDate), toDateStr(endDate));
    }

    if (employeeId) {
      countFilters.push(`a.servicing_employee_id = $${idx++}`);
      countValues.push(employeeId);
    }

    if (memberId) {
      countFilters.push(`a.member_id = $${idx++}`);
      countValues.push(memberId);
    }

    if (status === 'upcoming') {
      countFilters.push(`(a.appointment_date + a.start_time) > $${idx++}`);
      countValues.push(toDateStr(now));
    } else if (status === 'finished') {
      countFilters.push(`(a.appointment_date + a.start_time) <= $${idx++}`);
      countValues.push(toDateStr(now));
    }

    const countWhere = countFilters.length ? `WHERE ${countFilters.join(' AND ')}` : '';
    const totalQuery = `SELECT COUNT(*) FROM appointments a ${countWhere}`;
    const totalResult = await pool().query(totalQuery, countValues);

    const totalPages = Math.ceil(Number(totalResult.rows[0].count) / limit);

    const totalCount = Number(totalResult.rows[0].count);

    return {
      appointments: result.rows,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw new Error('Error fetching appointments');
  }
};

const getAppointmentsByDate = async (appointmentDate: Date | string) => {
  try {
    const query = `
      SELECT 
        a.*,
        m.name AS member_name,
        e.employee_name AS servicing_employee_name
      FROM appointments a
      LEFT JOIN members m ON a.member_id = m.id
      LEFT JOIN employees e ON a.servicing_employee_id = e.id
      WHERE DATE(a.appointment_date) = DATE($1)
      ORDER BY a.start_time ASC
    `;
    const values = [appointmentDate];
    const result = await pool().query(query, values);

    return {
      appointments: result.rows,
      totalCount: result.rows.length,
    };
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    throw new Error('Error fetching appointments by date');
  }
};
const getAppointmentById = async (id: number) => {
  try {
    const query = `
      SELECT 
        a.*,
        m.name AS member_name,
        e.employee_name AS servicing_employee_name,
        c.employee_name AS created_by_name,
        u.employee_name AS updated_by_name
      FROM appointments a
      LEFT JOIN members m ON a.member_id = m.id
      LEFT JOIN employees e ON a.servicing_employee_id = e.id
      LEFT JOIN employees c ON a.created_by = c.id
      LEFT JOIN employees u ON a.updated_by = u.id
      WHERE a.id = $1;
    `;

    const result = await pool().query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const appointment = result.rows[0];

    return {
      ...appointment,
      appointment_date: appointment.appointment_date
        ? format(new Date(appointment.appointment_date), 'yyyy-MM-dd')
        : null,
      start_time: appointment.start_time ? format(new Date(appointment.start_time), 'HH:mm') : null,
      end_time: appointment.end_time ? format(new Date(appointment.end_time), 'HH:mm') : null,
      created_at: appointment.created_at ? format(new Date(appointment.created_at), 'dd MMM yyyy, hh:mm a') : null,
      updated_at: appointment.updated_at ? format(new Date(appointment.updated_at), 'dd MMM yyyy, hh:mm a') : null,
      member_name: appointment.member_name || null,
      servicing_employee_name: appointment.servicing_employee_name || null,
      created_by_name: appointment.created_by_name || null,
      updated_by_name: appointment.updated_by_name || null,
    };
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    throw new Error('Error fetching appointment by ID');
  }
};

const validateEmployeeIsActive = async (employeeId: number): Promise<boolean> => {
  try {
    const query = `
      SELECT id, employee_is_active 
      FROM employees 
      WHERE id = $1
    `;

    const values = [employeeId];
    const result = await pool().query(query, values);

    // Check if employee exists and is active
    if (result.rows.length === 0) {
      return false; // Employee doesn't exist
    }

    const employee = result.rows[0];
    console.log('Employee validation result:', employee.employee_is_active);
    return employee.employee_is_active === true;
  } catch (error) {
    console.error('Error validating employee:', error);
    throw new Error('Error validating employee');
  }
};

const validateMemberIsActive = async (memberId: number): Promise<boolean> => {
  try {
    const query = `
      SELECT id
      FROM members 
      WHERE id = $1
    `;

    const values = [memberId];
    const result = await pool().query(query, values);

    // Check if member exists
    const row = result.rows[0];
    if (!row) {
      // not found
      return false;
    }

    // Member exists, no need to check active status
    return true;
  } catch (error) {
    console.error('Error validating member:', error);
    throw new Error('Error validating member');
  }
};

interface AppointmentItem {
  servicing_employee_id: number | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  remarks?: string;
}
const checkRestdayConflict = async (employeeId: number | null, appointmentDate: Date | string) => {
  try {
    const query = `SELECT check_restday_conflict($1, $2) AS warning`;
    const values = [employeeId, appointmentDate];
    const { rows } = await pool().query(query, values);
    // rows[0].warning will be either the warning string or null
    return rows[0].warning;
  } catch (error) {
    console.error('Error checking restday conflict:', error);
    throw new Error('Error checking restday conflict');
  }
};

const createAppointment = async (
  memberId: number,
  appointments: AppointmentItem[],
  createdBy: number,
  createdAt: string
): Promise<void> => {
  try {
    // Call the stored procedure create_appointment_ab
    // p_appointments is jsonb array: pass JSON string or JS object
    const query = `CALL create_appointment_ab($1, $2::jsonb, $3, $4)`;
    const values = [memberId, JSON.stringify(appointments), createdBy, createdAt];
    await pool().query(query, values);
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    // Propagate the error message for controller to handle
    // If Postgres RAISE EXCEPTION, error.message includes the detail
    throw new Error(error.message || 'Error creating appointments');
  }
};

export const updateAppointment = async (
  memberId: number,
  appointments: {
    id: number;
    servicing_employee_id: number | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    remarks: string;
  }[],
  updatedBy: number,
  updatedAt: string
): Promise<void> => {
  try {
    // Stored procedure expects JSON array with each object including id
    const query = `CALL update_appointment_ab($1, $2::jsonb, $3, $4)`;
    const values = [memberId, JSON.stringify(appointments), updatedBy, updatedAt];
    await pool().query(query, values);
  } catch (error: any) {
    console.error('Error in updateAppointment:', error);
    // Rethrow with message for controller
    throw new Error(error.message || 'Error updating appointment(s)');
  }
};

// Get max duration info for all start times
const getMaxDurationFromStartTimes = async (
  date: Date | string,
  employeeId: number | null,
  excludeAppointmentId: number | null /// NEW
) => {
  try {
    const query = `SELECT * FROM get_max_duration_from_start_time($1, $2, $3)`;
    const values = [date, employeeId, excludeAppointmentId];
    const result = await pool().query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching max durations:', error);
    throw new Error('Error fetching max durations');
  }
};

// Get available end times for specific start time
const getEndTimesForStartTime = async (
  date: Date | string,
  startTime: string,
  employeeId: number | null,
  excludeAppointmentId: number | null
) => {
  try {
    const query = `SELECT * FROM get_available_end_times_for_start($1, $2, $3, $4)`;
    const values = [date, startTime, employeeId, excludeAppointmentId];
    const result = await pool().query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching end times for start time:', error);
    throw new Error('Error fetching end times for start time');
  }
};

export default {
  getAllAppointments,
  getAppointmentsByDate,
  getAppointmentById,
  validateEmployeeIsActive,
  validateMemberIsActive,
  checkRestdayConflict,
  createAppointment,
  updateAppointment,
  getEndTimesForStartTime,
  getMaxDurationFromStartTimes,
};

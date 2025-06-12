import { pool, getProdPool as prodPool } from '../config/database.js';

const getAllAppointments = async (
  offset: number,
  limit: number,
  startDate_utc: Date | string | null,
  endDate_utc?: Date | string | null
) => {
  try {
    const effectiveEndDate = endDate_utc || new Date();
    const query = `
      SELECT 
        a.*,
        m.name AS member_name,
        e.employee_name AS servicing_employee_name
      FROM appointments a
      LEFT JOIN members m ON a.member_id = m.id
      LEFT JOIN employees e ON a.servicing_employee_id = e.id
      WHERE a.created_at BETWEEN
        COALESCE($3, '0001-01-01'::timestamp with time zone)
        AND $4
      ORDER BY a.appointment_date DESC, a.start_time ASC
      LIMIT $1 OFFSET $2
    `;
    const values = [limit, offset, startDate_utc, effectiveEndDate];
    const result = await pool().query(query, values);

    const totalQuery = `
      SELECT COUNT(*) FROM appointments

      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamp with time zone)
        AND $2
    `;
    const totalValues = [startDate_utc, effectiveEndDate];
    const totalResult = await pool().query(totalQuery, totalValues);
    const totalPages = Math.ceil(totalResult.rows[0].count / limit);

    return {
      appointments: result.rows,
      totalPages,
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

interface AppointmentItem {
  servicing_employee_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  remarks?: string;
}
const checkRestdayConflict = async (
  employeeId: number | null,
  appointmentDate: Date | string,
) => {
  try {
    const query = 
      `SELECT check_restday_conflict($1, $2) AS warning`
    ;
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
    const values = [
      memberId,
      JSON.stringify(appointments),
      createdBy,
      createdAt,
    ];
    await pool().query(query, values);
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    // Propagate the error message for controller to handle
    // If Postgres RAISE EXCEPTION, error.message includes the detail
    throw new Error(error.message || 'Error creating appointments');
  }
};

// Get available end times for specific start time
const getEndTimesForStartTime = async (
  date: Date | string,
  startTime: string,
  employeeId: number | null,
) => {
  try {
    const query = `SELECT * FROM get_available_end_times_for_start($1, $2, $3)`;
    const values = [date, startTime, employeeId];
    const result = await pool().query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching end times for start time:', error);
    throw new Error('Error fetching end times for start time');
  }
};

// Get max duration info for all start times
const getMaxDurationFromStartTimes = async (
  date: Date | string,
  employeeId: number | null,
) => {
  try {
    const query = `SELECT * FROM get_max_duration_from_start_time($1, $2)`;
    const values = [date, employeeId];
    const result = await pool().query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching max durations:', error);
    throw new Error('Error fetching max durations');
  }
};

export default {
 getAllAppointments,
 getAppointmentsByDate,
 checkRestdayConflict,
 createAppointment,
 getEndTimesForStartTime,
 getMaxDurationFromStartTimes
};
 
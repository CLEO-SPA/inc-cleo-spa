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

const getAvailableTimeslotsByEmployee = async (
  appointmentDate: Date | string,
  employeeId: number | string
) => {
  try {
    const query = `SELECT * FROM get_available_timeslots($1, $2)`;
    const values = [appointmentDate, employeeId];
    const result = await pool().query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching available timeslots:', error);
    throw new Error('Error fetching available timeslots');
  }
};

export default {
 getAllAppointments,
 getAppointmentsByDate,
 getAvailableTimeslotsByEmployee
};
 
import { pool } from '../config/database.js';
import { CreateTimetableInput } from '../types/timetable.types.js';

export interface RestDay {
  restday_number: number;
  restday_name: string;
  effective_startdate: Date;
  effective_enddate: Date | null;
}

export interface EmployeeTimetable {
  employee_id: number;
  employee_name: string;
  rest_days: RestDay[];
}

export interface PaginatedTimetableResponse {
  data: EmployeeTimetable[];
  pagination: {
    current_page: number;
    per_page: number;
    total_employees: number;
    total_pages: number;
  }
}

export interface MonthDateRange {
  start_date: Date;
  end_date: Date; 
}

/**
 * Get /api/et/current-and-upcoming/:employeeId
 * This endpoint retrieves current and upcoming timetables by employee id
 */
const getCurrentAndUpcomingTimetables = async (
  employeeId: number,
  currentDate: string,
  start_date_utc: string,
  end_date_utc: string
): Promise<{ current: any[]; upcoming: any[] }> => {
  try {
    // Query for current timetables
    const currentQuery = `
      SELECT *
      FROM timetables
      WHERE employee_id = $1
        AND effective_startdate <= ($2::timestamptz)
        AND (effective_enddate IS NULL OR effective_enddate >= $2::timestamptz)
      ORDER BY effective_startdate DESC
      LIMIT 1
    `;

    const currentValues = [employeeId, currentDate];
    const currentResult = await pool().query(currentQuery, currentValues);

    // Query for upcoming timetables
    const upcomingQuery = `
      SELECT *
      FROM timetables
      WHERE employee_id = $1
        AND effective_startdate > $2::timestamptz
      ORDER BY effective_startdate ASC
    `;
    const upcomingValues = [employeeId, currentDate];
    const upcomingResult = await pool().query(upcomingQuery, upcomingValues);

    if (currentResult.rowCount === 0 && upcomingResult.rowCount === 0) {
      throw new Error('No timetables found for employee.');
    }

    return {
      current: currentResult.rows,
      upcoming: upcomingResult.rows,
    };
  } catch (error) {
    console.error('Error in timetableModel.getCurrentAndUpcomingTimetables:', error);
    throw error;
  }
};

/**
 * Get /api/et/create-employee-timetable
 * This endpoint insert a new timetable record by calling SQL function "create_employee_timetable"
 */
const createEmployeeTimetable = async (input: CreateTimetableInput) => {
  const {
    employee_id,
    current_date,
    rest_day_number,
    effective_start_date,
    effective_end_date,
    created_by,
    created_at,
  } = input;

  const client = await pool().connect();
  try {
    const result = await client.query(
      `SELECT * FROM create_employee_timetable(
        $1::BIGINT, $2::TIMESTAMPTZ, $3::SMALLINT,
        $4::TIMESTAMPTZ, $5::TIMESTAMPTZ,
        $6::BIGINT, $7::TIMESTAMPTZ
      );`,
      [
        employee_id,
        current_date,
        rest_day_number,
        effective_start_date,
        effective_end_date,
        created_by,
        created_at,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Utility function
 * Validate month format (YYYY-MM)
 */
const isValidMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
}

/**
 * Utility function
 * Get the start and end dates
 */
const getMonthDateRange = (monthInput: string): MonthDateRange => {
  const start_date = new Date(`${monthInput}-01T00:00:00Z`);
  const end_date = new Date(start_date.getFullYear(), start_date.getMonth() + 1, 0, 23, 59, 59, 999);
  return {start_date, end_date};
}

/**
 * Get paginated list of employees' timetables for a specific month
 * Optionally filter by position
 */
const getActiveRestDays = async(
  month: string,
  page: number = 1,
  limit: number = 20,
  positionId?: number
): Promise<PaginatedTimetableResponse> => {
  try {
    if (!isValidMonthFormat(month)) {
      throw new Error('Invalid month format. Use YYYY-MM format.');
    }
    const { start_date, end_date } = getMonthDateRange(month);
    const offset = (page - 1) * limit;
    const query = `
      WITH filtered_employees AS (
        SELECT e.id AS employee_id, e.employee_name AS employee_name
        FROM employees e
        WHERE e.employee_is_active = true
        ${positionId ? 'AND e.position_id = $3' : ''}
        ORDER BY e.employee_name
        LIMIT $1 OFFSET $2
      ),
      total_count AS (
        SELECT COUNT(*) AS total
        FROM employees e
        WHERE e.employee_is_active = true
        ${positionId ? 'AND e.position_id = $3' : ''}
      )
      SELECT 
        fe.employee_id,
        fe.employee_name,
        t.restday_number,
        CASE t.restday_number
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
          WHEN 7 THEN 'Sunday'
        END AS restday_name,
        t.effective_startdate,
        t.effective_enddate
      FROM filtered_employees fe
      CROSS JOIN total_count tc
      LEFT JOIN timetables t ON fe.employee_id = t.employee_id
        AND t.effective_startdate <= $${positionId ? 4 : 3}::timestamptz
        AND (t.effective_enddate IS NULL OR t.effective_enddate <= $${positionId ? 5 : 4}::timestamptz)
      ORDER BY fe.employee_name, t.effective_startdate;
    `;

    let queryParams: any[];
    if (positionId) {
      queryParams = [limit, offset, positionId, end_date.toISOString(), start_date.toISOString()];
    } else {
      queryParams = [limit, offset, end_date.toISOString(), start_date.toISOString()];
    }

    const result = await pool().query(query, queryParams);

    // Group results by employee
    const employeeMap = new Map<number, EmployeeTimetable>();
    let totalEmployees = 0;
    /**
     * Incase if there is any error, check here 
     */
    result.rows.forEach((row: { total: number; employee_id: number; employee_name: string; restday_number: number; restday_name: string; effective_startdate: any; effective_enddate: any; }) => {
      totalEmployees = row.total;
      
      if (!employeeMap.has(row.employee_id)) {
        employeeMap.set(row.employee_id, {
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          rest_days: []
        });
      }

      if (row.restday_number) {
        employeeMap.get(row.employee_id)!.rest_days.push({
          restday_number: row.restday_number,
          restday_name: row.restday_name,
          effective_startdate: row.effective_startdate,
          effective_enddate: row.effective_enddate
        });
      }
    });

    const data = Array.from(employeeMap.values());
    const totalPages = Math.ceil(totalEmployees / limit);

    return {
      data,
      pagination: {
        current_page: page,
        per_page: limit,
        total_employees: totalEmployees,
        total_pages: totalPages
      }
    };
  } catch (error) {
    console.error('Database Error in getActiveRestDays:', error);
    throw new Error('Failed to fetch timetable data from the database');
  }
}

/**
 * Get specific employee's timetable for a specific month
 */
const getActiveRestDaysByEmployee = async (
  employeeId: number,
  month: string
): Promise<EmployeeTimetable | null> => {
  try{
    if(!isValidMonthFormat(month)) {
      throw new Error('Invalid month format. Use YYYY-MM format.');
    }
    const { start_date, end_date } = getMonthDateRange(month);
    const query = `
      SELECT 
        e.id AS employee_id,
        e.employee_name AS employee_name,
        t.restday_number,
        CASE t.restday_number
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
          WHEN 7 THEN 'Sunday'
        END AS restday_name,
        t.effective_startdate,
        t.effective_enddate
      FROM employees e
      LEFT JOIN timetables t ON e.id = t.employee_id
        AND t.effective_startdate <= $2::timestamptz
        AND (t.effective_enddate IS NULL OR t.effective_enddate >= $3::timestamptz)
      WHERE e.id = $1 AND e.employee_is_active = true
      ORDER BY t.effective_startdate;
    `;
    const result = await pool().query(query, [employeeId, end_date.toISOString(), start_date.toISOString()]);

    /**
     * If no timetable found for the employee, throw an error for now
     * This can be handled in the controller later
     * No timetable found for the employee means the employee has no rest days set for the month
     */
    if (result.rows.length === 0) {
      return null;
    }

    const employee = result.rows[0];
    const restDays = result.rows.filter((row: { restday_number: number; }) => row.restday_number)
    .map((row: { restday_number: any; restday_name: any; effective_startdate: any; effective_enddate: any; }) => ({
      restday_number: row.restday_number,
      restday_name: row.restday_name,
      effective_startdate: row.effective_startdate,
      effective_enddate: row.effective_enddate
    }));

    return {
      employee_id: employee.employee_id,
      employee_name: employee.employee_name,
      rest_days: restDays
    };
  } catch (error) {
    console.error('Database Error in getActiveRestDaysByEmployee:', error);
    throw new Error('Failed to fetch employee timetable data from the database');
  }
}

/**
 * Get timetable for a specific position for a specific month
 */
const getActiveRestDaysByPosition = async (
  positionId: number,
  month: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedTimetableResponse> => {
  // Reuse the getActiveRestDays function with positionId filter
  return getActiveRestDays(month, page, limit, positionId);
}

/**
 * GET /api/et/reset-create-timetables-pre
 * This endpoint resets the timetables db table to its defined pre-condition
 */
const resetCreateTimetablePre = async () => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // 1. Delete all entries
    await client.query('DELETE FROM timetables');

    // 2. Reset ID sequence
    await client.query(`ALTER SEQUENCE timetables_id_seq RESTART WITH 1`);

    // 3. Insert test row with specified values
    await client.query(
      `INSERT INTO timetables (
        employee_id, restday_number, effective_startdate,
        effective_enddate, created_by, created_at,
        updated_by, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NULL, NULL
      )`,
      [
        11,
        2,
        '2025-01-01T00:00:00+08:00', // effective_startdate
        null,                        // effective_enddate
        15,
        '2024-12-24T12:00:00+08:00', // created_at
      ]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};


export default {
  getCurrentAndUpcomingTimetables,
  createEmployeeTimetable,
  getActiveRestDays,
  getActiveRestDaysByEmployee,
  getActiveRestDaysByPosition,
  resetCreateTimetablePre
};

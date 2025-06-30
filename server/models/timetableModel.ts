import { pool } from '../config/database.js';
import { CreateTimetableInput, UpdateTimetableInput, DetailedTimetable } from '../types/timetable.types.js';

export interface RestDay {
  timetable_id: number;
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
 * Get /api/et/current-and-upcoming/:employeeId?currentDate=YYYY-MM-DD
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
 * POST /api/et/create-employee-timetable
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
// const getActiveRestDays = async(
//   month: string,
//   page: number = 1,
//   limit: number = 20,
//   positionId?: number
// ): Promise<PaginatedTimetableResponse> => {
//   try {
//     if (!isValidMonthFormat(month)) {
//       throw new Error('Invalid month format. Use YYYY-MM format.');
//     }
//     const { start_date, end_date } = getMonthDateRange(month);
//     const offset = (page - 1) * limit;
//     const query = `
//       WITH filtered_employees AS (
//         SELECT e.id AS employee_id, e.employee_name AS employee_name
//         FROM employees e
//         WHERE e.employee_is_active = true
//         ${positionId ? 'AND e.position_id = $3' : ''}
//         ORDER BY e.employee_name
//         LIMIT $1 OFFSET $2
//       ),
//       total_count AS (
//         SELECT COUNT(*) AS total
//         FROM employees e
//         WHERE e.employee_is_active = true
//         ${positionId ? 'AND e.position_id = $3' : ''}
//       )
//       SELECT 
//         fe.employee_id,
//         fe.employee_name,
//         tc.total,
//         t.restday_number,
//         CASE t.restday_number
//           WHEN 1 THEN 'Monday'
//           WHEN 2 THEN 'Tuesday'
//           WHEN 3 THEN 'Wednesday'
//           WHEN 4 THEN 'Thursday'
//           WHEN 5 THEN 'Friday'
//           WHEN 6 THEN 'Saturday'
//           WHEN 7 THEN 'Sunday'
//         END AS restday_name,
//         t.effective_startdate,
//         t.effective_enddate
//       FROM filtered_employees fe
//       CROSS JOIN total_count tc
//       LEFT JOIN timetables t ON fe.employee_id = t.employee_id
//         AND t.effective_startdate <= $${positionId ? 4 : 3}::timestamptz
//         AND (t.effective_enddate IS NULL OR t.effective_enddate <= $${positionId ? 5 : 4}::timestamptz)
//       ORDER BY fe.employee_name, t.effective_startdate;
//     `;

//     let queryParams: any[];
//     if (positionId) {
//       queryParams = [limit, offset, positionId, end_date.toISOString(), start_date.toISOString()];
//     } else {
//       queryParams = [limit, offset, end_date.toISOString(), start_date.toISOString()];
//     }

//     const result = await pool().query(query, queryParams);

//     // Group results by employee
//     const employeeMap = new Map<number, EmployeeTimetable>();
//     let totalEmployees = 0;
//     /**
//      * Incase if there is any error, check here 
//      */
//     if (result.rows.length === 0) {
//       // If no employees found, return empty data with pagination
//       const countQuery = `
//         SELECT COUNT(*) AS total
//         FROM employees e
//         WHERE e.employee_is_active = true
//         ${positionId ? 'AND e.position_id = $1' : ''}
//       `;
//       const countParams = positionId ? [positionId] : [];
//       const countResult = await pool().query(countQuery, countParams);
//       totalEmployees = parseInt(countResult.rows[0].total, 10);
//     } else {
//       result.rows.forEach((row: { total: number; employee_id: number; employee_name: string; restday_number: number; restday_name: string; effective_startdate: any; effective_enddate: any; }) => {
//         console.log('Row total value:', row.total, typeof row.total); 
//         totalEmployees = row.total;
        
//         if (!employeeMap.has(row.employee_id)) {
//           employeeMap.set(row.employee_id, {
//             employee_id: row.employee_id,
//             employee_name: row.employee_name,
//             rest_days: []
//           });
//         }

//         if (row.restday_number) {
//           employeeMap.get(row.employee_id)!.rest_days.push({
//             restday_number: row.restday_number,
//             restday_name: row.restday_name,
//             effective_startdate: row.effective_startdate,
//             effective_enddate: row.effective_enddate
//           });
//         }
//       });

//       const data = Array.from(employeeMap.values());
//       const totalPages = Math.ceil(totalEmployees / limit);

//       return {
//         data,
//         pagination: {
//           current_page: page,
//           per_page: limit,
//           total_employees: totalEmployees,
//           total_pages: totalPages
//         }
//       };
//     }
//   } catch (error) {
//     console.error('Database Error in getActiveRestDays:', error);
//     throw new Error('Failed to fetch timetable data from the database');
//   }
// }
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
        SELECT DISTINCT e.id AS employee_id, e.employee_name AS employee_name
        FROM employees e
        ${positionId ? 'INNER JOIN employee_to_position etp ON e.id = etp.employee_id' : ''}
        WHERE e.employee_is_active = true
        ${positionId ? 'AND etp.position_id = $3' : ''}
        ORDER BY e.employee_name
        LIMIT $1 OFFSET $2
      ),
      total_count AS (
        SELECT COUNT(DISTINCT e.id) AS total
        FROM employees e
        ${positionId ? 'INNER JOIN employee_to_position etp ON e.id = etp.employee_id' : ''}
        WHERE e.employee_is_active = true
        ${positionId ? 'AND etp.position_id = $3' : ''}
      )
      SELECT 
        fe.employee_id,
        fe.employee_name,
        tc.total,
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
        t.id AS timetable_id,
        t.effective_startdate,
        t.effective_enddate
      FROM filtered_employees fe
      CROSS JOIN total_count tc
      LEFT JOIN timetables t ON fe.employee_id = t.employee_id
        AND (
          -- Rest day overlaps with the month  
          t.effective_startdate <= $${positionId ? 4 : 3}::timestamptz 
          AND (t.effective_enddate IS NULL OR t.effective_enddate >= $${positionId ? 5 : 4}::timestamptz)
        )
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
    
    if (result.rows.length === 0) {
      // If no employees found, return empty data with pagination
      const countQuery = `
        SELECT COUNT(DISTINCT e.id) AS total
        FROM employees e
        ${positionId ? 'INNER JOIN employee_to_position etp ON e.id = etp.employee_id' : ''}
        WHERE e.employee_is_active = true
        ${positionId ? 'AND etp.position_id = $1' : ''}
      `;
      const countParams = positionId ? [positionId] : [];
      const countResult = await pool().query(countQuery, countParams);
      totalEmployees = parseInt(countResult.rows[0].total, 10);
    } else {
      result.rows.forEach((row: { total: number; employee_id: number; employee_name: string; timetable_id: number, restday_number: number; restday_name: string; effective_startdate: any; effective_enddate: any; }) => {
        console.log('Row total value:', row.total, typeof row.total); 
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
            timetable_id: row.timetable_id,
            restday_number: row.restday_number,
            restday_name: row.restday_name,
            effective_startdate: row.effective_startdate,
            effective_enddate: row.effective_enddate
          });
        }
      });
    }

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
    
    console.log('=== DEBUG TIMETABLE QUERY ===');
    console.log('Employee ID:', employeeId);
    console.log('Month:', month);
    console.log('start_date:', start_date.toISOString());
    console.log('end_date:', end_date.toISOString());
    
    // ✅ FIXED QUERY - Show ALL rest days that overlap with the month
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
        t.id AS timetable_id,
        t.effective_startdate,
        t.effective_enddate
      FROM employees e
      LEFT JOIN timetables t ON e.id = t.employee_id
        AND (
          -- Rest day overlaps with the month
          t.effective_startdate <= $2::timestamptz 
          AND (t.effective_enddate IS NULL OR t.effective_enddate >= $3::timestamptz)
        )
      WHERE e.id = $1 AND e.employee_is_active = true
      ORDER BY t.effective_startdate;
    `;
    
    const queryParams = [employeeId, end_date.toISOString(), start_date.toISOString()];
    const result = await pool().query(query, queryParams);
    console.log('Raw SQL result rows:', JSON.stringify(result.rows, null, 2));
    
    // Debug each row's date logic
    // result.rows.forEach((row, index) => {
    //   if (row.restday_number) {
    //     const effectiveStart = new Date(row.effective_startdate);
    //     const effectiveEnd = row.effective_enddate ? new Date(row.effective_enddate) : null;
        
    //     console.log(`\n--- Row ${index + 1} Analysis ---`);
    //     console.log('restday_number:', row.restday_number);
    //     console.log('effective_startdate:', effectiveStart.toISOString());
    //     console.log('effective_enddate:', effectiveEnd ? effectiveEnd.toISOString() : 'NULL (ongoing)');
        
    //     // Check overlap logic
    //     const startsBeforeMonthEnd = effectiveStart <= end_date;
    //     const endsAfterMonthStart = !effectiveEnd || effectiveEnd >= start_date;
        
    //     console.log('Starts before month end:', `${effectiveStart.toISOString()} <= ${end_date.toISOString()}`, '=', startsBeforeMonthEnd);
    //     console.log('Ends after month start:', effectiveEnd ? `${effectiveEnd.toISOString()} >= ${start_date.toISOString()}` : 'NULL (ongoing)', '=', endsAfterMonthStart);
    //     console.log('Overlaps with month:', startsBeforeMonthEnd && endsAfterMonthStart);
    //   }
    // });

    if (result.rows.length === 0) {
      console.log('No employee found with ID:', employeeId);
      return null;
    }

    const employee = result.rows[0];
    const restDays = result.rows
      .filter((row: { restday_number: number; }) => row.restday_number) // Only rows with rest days
      .map((row: { restday_number: any; restday_name: any; timetable_id: number; effective_startdate: any; effective_enddate: any; }) => ({
        timetable_id: row.timetable_id,
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
  limit: number = 10
): Promise<PaginatedTimetableResponse> => {
  // Reuse the getActiveRestDays function with positionId filter
  return getActiveRestDays(month, page, limit, positionId);
}

/**
 * GET /api/et/:timetableId
 * This endpoint retrieves the timetable by timetable ID
 */
const getTimetableById =  async (timetableId: number): Promise<DetailedTimetable | null> => {
  const query = `
    SELECT 
    t.id,
    t.employee_id,
    t.restday_number,
    t.effective_startdate,
    t.effective_enddate,
    e.employee_name
    FROM timetables t
    JOIN employees e ON e.id = t.employee_id 
    WHERE t.id = $1
  `
  try {
    const result = await pool().query(query, [timetableId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in timetableModel.getTimetableById: ', error);
    throw new Error('Failed to fetch timetable details from database');
  }
}

/**
 * PUT /api/et/update-employee-timetable/:timetableId
 * This endpoint update the timetable record by calling SQL function "update_employee_timetable"
 */
const updateEmployeeTimetable = async (input: UpdateTimetableInput) => {
  const {
    timetable_id,
    current_date,
    rest_day_number,
    effective_start_date,
    effective_end_date,
    updated_by,
    updated_at,
  } = input;

  const client = await pool().connect();
  try {
    const result = await client.query(
      `SELECT * FROM update_employee_timetable(
        $1::BIGINT, $2::TIMESTAMPTZ, $3::SMALLINT,
        $4::TIMESTAMPTZ, $5::TIMESTAMPTZ,
        $6::BIGINT, $7::TIMESTAMPTZ
      );`,
      [
        timetable_id,
        current_date,
        rest_day_number,
        effective_start_date,
        effective_end_date,
        updated_by,
        updated_at,
      ]
    );

    return result.rows[0];
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
  getTimetableById,
  updateEmployeeTimetable,
};

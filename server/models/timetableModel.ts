import { pool } from '../config/database.js';
import { CreateTimetableInput } from '../types/timetable.types.js';

// for session start and end data utc
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
        AND effective_startdate <= ($2::timestamptz + interval '1 day')
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

// backend testing 
// const getCurrentAndUpcomingTimetables = async (
//   employeeId: number,
//   currentDate: string,
//   start_date_utc: string,
//   end_date_utc: string
// ): Promise<{ current: any[]; upcoming: any[] }> => {
//   try {
//     // Query for current timetables
//     const currentQuery = `
//       SELECT *
//       FROM timetables
//       WHERE employee_id = $1
//         AND effective_startdate <= ($2::timestamptz + interval '1 day')
//         AND (effective_enddate IS NULL OR effective_enddate >= $2::timestamptz)
//       ORDER BY effective_startdate DESC
//       LIMIT 1
//     `;

//     const currentValues = [employeeId, currentDate];
//     const currentResult = await pool().query(currentQuery, currentValues);

//     // Query for upcoming timetables
//     const upcomingQuery = `
//       SELECT *
//       FROM timetables
//       WHERE employee_id = $1
//         AND effective_startdate > $2::timestamptz
//       ORDER BY effective_startdate ASC
//     `;
//     const upcomingValues = [employeeId, currentDate];
//     const upcomingResult = await pool().query(upcomingQuery, upcomingValues);

//     if (currentResult.rowCount === 0 && upcomingResult.rowCount === 0) {
//       throw new Error('No timetables found for employee.');
//     }

//     return {
//       current: currentResult.rows,
//       upcoming: upcomingResult.rows,
//     };
//   } catch (error) {
//     console.error('Error in timetableModel.getCurrentAndUpcomingTimetables:', error);
//     throw error;
//   }
// };

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
    const query = `
      CALL create_employee_timetable(
        $1::BIGINT, $2::TIMESTAMPTZ, $3::SMALLINT,
        $4::TIMESTAMPTZ, $5::TIMESTAMPTZ,
        $6::BIGINT, $7::TIMESTAMPTZ, NULL::JSONB
      );
    `;
    const values = [
      employee_id,
      current_date,
      rest_day_number,
      effective_start_date,
      effective_end_date,
      created_by,
      created_at,
    ];

    await client.query(query, values);
  } finally {
    client.release();
  }
};


export default {
  getCurrentAndUpcomingTimetables,
  createEmployeeTimetable
};

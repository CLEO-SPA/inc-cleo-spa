import { pool } from '../config/database.js';

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
        AND created_at BETWEEN COALESCE($3::timestamptz, '0001-01-01T00:00:00Z') AND $4::timestamptz
      ORDER BY effective_startdate DESC
      LIMIT 1
    `;

    const currentValues = [employeeId, currentDate, start_date_utc, end_date_utc];
    const currentResult = await pool().query(currentQuery, currentValues);

    // Query for upcoming timetables
    const upcomingQuery = `
      SELECT *
      FROM timetables
      WHERE employee_id = $1
        AND effective_startdate > $2::timestamptz
        AND created_at BETWEEN COALESCE($3::timestamptz, '0001-01-01T00:00:00Z') AND $4::timestamptz
      ORDER BY effective_startdate ASC
    `;
    const upcomingValues = [employeeId, currentDate, start_date_utc, end_date_utc];
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


export default {
  getCurrentAndUpcomingTimetables,
};

// controllers/timetableController.ts
import { Request, Response, NextFunction } from 'express';
import timetableModel from '../models/timetableModel.js';

const getCurrentAndUpcomingTimetables = async (req: Request, res: Response, next: NextFunction) => {
  const { employeeId } = req.params;
  const { currentDate } = req.query;
  const { start_date_utc, end_date_utc } = req.session;

  console.log("Employeeid, "+ employeeId)

  if (!employeeId || !currentDate) {
    return res.status(400).json({ message: 'Missing employeeId or session date' });
  }

  const currentDateTime = new Date(currentDate as string).toISOString();

  try {
    const { current, upcoming } = await timetableModel.getCurrentAndUpcomingTimetables(
      parseInt(employeeId),
      currentDateTime,
      start_date_utc!,
      end_date_utc!
    );

    res.status(200).json({
      current_timetables: current,
      upcoming_timetables: upcoming,
    });
  } catch (error) {
    console.error('Error getting employee timetables:', error);
    next(error);
  }
};


export default {
  getCurrentAndUpcomingTimetables,
};

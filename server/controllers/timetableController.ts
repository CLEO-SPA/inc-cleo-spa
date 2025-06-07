// controllers/timetableController.ts
import { Request, Response, NextFunction } from 'express';
import timetableModel from '../models/timetableModel.js';

const getCurrentAndUpcomingTimetables = async (req: Request, res: Response, next: NextFunction) => {
  const { employeeId } = req.params;
  const { currentDate } = req.query;
  const { start_date_utc, end_date_utc } = req.session;

  console.log('Employeeid, ' + employeeId);
  console.log('currentDate, ' + currentDate);
  console.log('start_date_utc, ' + start_date_utc);
  console.log('end_date_utc, ' + end_date_utc);
  console.log('req.session.start_date_utc:', req.session.start_date_utc);
  console.log('req.session.end_date_utc:', req.session.end_date_utc);

  if (!employeeId || !currentDate) {
    return res.status(400).json({ message: 'Missing employeeId or session date' });
  }

  const currentDateTime = new Date(currentDate as string).toISOString();
  console.log('currentDateTime, ' + currentDateTime);

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

const createTimetable = async (req: Request, res: Response) => {
  try {
    const data = await timetableModel.createEmployeeTimetable({
      ...req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create timetable:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create timetable';

    res.status(500).json({ message: errorMessage });
  }
};

export default {
  getCurrentAndUpcomingTimetables,
  createTimetable,
};


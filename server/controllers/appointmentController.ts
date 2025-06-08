import { Request, Response, NextFunction } from 'express';
import model from '../models/appointmentModel.js';

const getAllAppointments = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const offset = (page - 1) * limit;
  const { startDate_utc, endDate_utc } = req.session as typeof req.session & {
    startDate_utc?: string;
    endDate_utc?: string;
  };

  try {
    const { appointments, totalPages } = await model.getAllAppointments(
      offset,
      limit,
      startDate_utc ?? null,
      endDate_utc ?? null
    );

    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      pageSize: limit,
      data: appointments,
    });
  } catch (error) {
    console.log('Error getting appointments:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error getting appointments', error: errorMessage });
  }
};

const getAppointmentsByDate = async (req: Request, res: Response) => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const { appointments, totalCount } = await model.getAppointmentsByDate(date);

    res.status(200).json({
      date: date,
      totalCount: totalCount,
      data: appointments,
    });
  } catch (error) {
    console.log('Error getting appointments by date:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error getting appointments by date', error: errorMessage });
  }
};


// const getAvailableTimeslotsByEmployee = async (req: Request, res: Response) => {
//   const { employeeId, appointmentDate } = req.params;

//   // Default to null if employeeId is 'null', 'undefined', or 'anyAvailableStaff'
//   const parsedEmployeeId = employeeId === 'null' || employeeId === 'undefined' || employeeId === 'anyAvailableStaff'
//     ? null
//     : parseInt(employeeId, 10);

//   if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
//     return res.status(400).json({ message: 'Invalid or missing appointmentDate. Use format YYYY-MM-DD.' });
//   }

//   try {
//     const timeslots = await model.getAvailableTimeslotsByEmployee(
//       appointmentDate,
//       parsedEmployeeId
//     );
//     // Strip trailing seconds
//     const formatted = timeslots.map(({ timeslot }) => ({
//       timeslot: timeslot.slice(0, 5),
//     }));

//     res.status(200).json({
//       employeeId,
//       appointmentDate,
//       availableTimeslots: formatted,
//     });
//   } catch (error) {
//     console.log('Error getting available timeslots:', error);
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     res.status(500).json({
//       message: 'Error getting available timeslots',
//       error: errorMessage,
//     });
//   }
// };


const getAvailableTimeslotsByEmployee = async (req: Request, res: Response) => {
  const { employeeId, appointmentDate } = req.params;

  // parse employeeId
  const parsedEmployeeId = 
    employeeId === 'null' ||
    employeeId === 'undefined' ||
    employeeId === 'anyAvailableStaff'
      ? null
      : parseInt(employeeId, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    return res
      .status(400)
      .json({ message: 'Invalid appointmentDate. Use format YYYY-MM-DD.' });
  }

  try {
    // 1) fetch timeslots
    const timeslots = await model.getAvailableTimeslotsByEmployee(
      appointmentDate,
      parsedEmployeeId
    );
    const formattedSlots = timeslots.map(({ timeslot }) => ({
      timeslot: timeslot.slice(0, 5),
    }));

    // 2) fetch warning
    const warning = await model.checkRestdayConflict(
      parsedEmployeeId,
      appointmentDate
    );

    res.status(200).json({
      employeeId: parsedEmployeeId,
      appointmentDate,
      availableTimeslots: formattedSlots,
      warning,   // either the warning string or null
    });
  } catch (error) {
    console.error('Error getting available timeslots or warning:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      message: 'Error fetching available timeslots or restday warning',
      error: msg,
    });
  }
};

export default {
  getAllAppointments,
  getAppointmentsByDate,
  getAvailableTimeslotsByEmployee
};
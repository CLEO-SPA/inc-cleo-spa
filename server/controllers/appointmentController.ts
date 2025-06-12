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

const getAppointmentsByDate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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

interface AppointmentItem {
  servicing_employee_id: number;
  appointment_date: string; // "YYYY-MM-DD"
  start_time: string;       // ISO timestamp or "YYYY-MM-DDTHH:MM:SS+TZ"
  end_time: string;
  remarks?: string;
}

interface BulkAppointmentBody {
  member_id: number;
  appointments: AppointmentItem[];
  created_by: number;
  created_at?: string; // optional: if not provided, use now()
}

const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const body: BulkAppointmentBody = req.body;
    if (
      typeof body.member_id !== 'number' ||
      !Array.isArray(body.appointments) ||
      body.appointments.length === 0 ||
      typeof body.created_by !== 'number'
    ) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const memberId = body.member_id;
    const createdBy = body.created_by;
    const createdAt = body.created_at || new Date().toISOString();

    // Normalize each appointment’s start_time/end_time to full ISO with date
    const normAppointments = body.appointments.map(app => {
      const { servicing_employee_id, appointment_date, start_time, end_time, remarks } = app;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
        throw new Error(`Invalid appointment_date format for ${appointment_date}. Use YYYY-MM-DD`);
      }

      const normalizeTimestamp = (timeStr: string, fieldName: string) => {
        // If already a full ISO or contains 'T', assume it’s OK
        if (timeStr.includes('T')) {
          return timeStr;
        }
        // If format "HH:MM", combine with date
        const hmMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
        if (hmMatch) {
          // Append seconds and timezone offset; adjust "+08:00" as needed or derive from server config
          return `${appointment_date}T${timeStr}:00+08:00`;
        }
        // Otherwise invalid
        throw new Error(`Invalid time format for ${fieldName}: "${timeStr}". Use "HH:MM" or full ISO.`);
      };

      const normStart = normalizeTimestamp(start_time, 'start_time');
      const normEnd = normalizeTimestamp(end_time, 'end_time');

      return {
        servicing_employee_id,
        appointment_date, // still needed for rest-day check
        start_time: normStart,
        end_time: normEnd,
        remarks,
      };
    });

    // If single appointment, rest-day conflict check
    if (normAppointments.length === 1) {
      const single = normAppointments[0];
      const empId = single.servicing_employee_id;
      const apptDate = single.appointment_date;
      const warning = await model.checkRestdayConflict(empId, apptDate);
      if (warning) {
        return res.status(400).json({ message: warning });
      }
    }

    // Call model with normalized appointments
    await model.createAppointment(memberId, normAppointments, createdBy, createdAt);

    return res.status(201).json({ message: `Successfully created ${normAppointments.length} appointment(s)` });
  } catch (error) {
    console.error('Error in createAppointment:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = /conflict|Invalid/.test(msg) ? 400 : 500;
    return res.status(statusCode).json({ message: msg });
  }
};

// Get max duration info for all start times
const getMaxDurationFromStartTimes = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { employeeId, date } = req.params;
  
  // Parse employeeId
  const parsedEmployeeId =
    employeeId === 'null' ||
    employeeId === 'undefined' ||
    employeeId === 'anyAvailableStaff'
      ? null
      : parseInt(employeeId, 10);
      
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: 'Invalid date. Use format YYYY-MM-DD.' });
  }
  
  try {
    const rows = await model.getMaxDurationFromStartTimes(
      date,
      parsedEmployeeId
    );
    
    // Format the response
    const maxDurations = rows.map(row => ({
      startTime: row.start_time.slice(0, 5),
      maxEndTime: row.max_end_time.slice(0, 5),
      maxDurationMinutes: row.max_duration_minutes
    }));

    // 3) Fetch warning as before
    const warning = await model.checkRestdayConflict(
      parsedEmployeeId,
      date
    );
    
    res.status(200).json({
      employeeId: parsedEmployeeId,
      date,
      maxDurations,
      warning,
    });
  } catch (error) {
    console.error('Error getting max durations:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      message: 'Error fetching max durations',
      error: msg,
    });
  }
};

// Get available end times for a specific start time
const getEndTimesForStartTime = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { employeeId, date, startTime } = req.params;
  
  // Parse employeeId
  const parsedEmployeeId =
    employeeId === 'null' ||
    employeeId === 'undefined' ||
    employeeId === 'anyAvailableStaff'
      ? null
      : parseInt(employeeId, 10);
      
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: 'Invalid date. Use format YYYY-MM-DD.' });
  }
  
  // Validate time format HH:MM
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return res
      .status(400)
      .json({ message: 'Invalid startTime. Use format HH:MM.' });
  }
  
  try {
    // Fetch available end times for the specific start time
    const endTimes = await model.getEndTimesForStartTime(
      date,
      startTime,
      parsedEmployeeId
    );
    
    // Format to HH:MM
    const formattedEndTimes = endTimes.map(row => 
      row.end_time.slice(0, 5)
    );
    
    res.status(200).json({
      employeeId: parsedEmployeeId,
      date,
      startTime,
      availableEndTimes: formattedEndTimes,
    });
  } catch (error) {
    console.error('Error getting end times for start time:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      message: 'Error fetching end times for start time',
      error: msg,
    });
  }
};


export default {
  getAllAppointments,
  getAppointmentsByDate,
  createAppointment,
  getMaxDurationFromStartTimes,
  getEndTimesForStartTime
};
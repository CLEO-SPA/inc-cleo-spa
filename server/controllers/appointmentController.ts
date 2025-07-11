/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import model from '../models/appointmentModel.js';

/**
 * GET /ab
 * Paginated + filtered list of appointments
 * Query params:
 * - page: number
 * - limit: number
 * - startDate: yyyy-mm-dd (optional)
 * - endDate: yyyy-mm-dd (optional)
 * - employeeId: number (optional)
 * - memberId: number (optional)
 * - sortOrder: 'asc' | 'desc'
 * - status: 'upcoming' | 'finished' (optional)
 */
const getAllAppointments = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const offset = (page - 1) * limit;

  // Optional filters from query string
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  const memberId = req.query.memberId ? Number(req.query.memberId) : undefined;
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  const status = req.query.status === 'upcoming' || req.query.status === 'finished'
    ? req.query.status
    : undefined;

  try {
    const { appointments, totalPages, totalCount } = await model.getAllAppointments(
      offset,
      limit,
      startDate ?? null,
      endDate ?? null,
      employeeId,
      memberId,
      sortOrder,
      status
    );

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalCount,
      pageSize: limit,
      data: appointments,
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      message: 'Error getting appointments',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * GET /ab/date/:date
 * Fetch all appointments for a specific day (used by schedule view)
 * Validates date format: YYYY-MM-DD
 */
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error getting appointments by date', error: errorMessage });
  }
};

/**
 * GET /ab/id/:id
 * Fetch single appointment by ID
 */
const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid appointment ID' });
      return;
    }

    const appointment = await model.getAppointmentById(id);

    console.log('Fetched appointment:', appointment);

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error in getAppointmentById:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
};

interface AppointmentCreateBody {
  member_id: number;
  appointments: Array<{
    servicing_employee_id?: number | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    remarks: string;
  }>;
  created_by: number;
  created_at?: string;
}

interface AppointmentUpdateBody {
  member_id: number;
  appointment: {
    id: number;
    servicing_employee_id?: number | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    remarks: string;
  };
  updated_by: number;
  updated_at?: string;
}

type AnyBody = AppointmentCreateBody & Partial<AppointmentUpdateBody>;

const validateEmployeeAndMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const body = req.body as AnyBody;

    const { member_id, created_by, updated_by } = body;

    // 1) member_id is required and must be positive integer
    if (member_id === null || member_id === undefined) {
      return res.status(400).json({ message: 'Member ID is required' });
    }
    if (typeof member_id !== 'number' || !Number.isInteger(member_id) || member_id <= 0) {
      return res.status(400).json({ message: 'Member ID must be a positive integer' });
    }
    // Validate member exists (and active if applicable)
    const memberResult = await model.validateMemberIsActive(member_id);
    if (!memberResult) {
      return res
        .status(404)
        .json({ message: `Member ID ${member_id} was not found` });
    }

    // 2) Determine operation: create vs update
    const hasCreatedBy = created_by !== undefined;
    const hasUpdatedBy = updated_by !== undefined;
    if (hasCreatedBy && hasUpdatedBy) {
      return res
        .status(400)
        .json({ message: 'Provide either created_by (for creation) or updated_by (for update), not both' });
    }
    if (!hasCreatedBy && !hasUpdatedBy) {
      return res
        .status(400)
        .json({ message: 'Either created_by (for creation) or updated_by (for update) is required' });
    }

    // 3) Validate created_by or updated_by
    if (hasCreatedBy) {
      if (created_by === null) {
        return res.status(400).json({ message: 'created_by cannot be null' });
      }
      if (typeof created_by !== 'number' || !Number.isInteger(created_by) || created_by <= 0) {
        return res.status(400).json({ message: 'created_by must be a positive integer' });
      }
      const exists = await model.validateEmployeeIsActive(created_by);
      if (!exists) {
        return res
          .status(404)
          .json({ message: `created_by employee ID ${created_by} was not found or is not active` });
      }
    }
    if (hasUpdatedBy) {
      if (updated_by === null) {
        return res.status(400).json({ message: 'updated_by cannot be null' });
      }
      if (typeof updated_by !== 'number' || !Number.isInteger(updated_by) || updated_by <= 0) {
        return res.status(400).json({ message: 'updated_by must be a positive integer' });
      }
      const exists = await model.validateEmployeeIsActive(updated_by);
      if (!exists) {
        return res
          .status(400)
          .json({ message: `updated_by employee ID ${updated_by} does not exist or is not active` });
      }
    }

    // 4) Validate servicing_employee_id per appointment
    if (hasCreatedBy) {
      // Creation: expect body.appointments as array
      const apps = (body as AppointmentCreateBody).appointments;
      if (!Array.isArray(apps) || apps.length === 0) {
        return res.status(400).json({ message: 'appointments array is required and cannot be empty for creation' });
      }
      for (let i = 0; i < apps.length; i++) {
        const idx = i + 1;
        const appItem = apps[i];
        const empId = appItem.servicing_employee_id;
        if (empId === null || empId === undefined) {
          // null => random assignment; skip existence check
          continue;
        }
        if (typeof empId !== 'number' || !Number.isInteger(empId) || empId <= 0) {
          return res
            .status(400)
            .json({ message: `Invalid servicing_employee_id at appointment index ${idx}` });
        }
        const exists = await model.validateEmployeeIsActive(empId);
        if (!exists) {
          return res
            .status(404)
            .json({ message: `Servicing employee ID ${empId} at appointment index ${idx} was not found or is not active` });
        }
      }
    } else if (hasUpdatedBy) {
      // Update: expect body.appointment as single object
      const app = (body as AppointmentUpdateBody).appointment;
      if (!app || typeof app !== 'object') {
        return res.status(400).json({ message: 'appointment object is required for update' });
      }
      const empId = (app as any).servicing_employee_id;
      if (empId === null || empId === undefined) {
        // skip check
      } else {
        if (typeof empId !== 'number' || !Number.isInteger(empId) || empId <= 0) {
          return res.status(400).json({ message: 'Invalid servicing_employee_id in appointment for update' });
        }
        const exists = await model.validateEmployeeIsActive(empId);
        if (!exists) {
          return res
            .status(404)
            .json({ message: `Servicing employee ID ${empId} was not found or is not active` });
        }
      }
    }

    // All validations passed
    next();
  } catch (error) {
    console.error('Error validating employee and member:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      message: 'Error validating employee and member',
      error: errorMessage,
    });
  }
};


const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const body = req.body as AnyBody;

    // Basic shape validation
    if (
      typeof body.member_id !== 'number' ||
      !Array.isArray(body.appointments) ||
      body.appointments.length === 0 ||
      typeof body.created_by !== 'number'
    ) {
      return res.status(400).json({ message: 'Invalid request body: missing required fields' });
    }

    const memberId = body.member_id;
    const createdBy = body.created_by;
    const createdAt = body.created_at || new Date().toISOString();

    // Validate and normalize each appointment
    const normAppointments: {
      servicing_employee_id: number | null;
      appointment_date: string;
      start_time: string;
      end_time: string;
      remarks?: string;
    }[] = [];

    for (let i = 0; i < body.appointments.length; i++) {
      const app = body.appointments[i];
      const idx = i + 1;

      if (typeof app.appointment_date !== 'string') {
        return res.status(400).json({ message: `Invalid or missing appointment_date at appointment ${idx}` });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(app.appointment_date)) {
        return res.status(400).json({ message: `Invalid appointment_date format at appointment ${idx}: use YYYY-MM-DD` });
      }

      if (typeof app.start_time !== 'string') {
        return res.status(400).json({ message: `Invalid or missing start_time at appointment ${idx}` });
      }
      if (typeof app.end_time !== 'string') {
        return res.status(400).json({ message: `Invalid or missing end_time at appointment ${idx}` });
      }

      // remarks is compulsory and must be a non empty string
      if (typeof app.remarks !== 'string' || app.remarks.trim() === '') {
        return res.status(400).json({ message: `Invalid or missing remarks at appointment ${idx}` });
      }

      const appointment_date = app.appointment_date;

      // Normalize timestamp helper
      const normalizeTimestamp = (timeStr: string, fieldName: string) => {
        if (timeStr.includes('T')) {
          return timeStr;
        }
        const hmMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
        if (hmMatch) {
          return `${appointment_date}T${timeStr}:00+08:00`;
        }
        throw new Error(`Invalid time format for ${fieldName} at appointment ${idx}: "${timeStr}". Use "HH:MM" or full ISO.`);
      };

      let normStart: string, normEnd: string;
      try {
        normStart = normalizeTimestamp(app.start_time, 'start_time');
        normEnd = normalizeTimestamp(app.end_time, 'end_time');
      } catch (err) {
        return res.status(400).json({ message: (err as Error).message });
      }

      // Extract HH:MM for comparisons
      const extractHHMM = (isoTs: string): string => {
        // Assumes format "...THH:MM" somewhere
        const match = isoTs.match(/T(\d{2}:\d{2})/);
        return match ? match[1] : '';
      };
      const startHHMM = extractHHMM(normStart);
      const endHHMM = extractHHMM(normEnd);
      if (!startHHMM || !endHHMM) {
        return res
          .status(400)
          .json({ message: `Unable to parse time portion at appointment ${idx}` });
      }

      // Convert "HH:MM" to minutes since midnight
      const toMinutes = (hhmm: string): number => {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
      };
      const startMins = toMinutes(startHHMM);
      const endMins = toMinutes(endHHMM);

      // 1) Ensure start < end
      if (startMins >= endMins) {
        return res
          .status(400)
          .json({ message: `start_time must be earlier than end_time at appointment ${idx}` });
      }

      // 2) Check start window: between 10:00 (600) and 18:30 (1110) inclusive
      if (startMins < 10 * 60 || startMins > (18 * 60 + 30)) {
        return res.status(400).json({
          message: `start_time at appointment ${idx} must be between 10:00 and 18:30`,
        });
      }
      // 3) Check end window: between 10:30 (630) and 21:00 (1260) inclusive
      if (endMins < (10 * 60 + 30) || endMins > (21 * 60)) {
        return res.status(400).json({
          message: `end_time at appointment ${idx} must be between 10:30 and 21:00`,
        });
      }

      normAppointments.push({
        servicing_employee_id: app.servicing_employee_id ?? null,
        appointment_date,
        start_time: normStart,
        end_time: normEnd,
        remarks: app.remarks,
      });
    }

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
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    // Determine status by SQLSTATE code if available
    const code = error.code;  // SQLSTATE from Postgres
    let statusCode = 500;
    let message = error.message;

    if (code === 'P0001') {
      // No available employee due to all having conflicting appointments
      statusCode = 409;
      message = error.message;
    } else if (code === 'P0002' || code === 'P0003') {
      // Conflict detected
      statusCode = 409;
      message = error.message;
    } else if (/Invalid/.test(error.message)) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
    return res.status(statusCode).json({ message });
  }
};


const getAvailableTimeslots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { employeeId, date, excludeAppointmentId } = req.query;

  // Input validation
  const validationErrors = validateTimeslotParams({ employeeId, date });
  if (validationErrors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors: validationErrors
    });
    return;
  }

  // Parse and sanitize inputs
  const parsedEmployeeId = parseEmployeeId(employeeId as string);
  const excludeId = excludeAppointmentId ?
    parseInt(excludeAppointmentId as string, 10) : null;

  try {
    const rows = await model.getMaxDurationFromStartTimes(
      date as string,
      parsedEmployeeId,
      excludeId
    );

    const maxDurations = rows.map(row => ({
      startTime: row.start_time.slice(0, 5),
      maxEndTime: row.max_end_time.slice(0, 5),
      maxDurationMinutes: row.max_duration_minutes
    }));

    const warning = await model.checkRestdayConflict(
      parsedEmployeeId,
      date as string
    );

    res.status(200).json({
      employeeId: parsedEmployeeId,
      date,
      maxDurations: maxDurations,
      warning,
    });
  } catch (error) {
    next(error); // Use error middleware instead of inline handling
  }
};

const getEndTimesForStartTime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { employeeId, date, startTime, excludeAppointmentId } = req.query;

  // Input validation
  const validationErrors = validateEndTimeParams({ employeeId, date, startTime });
  if (validationErrors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors: validationErrors
    });
    return;
  }

  const parsedEmployeeId = parseEmployeeId(employeeId as string);
  const excludeId = excludeAppointmentId ?
    parseInt(excludeAppointmentId as string, 10) : null;

  try {
    const endTimes = await model.getEndTimesForStartTime(
      date as string,
      startTime as string,
      parsedEmployeeId,
      excludeId
    );

    const formattedEndTimes = endTimes.map(row => row.end_time.slice(0, 5));

    res.status(200).json({
      employeeId: parsedEmployeeId,
      date,
      startTime,
      availableEndTimes: formattedEndTimes,
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for better maintainability
const parseEmployeeId = (employeeId: string): number | null => {
  if (employeeId === 'null' ||
    employeeId === 'undefined' ||
    employeeId === 'anyAvailableStaff') {
    return null;
  }
  return parseInt(employeeId, 10);
};

const validateTimeslotParams = (params: any): string[] => {
  const errors: string[] = [];

  if (!params.date || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD.');
  }

  return errors;
};

const validateEndTimeParams = (params: any): string[] => {
  const errors = validateTimeslotParams(params);

  if (!params.startTime || !/^\d{2}:\d{2}$/.test(params.startTime)) {
    errors.push('Invalid startTime format. Use HH:MM.');
  }

  return errors;
};

const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const body = req.body as AnyBody;

    // Basic shape validation
    if (
      typeof body.member_id !== 'number' ||
      typeof body.updated_by !== 'number' ||
      typeof body.appointment !== 'object' ||
      body.appointment === null
    ) {
      return res.status(400).json({ message: 'Invalid request body: missing required fields' });
    }

    const memberId = body.member_id;
    const updatedBy = body.updated_by;
    const updatedAt = body.updated_at || new Date().toISOString();

    const app = body.appointment;

    if (typeof app.id === 'string') {
      app.id = parseInt(app.id, 10);
    }
    // Validate fields for this single appointment
    // 1) id must exist and belong to member
    if (
      typeof app.id !== 'number' ||
      !Number.isInteger(app.id) ||
      app.id <= 0
    ) {
      return res.status(400).json({ message: `Invalid or missing id in appointment` });
    }
    // 2) appointment_date
    if (typeof app.appointment_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(app.appointment_date)
    ) {
      return res.status(400).json({ message: `Invalid appointment_date: use YYYY-MM-DD` });
    }
    const appointment_date = app.appointment_date;

    // 3) start_time / end_time
    if (typeof app.start_time !== 'string') {
      return res.status(400).json({ message: `Invalid or missing start_time in appointment` });
    }
    if (typeof app.end_time !== 'string') {
      return res.status(400).json({ message: `Invalid or missing end_time in appointment` });
    }

    // 4) remarks must be non-empty string
    if (typeof app.remarks !== 'string' || app.remarks.trim() === '') {
      return res.status(400).json({ message: `Invalid or missing remarks in appointment` });
    }

    // Normalize timestamp helper
    const normalizeTimestamp = (timeStr: string, fieldName: string) => {
      if (timeStr.includes('T')) {
        return timeStr;
      }
      const hmMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
      if (hmMatch) {
        return `${appointment_date}T${timeStr}:00+08:00`;
      }
      throw new Error(
        `Invalid time format for ${fieldName}: "${timeStr}". Use "HH:MM" or full ISO.`
      );
    };

    let normStart: string, normEnd: string;
    try {
      normStart = normalizeTimestamp(app.start_time, 'start_time');
      normEnd = normalizeTimestamp(app.end_time, 'end_time');
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }

    // Validate time windows and ordering
    const startTime = new Date(normStart);
    const endTime = new Date(normEnd);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ message: 'Invalid start_time or end_time format' });
    }
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;

    // Start must be < end
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'start_time must be earlier than end_time' });
    }
    // Start between 10:00 (10) and 18:30 (18.5)
    if (startHour < 10 || startHour > 18.5) {
      return res.status(400).json({ message: 'start_time must be between 10:00 and 18:30' });
    }
    // End between 10:30 (10.5) and 21:00 (21)
    if (endHour < 10.5 || endHour > 21) {
      return res.status(400).json({ message: 'end_time must be between 10:30 and 21:00' });
    }

    const normAppointment = {
      id: app.id,
      servicing_employee_id: app.servicing_employee_id ?? null,
      appointment_date,
      start_time: normStart,
      end_time: normEnd,
      remarks: app.remarks.trim(),
    };

    // Rest-day conflict check for single appointment
    const empId = normAppointment.servicing_employee_id;
    const warning = await model.checkRestdayConflict(empId, appointment_date);
    if (warning) {
      return res.status(400).json({ message: warning });
    }

    // Call model update; wrap in array if the procedure expects a JSON array
    await model.updateAppointment(memberId, [normAppointment], updatedBy, updatedAt);

    return res
      .status(200)
      .json({ message: `Successfully updated appointment id ${normAppointment.id}` });
  } catch (error: any) {
    console.error('Error in updateAppointment:', error);
    // Determine status by SQLSTATE code if available
    const code = error.code;  // SQLSTATE from Postgres
    let statusCode = 500;
    let message = error.message;

    if (code === 'P0001') {
      // No available employee due to all having conflicting appointments
      statusCode = 409;
      message = error.message;
    } else if (code === 'P0002') {
      // Conflict detected
      statusCode = 409;
      message = error.message;
    } else if (/Invalid/.test(error.message)) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
    return res.status(statusCode).json({ message });
  }
};

// -----------------------------------------------------------------------------
// GET /ab/count/:date — appointment count for a day
// -----------------------------------------------------------------------------
 const getAppointmentCountByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const count = await model.getAppointmentCountByDate(date);
    res.status(200).json({ date, count });
  } catch (error) {
    console.error('Error getting appointment count by date:', error);
    res.status(500).json({ message: 'Failed to fetch appointment count' });
  }
};


export default {
  getAllAppointments,
  getAppointmentsByDate,
  getAppointmentById,
  validateEmployeeAndMember,
  createAppointment,
  updateAppointment,
  getAvailableTimeslots,
  getEndTimesForStartTime,
  getAppointmentCountByDate
};
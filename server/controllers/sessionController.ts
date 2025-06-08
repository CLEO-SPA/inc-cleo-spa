import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { getProdPool as pool } from '../config/database.js';
import { addSseClient, testNotification } from '../services/sseService.js';
import { SystemParameters } from '../types/model.types.js';

const setDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { start_date_utc, end_date_utc } = req.body; // Expecting UTC ISO strings

  if (start_date_utc === null || start_date_utc === undefined) {
    delete req.session.start_date_utc;
  } else if (start_date_utc) {
    if (!validator.isISO8601(start_date_utc)) {
      res.status(400).json({ message: 'Invalid start date format. Expected ISO8601.' });
      return;
    }
    req.session.start_date_utc = start_date_utc;
  }

  if (end_date_utc === null || end_date_utc === undefined) {
    delete req.session.end_date_utc;
  } else if (end_date_utc) {
    if (!validator.isISO8601(end_date_utc)) {
      res.status(400).json({ message: 'Invalid end date format. Expected ISO8601.' });
      return;
    }
    req.session.end_date_utc = end_date_utc;
  }

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ message: 'Failed to save session while setting date range.' });
    }
    res.status(200).json({
      message: 'Date range updated in session successfully.',
      start_date_utc: req.session.start_date_utc || null,
      end_date_utc: req.session.end_date_utc || null,
    });
  });
};

const getDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { start_date_utc, end_date_utc } = req.session; // These are UTC ISO strings
  res.status(200).json({
    start_date_utc: start_date_utc || null,
    end_date_utc: end_date_utc || null,
  });
};

const toggleSimulation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { is_simulation, start_date_utc, end_date_utc } = req.body;

  try {
    if (is_simulation === null || is_simulation === undefined) {
      res.status(400).json({ message: 'is_simulation is required.' });
      return;
    }

    const funcQuery = `SELECT set_simulation($1, $2, $3)`;
    const values = [is_simulation, start_date_utc, end_date_utc];

    const { rows, rowCount } = await pool().query(funcQuery, values);

    // console.log('\n', typeof rows, rows);

    if (rowCount === 0) {
      res.status(400).json({ message: 'Failed to toggle simulation.' });
      return;
    }

    res.status(200).json({
      message: 'Simulation state updated successfully.',
      is_simulation: rows[0].result,
      start_date_utc: start_date_utc || null,
      end_date_utc: end_date_utc || null,
    });
  } catch (error) {
    console.error('Error toggling simulation:', error);
    res.status(500).json({ message: 'Failed to toggle simulation.' });
    return;
  }
};

const getSimulation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = 'SELECT * FROM system_parameters WHERE id = $1';
    const values = [1];

    const result = await pool().query<SystemParameters>(query, values);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Simulation state not found.' });
      return;
    }

    const simulationState = result.rows[0];
    res.status(200).json({
      is_simulation: simulationState.is_simulation,
      start_date_utc: simulationState.start_date_utc,
      end_date_utc: simulationState.end_date_utc,
    });
  } catch (error) {
    throw new Error('Failed to fetch simulation state.');
  }
};

// SSE Event
const streamSimEvent = async (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addSseClient(req, res);

  res.write('event: connected\n');
  res.write('data: {"message": "SSE connection established"}\n\n');
};

const testSSE = async (req: Request, res: Response, next: NextFunction) => {
  await testNotification();
  res.json({ message: 'Test notification sent' });
};

const getAllStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sql = 'SELECT * FROM statuses';
    const { rows } = await pool().query(sql);

    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

const getStatusNameById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      throw new Error('Missing or Invalid id');
    }

    const sql = 'SELECT * FROM statuses WHERE id = $1';
    const { rows } = await pool().query(sql, [id]);

    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: `Status with id ${id} not found` });
    }
  } catch (error) {
    next(error);
  }
};

export default {
  setDateRange,
  getDateRange,
  toggleSimulation,
  getSimulation,
  streamSimEvent,
  testSSE,
};

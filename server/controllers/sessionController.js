import validator from 'validator';
import { getProdPool as pool } from '../config/database.js';
import { addSseClient, testNotification } from '../services/sseService.js';

const setDateRange = (req, res) => {
  const { startDate_utc, endDate_utc } = req.body; // Expecting UTC ISO strings

  if (startDate_utc === null || startDate_utc === undefined) {
    delete req.session.startDate_utc;
  } else if (startDate_utc) {
    if (!validator.isISO8601(startDate_utc)) {
      return res.status(400).json({ message: 'Invalid start date format. Expected ISO8601.' });
    }
    req.session.startDate_utc = startDate_utc;
  }

  if (endDate_utc === null || endDate_utc === undefined) {
    delete req.session.endDate_utc;
  } else if (endDate_utc) {
    if (!validator.isISO8601(endDate_utc)) {
      return res.status(400).json({ message: 'Invalid end date format. Expected ISO8601.' });
    }
    req.session.endDate_utc = endDate_utc;
  }

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ message: 'Failed to save session while setting date range.' });
    }
    res.status(200).json({
      message: 'Date range updated in session successfully.',
      startDate_utc: req.session.startDate_utc || null,
      endDate_utc: req.session.endDate_utc || null,
    });
  });
};

const getDateRange = (req, res) => {
  const { startDate_utc, endDate_utc } = req.session; // These are UTC ISO strings
  res.status(200).json({
    startDate_utc: startDate_utc || null,
    endDate_utc: endDate_utc || null,
  });
};

const toggleSimulation = async (req, res) => {
  const { is_simulation, startDate_utc, endDate_utc } = req.body;

  try {
    if (is_simulation === null || is_simulation === undefined) {
      return res.status(400).json({ message: 'is_simulation is required.' });
    }

    const funcQuery = `SELECT set_simulation($1, $2, $3)`;
    const values = [is_simulation, startDate_utc, endDate_utc];

    const { rows, rowCount } = await pool().query(funcQuery, values);

    // console.log('\n', typeof rows, rows);

    if (rowCount === 0) {
      return res.status(400).json({ message: 'Failed to toggle simulation.' });
    }

    res.status(200).json({
      message: 'Simulation state updated successfully.',
      is_simulation: rows[0].result,
      startDate_utc: startDate_utc || null,
      endDate_utc: endDate_utc || null,
    });
  } catch (error) {
    console.error('Error toggling simulation:', error);
    return res.status(500).json({ message: 'Failed to toggle simulation.' });
  }
};

const getSimulation = async (req, res) => {
  try {
    const query = 'SELECT * FROM system_parameters WHERE id = $1';
    const values = [1];

    const result = await pool().query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Simulation state not found.' });
    }

    const simulationState = result.rows[0];
    res.status(200).json({
      is_simulation: simulationState.is_simulation,
      startDate_utc: simulationState.start_date_utc,
      endDate_utc: simulationState.end_date_utc,
    });
  } catch (error) {
    console.error('Error fetching simulation state:', error);
    return res.status(500).json({ message: 'Failed to fetch simulation state.' });
  }
};

// SSE Event
const streamSimEvent = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addSseClient(req, res);

  res.write('event: connected\n');
  res.write('data: {"message": "SSE connection established"}\n\n');
};

const testSSE = async (req, res) => {
  await testNotification();
  res.json({ message: 'Test notification sent' });
};

export default {
  setDateRange,
  getDateRange,
  toggleSimulation,
  getSimulation,
  streamSimEvent,
  testSSE,
};

import validator from 'validator';
import { getProdPool } from '../config/database.js';

const pool = getProdPool();

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

    const callQuery = 'CALL set_simulation($1, $2, $3)';
    const values = [is_simulation, startDate_utc, endDate_utc];

    const result = await pool.query(callQuery, values);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to toggle simulation.' });
    }
  } catch (error) {
    console.error('Error toggling simulation:', error);
    return res.status(500).json({ message: 'Failed to toggle simulation.' });
  }
};

const updateSimulation = async (req, res) => {
  const { startDate_utc, endDate_utc } = req.body;

  try {
    if (startDate_utc === null || startDate_utc === undefined) {
      return res.status(400).json({ message: 'startDate_utc is required.' });
    }
    if (endDate_utc === null || endDate_utc === undefined) {
      return res.status(400).json({ message: 'endDate_utc is required.' });
    }

    const callQuery = 'CALL set_simulation($1, $2, $3)';
    const values = [true, startDate_utc, endDate_utc];

    const result = await pool.query(callQuery, values);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to update simulation.' });
    }
  } catch (error) {
    console.error('Error updating simulation:', error);
    return res.status(500).json({ message: 'Failed to update simulation.' });
  }
};

const getSimulation = async (req, res) => {
  try {
    const query = 'SELECT * FROM system_parameters WHERE id = $1';
    const values = [1];

    const result = await pool.query(query, values);
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

export default {
  setDateRange,
  getDateRange,
  toggleSimulation,
  updateSimulation,
  getSimulation,
};

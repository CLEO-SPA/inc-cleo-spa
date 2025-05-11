import validator from 'validator';

export const setDateRange = (req, res) => {
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

export const getDateRange = (req, res) => {
  const { startDate_utc, endDate_utc } = req.session; // These are UTC ISO strings
  res.status(200).json({
    startDate_utc: startDate_utc || null,
    endDate_utc: endDate_utc || null,
  });
};

export default {
  setDateRange,
  getDateRange,
};

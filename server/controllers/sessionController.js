import validator from 'validator';

const setDateRange = (req, res) => {
  const { startDate_utc, endDate_utc } = req.body;

  if (!startDate_utc || !endDate_utc) {
    return res.status(400).json({ error: 'Invalid date range' });
  }

  if (!validator.isISO8601(startDate_utc) || !validator.isISO8601(endDate_utc)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (new Date(startDate_utc) >= new Date(endDate_utc)) {
    return res.status(400).json({ error: 'Start date must be before end date' });
  }

  req.session.dateRange = {
    startDate: startDate_utc,
    endDate: endDate_utc,
  };

  res.status(200).json({ message: 'Date range set successfully' });
};

export default {
  setDateRange,
};

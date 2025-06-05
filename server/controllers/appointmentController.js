import model from '../models/appointmentModel.js';

const getAllAppointments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { startDate_utc, endDate_utc } = req.session;

  try {
    const { appointments, totalPages } = await model.getAllAppointments(offset, limit, startDate_utc, endDate_utc);

    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      pageSize: limit,
      data: appointments,
    });
  } catch (error) {
    console.log('Error getting appointments:', error);
    res.status(500).json({ message: 'Error getting appointments', error: error.message });
  }
};

const getAppointmentsByDate = async (req, res) => {
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
    res.status(500).json({ message: 'Error getting appointments by date', error: error.message });
  }
};

export default {
  getAllAppointments,
  getAppointmentsByDate,
};
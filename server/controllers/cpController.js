import model from '../models/cpModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';

const getAllCarePackages = async (req, res) => {
  const { startDate_utc, endDate_utc } = req.session;
  const limit = parseInt(req.query.limit) || 10;
  const afterCursor = req.query.after;
  const beforeCursor = req.query.before;
  const page = parseInt(req.query.page);
  const searchTerm = req.query.searchTerm;

  // console.log(`\n${startDate_utc} || ${endDate_utc} \n`);

  if (limit <= 0) {
    return res.status(400).json({ error: 'Limit must be a positive integer.' });
  }
  if (page && (isNaN(page) || page <= 0)) {
    return res.status(400).json({ error: 'Page must be a positive integer.' });
  }

  let after = null;
  if (afterCursor) {
    after = decodeCursor(afterCursor);
    if (!after) {
      return res.status(400).json({ error: 'Invalid "after" cursor.' });
    }
  }

  let before = null;
  if (beforeCursor) {
    before = decodeCursor(beforeCursor);
    if (!before) {
      return res.status(400).json({ error: 'Invalid "before" cursor.' });
    }
  }

  // Hybrid logic (Prioritize page over cursors if condition met)
  if (page && (after || before)) {
    console.warn('Both page and cursor parameters provided. Prioritizing page.');
    after = null;
    before = null;
  }

  try {
    const results = await model.getPaginatedCarePackages(
      limit,
      { after, before, page, searchTerm },
      startDate_utc,
      endDate_utc
    );
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in CarePackageController.getCarePackages:', error);
    res.status(500).json({ error: 'Failed to retrieve care packages.' });
  }
};

const getCarePackageById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const results = await model.getCarePackageById(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting carePackage By Id', error);
    res.status(500).json({ message: 'Error getting carePackage By Id', error: error.message });
  }
};

const createCarePackage = async (req, res) => {
  try {
    const { package_name, package_remarks, package_price, is_customizable, services, created_at, updated_at } =
      req.body;

    if (!package_name || !package_price || !Array.isArray(services)) {
      return res.status(400).json({ message: 'Missing required fields or invalid data format' });
    }

    const isValidService = services.every((s) => {
      return (
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        typeof s.quantity === 'number' &&
        s.quantity > 0 &&
        typeof s.price === 'number' &&
        s.price >= 0 &&
        typeof s.discount === 'number' &&
        s.discount >= 0 &&
        s.discount <= 1
      );
    });

    if (!isValidService) {
      return res.status(400).json({ message: 'Missing required fields or invalid data format' });
    }

    const results = await model.createCarePackage({
      package_name,
      package_remarks,
      package_price,
      services,
      is_customizable,
      created_at,
      updated_at,
    });

    res.status(201).json(results);
  } catch (error) {
    console.error('Error creating carePackage', error);
    res.status(500).json({ message: 'Error creating carePackage', error: error.message });
  }
};

const updateCarePackageById = async (req, res) => {
  try {
  } catch (error) {
    console.error('Error updating carePackage By Id', error);
    res.status(500).json({ message: 'Error updating carePackage By Id', error: error.message });
  }
};

const deleteCarePackageById = async (req, res) => {
  try {
  } catch (error) {
    console.error('Error deleting carePackage By Id', error);
    res.status(500).json({ message: 'Error deleting carePackage By Id', error: error.message });
  }
};

export default {
  getAllCarePackages,
  getCarePackageById,
  createCarePackage,
  updateCarePackageById,
  deleteCarePackageById,
};

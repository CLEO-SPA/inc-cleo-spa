import model from '../models/mcpModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';

const getAllMemberCarePackages = async (req, res) => {
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
    const results = await model.getPaginatedMemberCarePackages(
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

export default {
  getAllMemberCarePackages,
};

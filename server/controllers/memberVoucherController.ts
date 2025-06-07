import { Request, Response, NextFunction } from 'express';
import model from '../models/memberVoucherModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';
import { PaginatedOptions, CursorPayload } from '../types/common.types.js';

const getAllMemberVouchers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);
  const searchTerm = req.query.searchTerm as string;

  // console.log(`\n${startDate_utc} || ${endDate_utc} \n`);

  if (limit <= 0) {
    res.status(400).json({ error: 'Limit must be a positive integer.' });
    return;
  }
  if (page && (isNaN(page) || page <= 0)) {
    res.status(400).json({ error: 'Page must be a positive integer.' });
    return;
  }

  let after: CursorPayload | null = null;
  if (afterCursor) {
    after = decodeCursor(afterCursor);
    if (!after) {
      res.status(400).json({ error: 'Invalid "after" cursor.' });
      return;
    }
  }

  let before: CursorPayload | null = null;
  if (beforeCursor) {
    before = decodeCursor(beforeCursor);
    if (!before) {
      res.status(400).json({ error: 'Invalid "before" cursor.' });
      return;
    }
  }

  // Hybrid logic (Prioritize page over cursors if condition met)
  if (page && (after || before)) {
    console.warn('Both page and cursor parameters provided. Prioritizing page.');
    after = null;
    before = null;
  }

  const options: PaginatedOptions = {
    after,
    before,
    page,
    searchTerm,
  };

  try {
    const results = await model.getPaginatedVouchers(limit, options, start_date_utc, end_date_utc as string);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in memberVoucherController.getAllMemberVouchers:', error);
    next(error);
  }
};

export default {
    getAllMemberVouchers
}
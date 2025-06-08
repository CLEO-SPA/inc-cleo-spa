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

const getAllServicesOfMemberVoucherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Testing
  // const id = null;
  // const id = "1@"
  // const id = "A"
  const { id } = req.params;

  try {
    const intId = parseInt(id, 10);

    if (Number.isNaN(intId)) {
      res.status(400).json({
        message: "Invalid ID: must be a valid number"
      });
      return;
    };

    const response = await model.getServicesOfMemberVoucherById(intId);
    res.status(200).json({ message: "Get Services of Member Voucher By Id was successful.", data: response });
  } catch (error) {
    console.error("Error getting Services of Member Voucher:", error);
    res.status(500).json({
      message: "Failed to get Services of Member Voucher",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

const getAllTransactionLogsOfMemberVoucherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const id: number = parseInt(req.params.id, 10);
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);

  // console.log(`\n${startDate_utc} || ${endDate_utc} \n`);

  if (Number.isNaN(id)) {
    res.status(400).json({
      message: "Invalid ID: must be a valid number"
    });
    return;
  };

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
    page
  };

  try {
    const results = await model.getPaginatedMemberVoucherTransactionLogs(id, limit, options, start_date_utc, end_date_utc as string);
    // console.log(results);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in memberVoucherController.getAllTransactionLogsOfMemberVoucherById:', error);
    next(error);
  }
};

// const createMembershipType = async (req: Request, res: Response): Promise<void> => {

//   const {
//     membership_type_name,
//     default_percentage_discount_for_products,
//     default_percentage_discount_for_services,
//     created_by
//   } = req.body;

//   const newMembershipTypeData: NewMembershipType = {
//     membership_type_name,
//     default_percentage_discount_for_products,
//     default_percentage_discount_for_services,
//     created_by
//   };

//   if (!newMembershipTypeData) {
//     throw new Error("Missing new Membership Type Body");
//   };

//   for (let property in newMembershipTypeData) {
//     const value = newMembershipTypeData[property as keyof typeof newMembershipTypeData];
//     if (value === null || value === undefined) {
//       throw new Error(`Property "${property}" is required.`);
//     }
//   };

//   try {
//     const response = await model.addMembershipType(newMembershipTypeData);
//     if (response.success) {
//       res.status(201).json({ message: "Create new Membership Type was successful." });
//     } else {
//       res.status(400).json({ message: response.message });
//     };
//   } catch (error) {
//     console.error("Error creating membership types:", error);
//     res.status(500).json({
//       message: "Failed to creating membership types",
//       error: process.env.NODE_ENV === 'development' ? error : undefined
//     });
//   }
// };

export default {
  getAllMemberVouchers,
  getAllServicesOfMemberVoucherById,
  getAllTransactionLogsOfMemberVoucherById
}
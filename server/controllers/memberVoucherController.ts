import { Request, Response, NextFunction } from 'express';
import model from '../models/memberVoucherModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';
import { PaginatedOptions, CursorPayload } from '../types/common.types.js';
import { MemberVoucherTransactionLogCreateData, MemberVoucherTransactionLogUpdateData } from '../types/model.types.js';
import memberVoucherTransactionLogsModel from '../models/memberVoucherTransactionLogsModel.js';
import voucherTemplateModel from '../models/voucherTemplateModel.js';
import memberModel from '../models/memberModel.js';

const getAllMemberVouchers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);
  const searchTerm = req.query.searchTerm as string;

  if (limit <= 0) {
    res.status(400).json({ error: 'Error 400: Limit must be a positive integer.' });
    return;
  }
  if (page && (isNaN(page) || page <= 0)) {
    res.status(400).json({ error: 'Error 400: Page must be a positive integer.' });
    return;
  }

  let after: CursorPayload | null = null;
  if (afterCursor) {
    after = decodeCursor(afterCursor);
    if (!after) {
      res.status(400).json({ error: 'Error 400: Invalid "after" cursor.' });
      return;
    }
  }

  let before: CursorPayload | null = null;
  if (beforeCursor) {
    before = decodeCursor(beforeCursor);
    if (!before) {
      res.status(400).json({ error: 'Error 400: Invalid "before" cursor.' });
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
    if (results.success) {
      res.status(200).json(results);
    } else {
      res.status(400).json({ message: results.message });
      return;
    }
  } catch (error) {
    console.error('Error in memberVoucherController.getAllMemberVouchers:', error);
    next(error);
  }
};

const getAllServicesOfMemberVoucherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const intId = parseInt(id, 10);

    if (Number.isNaN(intId)) {
      res.status(400).json({
        message: "Error 400: Invalid ID: must be a valid number"
      });
      return;
    };

    const results = await model.getServicesOfMemberVoucherById(intId);
    if (results.success) {
      res.status(200).json({ message: "Get Services of Member Voucher By Id was successful.", data: results });
    } else {
      res.status(400).json({ message: results.message });
      return;
    }
  } catch (error) {
    console.error("Error getting Services of Member Voucher:", error);
    next(error);
  }
};

const getAllTransactionLogsOfMemberVoucherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const id: number = parseInt(req.params.id, 10);
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);

  console.log(`\n${start_date_utc} || ${end_date_utc} \n`);

  if (Number.isNaN(id)) {
    res.status(400).json({
      message: "Error 400: Invalid ID: must be a valid number"
    });
    return;
  };

  if (limit <= 0) {
    res.status(400).json({ error: 'Error 400: Limit must be a positive integer.' });
    return;
  }
  if (page && (isNaN(page) || page <= 0)) {
    res.status(400).json({ error: 'Error 400: Page must be a positive integer.' });
    return;
  }

  let after: CursorPayload | null = null;
  if (afterCursor) {
    after = decodeCursor(afterCursor);
    if (!after) {
      res.status(400).json({ error: 'Error 400: Invalid "after" cursor.' });
      return;
    }
  }

  let before: CursorPayload | null = null;
  if (beforeCursor) {
    before = decodeCursor(beforeCursor);
    if (!before) {
      res.status(400).json({ error: 'Error 400: Invalid "before" cursor.' });
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
    if (results.success) {
      res.status(200).json(results);
    } else {
      res.status(400).json({ message: results.message });
      return;
    }

  } catch (error) {
    console.error('Error in memberVoucherController.getAllTransactionLogsOfMemberVoucherById:', error);
    next(error);
  }
};

const createTransactionLogsByMemberVoucherId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const {
    consumptionValue,
    remarks,
    date,
    time,
    type,
    createdBy,
    handledBy,
    current_balance
  } = req.body;

  const {
    id
  } = req.params;

  try {
    const newMemberVoucherTransactionLogData: MemberVoucherTransactionLogCreateData = {
      id: parseInt(id, 10),
      consumptionValue: parseFloat(consumptionValue),
      remarks: remarks,
      date: date,
      time: time,
      type: type,
      createdBy: parseInt(createdBy, 10),
      handledBy: parseInt(handledBy, 10),
      current_balance: parseFloat(current_balance)
    };

    if (!newMemberVoucherTransactionLogData) {
      res.status(400).json({ message: "Error 400: Missing new Member Voucher Transaction Log Body" });
      return;
    };

    for (let property in newMemberVoucherTransactionLogData) {
      const key = property as keyof MemberVoucherTransactionLogCreateData;
      const value = newMemberVoucherTransactionLogData[key];
      if (key !== "remarks" && (value === null || value === undefined)) {
        res.status(400).json({ message: `Error 400: Property "${property}" is required.` });
        return;
      }
    };

    const numValue = Number(newMemberVoucherTransactionLogData.consumptionValue);
    if ((newMemberVoucherTransactionLogData.consumptionValue == null) || isNaN(numValue)) {
      res.status(400).json({ message: "Error 400: Consumption value is invalid or missing" });
      return;
    }

    if (isNaN(Number())) {
      res.status(400).json({ message: "Error 400: Consumption value is invalid" });
      return;
    };
    if (newMemberVoucherTransactionLogData.remarks.length > 500) {
      res.status(400).json({ message: "Error 400: Remarks input is too long" });
      return;
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newMemberVoucherTransactionLogData.date)) {
      res.status(400).json({ message: "Error 400: Date input is invalid" });
      return;
    };

    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(newMemberVoucherTransactionLogData.time)) {
      res.status(400).json({ message: "Error 400: Time input is invalid." });
      return;
    };

    if (Number.isNaN(newMemberVoucherTransactionLogData.createdBy)) {
      res.status(400).json({ message: "Error 400: Created By Employee id is invalid." });
      return;
    };
    if (Number.isNaN(newMemberVoucherTransactionLogData.handledBy)) {
      res.status(400).json({ message: "Error 400: Handled By Employee id is invalid" });
      return;
    };
    if (Number.isNaN(newMemberVoucherTransactionLogData.current_balance)) {
      res.status(400).json({ message: "Error 400: Current Balance is invalid" });
      return;
    };

    const results = await model.addTransactionLogsByMemberVoucherId(newMemberVoucherTransactionLogData);
    if (results.success) {
      res.status(201).json({ message: results.message });
    } else {
      res.status(400).json({ message: results.message });
      return;
    };
  } catch (error) {
    console.error('Error in memberVoucherController.createTransactionLogsByMemberVoucherId:', error);
    next(error);
  }
};

const checkCurrentBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { consumptionValue } = req.body;

  try {
    const numValue = Number(consumptionValue);
    if ((consumptionValue === '' || consumptionValue == null) || isNaN(numValue)) {
      res.status(400).json({ message: "Error 400: Consumption value is invalid or missing" });
      return;
    }

    const intId = parseInt(id, 10);
    const numericConsumptionValue = parseFloat(consumptionValue);
    if (Number.isNaN(intId)) {
      res.status(400).json({
        message: "Error 400: Invalid ID: must be a valid number"
      });
      return;
    };

    const results = await model.getMemberVoucherCurrentBalance(intId, numericConsumptionValue);
    if (results.success) {
      req.body.current_balance = results.data;
      console.log(req.body.current_balance);
      next();
    } else {
      res.status(400).json({ message: results.message });
      return;
    };
  } catch (error) {
    console.error("Error getting current balance by Member Voucher Id:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

const getMemberVoucherPurchaseDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const intId = parseInt(id, 10);

    if (Number.isNaN(intId)) {
      res.status(400).json({
        message: "Error 400: Invalid ID: must be a valid number"
      });
      return;
    };

    const results = await model.getPurchaseDateOfMemberVoucherById(intId);
    if (results.success) {
      res.status(200).json({ message: "Get Purchase Date of Member Voucher By Id was successful.", data: results.data });
    } else {
      res.status(400).json({ message: results.message });
      return;
    }
  } catch (error) {
    console.error("Error getting Purchase Date of Member Voucher:", error);
    next(error);
  }
}

// const checkPaidCurrentBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const { id } = req.params;
//   const { consumptionValue } = req.body;

//   try {

//     const numValue = Number(consumptionValue);
//     if ((consumptionValue === '' || consumptionValue == null) || isNaN(numValue)) {
//       res.status(400).json({ message: "Error 400: Consumption value is invalid or missing" });
//       return;
//     }

//     const intId = parseInt(id, 10);
//     const numericConsumptionValue = parseFloat(consumptionValue);

//     if (Number.isNaN(intId)) {
//       res.status(400).json({
//         message: "Error 400: Invalid ID: must be a valid number"
//       });
//       return;
//     };

//     const results = await model.getMemberVoucherPaidCurrentBalance(intId, numericConsumptionValue);
//     if (results.success) {
// req.body.current_balance = results.data;
// console.log(req.body.current_balance);
// next();
//     } else {
//       res.status(400).json({ message: results.message });
//       return;
//     };
//   } catch (error) {
//     console.error("Error getting paid current balance by Member Voucher Id:", error);
//     res.status(500).json({ message: "Internal server error" });
//     return;
//   };
// };

const getMemberNameByMemberVoucherId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {

    const intId = parseInt(id, 10);

    if (Number.isNaN(intId)) {
      res.status(400).json({
        message: "Error 400: Invalid ID: must be a valid number"
      });
      return;
    };

    const results = await model.getMemberNameByMemberVoucherId(intId);
    if (results.success) {
      res.status(200).json({ message: results.message, data: results.data });
    } else {
      res.status(400).json({ message: results.message });
      return;
    };
  } catch (error) {
    console.error("Error getting paid current balance by Member Voucher Id:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  };
};

const updateTransactionLogsAndCurrentBalanceByLogId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const {
    transaction_log_id,
    consumptionValue,
    remarks,
    date,
    time,
    type,
    createdBy,
    handledBy,
    lastUpdatedBy
  } = req.body;

  const {
    id
  } = req.params;

  try {
    const updatedMemberVoucherTransactionLogData: MemberVoucherTransactionLogUpdateData = {
      transaction_log_id: parseInt(transaction_log_id, 10),
      member_voucher_id: parseInt(id, 10),
      consumptionValue: parseFloat(consumptionValue),
      remarks: remarks,
      date: date,
      time: time,
      type: type,
      createdBy: parseInt(createdBy, 10),
      handledBy: parseInt(handledBy, 10),
      lastUpdatedBy: parseInt(lastUpdatedBy, 10)
    };

    console.log(updatedMemberVoucherTransactionLogData);

    if (!updatedMemberVoucherTransactionLogData) {
      res.status(400).json({ message: "Error 400: Missing new Member Voucher Transaction Log Body" });
      return;
    };

    for (let property in updatedMemberVoucherTransactionLogData) {
      const key = property as keyof MemberVoucherTransactionLogUpdateData;
      const value = updatedMemberVoucherTransactionLogData[key];
      if (key !== "remarks" && (value === null || value === undefined)) {
        res.status(400).json({ message: `Error 400: Property "${property}" is required.` });
        return;
      };
    };

    const numValue = Number(updatedMemberVoucherTransactionLogData.consumptionValue);
    if ((updatedMemberVoucherTransactionLogData.consumptionValue == null) || isNaN(numValue)) {
      res.status(400).json({ message: "Error 400: Consumption value is invalid or missing" });
      return;
    }
    if (updatedMemberVoucherTransactionLogData.remarks.length > 500) {
      res.status(400).json({ message: "Error 400: Remarks input is too long" });
      return;
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedMemberVoucherTransactionLogData.date)) {
      res.status(400).json({ message: "Error 400: Date input is invalid" });
      return;
    };
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(updatedMemberVoucherTransactionLogData.time)) {
      res.status(400).json({ message: "Error 400: Time input is invalid." });
      return;
    };
    if (Number.isNaN(updatedMemberVoucherTransactionLogData.createdBy)) {
      res.status(400).json({ message: "Error 400: Created By Employee id is invalid." });
      return;
    };
    if (Number.isNaN(updatedMemberVoucherTransactionLogData.handledBy)) {
      res.status(400).json({ message: "Error 400: Handled By Employee id is invalid" });
      return;
    };
    if (Number.isNaN(updatedMemberVoucherTransactionLogData.lastUpdatedBy)) {
      res.status(400).json({ message: "Error 400: Last Updated By Employee id is invalid." });
      return;
    };
    if (Number.isNaN(updatedMemberVoucherTransactionLogData.member_voucher_id)) {
      res.status(400).json({ message: "Error 400: Member Voucher is invalid." });
      return;
    };
    if (Number.isNaN(updatedMemberVoucherTransactionLogData.transaction_log_id)) {
      res.status(400).json({ message: "Error 400: Transaction Log is invalid." });
      return;
    };

    const results = await model.setTransactionLogsAndCurrentBalanceByLogId(updatedMemberVoucherTransactionLogData);
    if (results.success) {
      res.status(201).json({ message: results.message });
    } else {
      res.status(400).json({ message: results.message });
      throw new Error(results.message);
    };
  } catch (error) {
    console.error('Error in memberVoucherController.updatedMemberVoucherTransactionLogData:', error);
    next(error);
  };
};

const deleteTransactionLogsByLogId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const {
    id,
    transaction_log_id
  } = req.params;

  try {

    const intTransaction_log_id = parseInt(transaction_log_id, 10);
    const intMember_voucher_id = parseInt(id, 10);

    if (!intTransaction_log_id || Number.isNaN(intTransaction_log_id)) {
      res.status(400).json({ message: "Error 400: Transaction Log id is invalid." });
      return;
    };
    if (!intMember_voucher_id || Number.isNaN(intMember_voucher_id)) {
      res.status(400).json({ message: "Error 400: Member Voucher id is invalid." });
      return;
    };

    const results = await model.deleteTransactionLogsAndCurrentBalanceByLogId(intTransaction_log_id, intMember_voucher_id);
    if (results.success) {
      res.status(200).json({ message: results.message });
    } else {
      res.status(400).json({ message: results.message });
      throw new Error(results.message);
    };
  } catch (error) {
    console.error('Error in memberVoucherController.deleteTransactionLogsByLogId:', error);
    next(error);
  }
};


const createMemberVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating MV transaction:', req.body);

    // Call the model function
    const result = await model.createMemberVoucher(req.body);

    console.log('MV transaction created successfully:', result);

    res.status(201).json({
      success: true,
      message: 'MV transaction created successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Error creating MV transaction:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create MV transaction',
      details: error.message
    });
  }
};

const removeMemberVoucher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate presence of ID
    if (!id) {
      res.status(400).json({ success: false, message: 'Missing member voucher ID in request' });
      return;
    }

    // Call the model function to perform soft delete
    const result = await model.removeMemberVoucher(id);

    res.status(200).json({
      success: true,
      message: 'Member voucher deleted (soft) successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error deleting member voucher:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
      return;
    }

    next(error); // Forward unexpected errors
  }
};
const getMemberVoucherDetailsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawName = req.query.name;

    // Validate presence but preserve original formatting
    if (typeof rawName !== 'string') {
      res.status(400).json({ error: 'Member name must be a string.' });
      return;
    }

    const name = rawName; // No trimming applied

    const templatesDetails = await model.getMemberVoucherWithDetails(name);
    res.status(200).json({ data: templatesDetails });
  } catch (error) {
    console.error("Error fetching member voucher details:", error);
    res.status(500).json({ error: "Failed to fetch member voucher details" });
  }
};


const transferVoucherDetailsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      member_name,
      voucher_template_name,
      price,
      foc,
      old_voucher_names,
      old_voucher_details,
      is_bypass,
      created_by,
      created_at,
      remarks,
      top_up_balance,
    }: {
      member_name: string;
      voucher_template_name: string;
      price: number;
      foc: number;
      old_voucher_names: string[];
      old_voucher_details: {
        voucher_id: number;
        member_voucher_name: string;
        balance_to_transfer: number;
      }[];
      is_bypass?: boolean;
      created_by: number;
      created_at: string;
      remarks: string;
      top_up_balance: number;
    } = req.body;

    // Validate input
    if (
      !member_name ||
      !voucher_template_name ||
      price == null ||
      foc == null ||
      !Array.isArray(old_voucher_names) ||
      !Array.isArray(old_voucher_details)
    ) {
      res.status(400).json({ success: false, message: "Missing required fields." });
      return;
    }

    // Lookup member
    const members = await memberModel.searchMemberByNameOrPhone(member_name);
    if (!members || members.members.length === 0) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    const memberId = members.members[0].id;

    // Lookup template
    let voucherTemplateId = 0;
    if (!is_bypass) {
      const templates = await voucherTemplateModel.getVoucherTemplatesDetails(voucher_template_name);
      if (!templates || templates.length === 0) {
        res.status(404).json({ success: false, message: "Voucher template not found" });
        return;
      }
      voucherTemplateId = templates[0].id;
    }

    // Create new member voucher
    const createdVoucher = await model.createMemberVoucherForTransfer(
      memberId,
      voucher_template_name,
      voucherTemplateId,
      price,
      foc,
      remarks || "",
      created_by,
      created_at
    );
    const newVoucherId = Number(createdVoucher.id);

    // Sum actual current balances from DB
    let totalActualTransferredBalance = 0;

    for (const { voucher_id, member_voucher_name } of old_voucher_details) {
      const isFOCUsed = await model.checkIfFreeOfChargeIsUsedById(voucher_id);


      if (isFOCUsed) {
        await model.removeFOCFromVoucherById(voucher_id, created_by, created_at);
      }

      const currentBalance = await model.getMemberVoucherCurrentBalanceById(voucher_id);

      console.log("Current balance for voucher ID", voucher_id, "is", currentBalance);
      await memberVoucherTransactionLogsModel.addTransferMemberVoucherTransactionLog(
        memberId,
        newVoucherId,
        member_voucher_name,
        voucher_template_name,
        created_by,
        created_by,
        created_at,
      );

      await model.setMemberVoucherBalanceAfterTransferById(
        voucher_id,
        currentBalance,
        created_at
      );

      totalActualTransferredBalance += currentBalance;
    }

    // Add Top-Up + FOC logs
    await memberVoucherTransactionLogsModel.addPaymentFOCMemberVoucherTransactionLogs(
      newVoucherId,
      voucher_template_name,
      foc,
      created_by,
      created_by,
      created_at,
      top_up_balance,
      totalActualTransferredBalance
    );

    res.status(200).json({
      success: true,
      message: "Voucher transfer processed and new voucher created successfully",
      newVoucherId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create MV Transfer transaction',
      details: error?.message || 'Unknown error'
    });
  }
};


export default {
  getAllMemberVouchers,
  getAllServicesOfMemberVoucherById,
  createMemberVoucher,
  removeMemberVoucher,
  getAllTransactionLogsOfMemberVoucherById,
  createTransactionLogsByMemberVoucherId,
  checkCurrentBalance,
  // checkPaidCurrentBalance,
  getMemberVoucherPurchaseDate,
  getMemberNameByMemberVoucherId,
  updateTransactionLogsAndCurrentBalanceByLogId,
  deleteTransactionLogsByLogId,
  getMemberVoucherDetailsHandler,
  transferVoucherDetailsHandler
}
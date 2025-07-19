import { Request, Response, NextFunction } from "express";
import voucherModel from "../models/voucherModel.js";
import memberVoucherTransactionLogsModel from "../models/memberVoucherTransactionLogsModel.js";
import memberModel from "../models/memberModel.js";
import memberVoucherModel from "../models/memberVoucherModel.js";

// Simple sanitization helper
const sanitizeInput = (input: unknown): string => {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[^\w\s\-]/gi, ""); // Keep letters, numbers, space, dash, underscore
};

const getVoucherTemplateNamesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const names = await voucherModel.getAllVoucherTemplateNames();

    res.status(200).json({
      success: true,
      data: names,
    });
  } catch (error) {
    console.error("Error fetching voucher template names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voucher template names",
    });
  }
};

const getVoucherTemplatesDetailsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.query;

    const voucherName = name?.toString();

    const templatesDetails = await voucherModel.getVoucherTemplatesDetails(voucherName);

    res.status(200).json({ data: templatesDetails });
  } catch (error) {
    console.error("Error fetching voucher templates details:", error);
    res.status(500).json({ error: "Failed to fetch voucher templates details" });
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

    const templatesDetails = await voucherModel.getMemberVoucherWithDetails(name);
    res.status(200).json({ data: templatesDetails });
  } catch (error) {
    console.error("Error fetching member voucher details:", error);
    res.status(500).json({ error: "Failed to fetch member voucher details" });
  }
};

interface OldVoucherDetail {
  voucher_id: number;
  balance_to_transfer: number;
}

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
      const templates = await voucherModel.getVoucherTemplatesDetails(voucher_template_name);
      if (!templates || templates.length === 0) {
        res.status(404).json({ success: false, message: "Voucher template not found" });
        return;
      }
      voucherTemplateId = templates[0].id;
    }

    // Create new member voucher
    const createdVoucher = await memberVoucherModel.createMemberVoucherForTransfer(
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
      const isFOCUsed = await voucherModel.checkIfFreeOfChargeIsUsedById(voucher_id);
      console.log(`[FOC CHECK] Checking FOC for voucher ID: ${voucher_id}`);
      console.log(`[FOC CHECK] isFOCUsed = ${isFOCUsed}`);

      if (isFOCUsed) {
        await voucherModel.removeFOCFromVoucherById(voucher_id, created_by, created_at);
      }

      const currentBalance = await voucherModel.getMemberVoucherCurrentBalanceById(voucher_id);

      await memberVoucherTransactionLogsModel.addTransferMemberVoucherTransactionLog(
        memberId,
        newVoucherId,
        member_voucher_name,
        voucher_template_name,
        created_by,
        created_by,
        created_at,
      );

      await voucherModel.setMemberVoucherBalanceAfterTransferById(
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
  getVoucherTemplatesDetailsHandler,
  getMemberVoucherDetailsHandler,
  getVoucherTemplateNamesHandler,
  transferVoucherDetailsHandler,
};
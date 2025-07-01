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

    console.log("Received member name:", rawName);
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
      created_at,  // ✅ NEW
      remarks,
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
      created_at: string;   // ✅ NEW
      remarks: string;
    } = req.body;

    console.log("member_name:", member_name);

    // Validate required fields
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

    // Search for member
    const members = await memberModel.searchMemberByNameOrPhone(member_name);
    if (!members || members.members.length === 0) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    const memberId = members.members[0].id;

    let voucherTemplateId = 0;

    if (!is_bypass) {
      const voucherTemplates = await voucherModel.getVoucherTemplatesDetails(voucher_template_name);
      if (!voucherTemplates || voucherTemplates.length === 0) {
        res.status(404).json({ success: false, message: "Voucher template not found" });
        return;
      }
      voucherTemplateId = voucherTemplates[0].id;
    }

    // Create new member voucher for the transfer
    const createdVoucher = await memberVoucherModel.createMemberVoucherForTransfer(
      memberId,
      voucher_template_name,
      voucherTemplateId,
      price,
      foc,
      remarks || "",
      created_by,
      created_at // ✅ passed to model
    );

    const newVoucherId = createdVoucher.id;

    // Process old vouchers
    for (const { member_voucher_name, balance_to_transfer } of old_voucher_details) {
      const isFOCUsed = await voucherModel.checkIfFreeOfChargeIsUsed(memberId, member_voucher_name);
      if (!isFOCUsed) {
        await voucherModel.removeFOCFromVoucher(memberId, member_voucher_name, created_by, created_at);
      }

      await memberVoucherTransactionLogsModel.addTransferMemberVoucherTransactionLog(
        memberId,
        voucher_template_name,
        created_by,     // ✅ serviced_by
        created_by,     // ✅ created_by
        created_at      // ✅ created_at
      );


      await voucherModel.setMemberVoucherBalanceAfterTransfer(
        memberId,
        member_voucher_name,
        balance_to_transfer,
        created_at
      );
    }

    res.status(200).json({
      success: true,
      message: "Voucher transfer processed and new voucher created successfully",
      newVoucherId,
    });
  } catch (error) {
    console.error("Error in transferVoucherDetailsHandler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process voucher transfer",
    });
  }
};





export default {
  getVoucherTemplatesDetailsHandler,
  getMemberVoucherDetailsHandler,
  getVoucherTemplateNamesHandler,
  transferVoucherDetailsHandler,
};
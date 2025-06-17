import { Request, Response, NextFunction } from "express";
import voucherModel from "../models/voucherModel.js";
import memberVoucherTransactionLogsModel from "../models/memberVoucherTransactionLogsModel.js";
import memberModel from "../models/memberModel.js";

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
        const { name } = req.query;

        const sanitized = sanitizeInput(name);

        const templatesDetails = await voucherModel.getMemberVoucherWithDetails(sanitized || null);
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
const checkIfFreeOfChargeIsUsedHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Extract memberId and voucher_id from query params (or body/params)
        const memberId = Number(req.query.memberId);
        const voucher_id = Number(req.query.voucher_id);

        // Basic validation
        if (isNaN(memberId) || isNaN(voucher_id)) {
            res.status(400).json({ success: false, message: "Invalid memberId or voucher_id" });
            return;
        }

        const isFOCUsed = await voucherModel.checkIfFreeOfChargeIsUsed(memberId, voucher_id);

        console.log(isFOCUsed)

        res.status(200).json({ success: true, isFOCUsed });
    } catch (error) {
        console.error("Error checking FOC usage:", error);
        res.status(500).json({ success: false, message: "Failed to check Free of Charge usage" });
    }
};

const removeFOCFromVoucherHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const memberId = Number(req.query.memberId);
        const voucherId = Number(req.query.voucher_id); // use consistent naming
        // Basic validation
        if (isNaN(memberId) || isNaN(voucherId)) {
            res.status(400).json({
                success: false,
                message: "Invalid memberId or voucher_id",
            });
            return
        }

        await voucherModel.removeFOCFromVoucher(memberId, voucherId);

        res.status(200).json({
            success: true,
            message: "FOC successfully removed from voucher",
        });
    } catch (error) {
        console.error("Error removing FOC from voucher:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove FOC from voucher",
        });
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
        }: {
            member_name: string;
            voucher_template_name: string;
            price: number;
            foc: number;
            old_voucher_names: string[];
            old_voucher_details: OldVoucherDetail[];
        } = req.body;

        const members = await memberModel.searchMemberByNameOrPhone(member_name);
        if (!members) {
            res.status(404).json({ success: false, message: "Member not found" });
            return;
        }

        const memberId = members.members[0].id;

        const voucherTemplates = await voucherModel.getVoucherTemplatesDetails(voucher_template_name);

        if (!voucherTemplates || voucherTemplates.length === 0) {
            res.status(404).json({ success: false, message: "Voucher template not found" });
            return;
        }

        const voucherId = voucherTemplates[0].id;

        for (const { voucher_id, balance_to_transfer } of old_voucher_details) {
            const isFOCUsed = await voucherModel.checkIfFreeOfChargeIsUsed(memberId, voucher_id);

            if (!isFOCUsed) {
                await voucherModel.removeFOCFromVoucher(memberId, voucher_id);
            }

            await memberVoucherTransactionLogsModel.addTransferMemberVoucherTransactionLog(
                memberId,
                voucherId
            );

            await voucherModel.setMemberVoucherBalanceAfterTransfer(
                memberId,
                voucher_id,
                balance_to_transfer
            );
        }

        res.status(200).json({
            success: true,
            message: "Voucher transfer processed successfully",
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
    checkIfFreeOfChargeIsUsedHandler,
    removeFOCFromVoucherHandler,
};

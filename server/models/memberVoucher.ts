import { pool } from '../config/database.js';
import { MemberVouchers } from '../types/model.types.js';

const createMemberVoucherForTransfer = async (
    memberId: number,
    voucherTemplateName: string,
    voucherTemplateId: number,
    price: number,
    foc: number,
    remarks: string,
    createdBy: number,    // new optional params
    handledBy: number,
    lastUpdatedBy: number
): Promise<MemberVouchers> => {
    try {
        const insertVoucherQuery = `
      INSERT INTO member_vouchers (
        member_id,
        member_voucher_name,
        voucher_template_id,
        current_balance,
        starting_balance,
        free_of_charge,
        default_total_price,
        status,
        remarks,
        created_by,
        handled_by,
        last_updated_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *;
    `;

        const voucherValues = [
            memberId,
            voucherTemplateName,
            voucherTemplateId,
            price + foc,
            price + foc,
            foc,
            price,
            "is_enabled",
            remarks,
            createdBy || null,
            handledBy || null,
            lastUpdatedBy || null,
        ];

        const result = await pool().query(insertVoucherQuery, voucherValues);
        const newVoucher: MemberVouchers = result.rows[0];

        return newVoucher;
    } catch (error) {
        console.error("Error adding member voucher ", error);
        throw new Error("Failed to add member voucher");
    }
};

export default {
    createMemberVoucherForTransfer,
};

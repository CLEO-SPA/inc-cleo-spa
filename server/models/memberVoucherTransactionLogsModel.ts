
import { pool, getProdPool as prodPool } from '../config/database.js';


const addTransferMemberVoucherTransactionLog = async (
    memberId: number,
    voucherId: number
): Promise<void> => {
    try {
        // Step 1: Get the member's voucher record
        const getVoucherQuery = `
      SELECT id, current_balance
      FROM member_voucher
      WHERE member_id = $1 AND voucher_id = $2
      LIMIT 1
    `;
        const voucherValues = [memberId, voucherId];
        const voucherResult = await pool().query(getVoucherQuery, voucherValues);

        if (voucherResult.rows.length === 0) {
            throw new Error("Member voucher record not found");
        }

        const memberVoucher = voucherResult.rows[0];

        // Step 2: Get voucher template name
        const getTemplateNameQuery = `
      SELECT voucher_template_name
      FROM voucher_templates
      WHERE id = $1
    `;
        const templateResult = await pool().query(getTemplateNameQuery, [voucherId]);
        const newVoucherName = templateResult.rows[0]?.voucher_template_name || "Unknown Voucher";

        const now = new Date();
        const amountChange = memberVoucher.current_balance ? -memberVoucher.current_balance : 0;

        // Step 3: Insert into transaction log
        const insertLogQuery = `
      INSERT INTO member_voucher_transaction_logs (
        member_voucher_id,
        service_description,
        service_date,
        current_balance,
        amount_change,
        serviced_by,
        type,
        created_by,
        last_updated_by,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
    `;

        const insertValues = [
            memberVoucher.id,
            `Transfer TO ${newVoucherName}`,
            now,
            0,
            amountChange,
            14, // serviced_by
            "TRANSFER FROM",
            14, // created_by
            14, // last_updated_by
            now,
            now,
        ];

        await pool().query(insertLogQuery, insertValues);
    } catch (error) {
        console.error("Error adding member voucher transaction log:", error);
        throw new Error("Failed to add member voucher transaction log");
    }
};
export default {
    addTransferMemberVoucherTransactionLog,
};
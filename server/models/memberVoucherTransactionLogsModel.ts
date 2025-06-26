import { pool, getProdPool as prodPool } from '../config/database.js';

const addTransferMemberVoucherTransactionLog = async (
  memberId: number,
  memberVoucherName: string,
): Promise<void> => {
  try {
    // Step 1: Get the member's voucher record
    const getVoucherQuery = `
      SELECT id, current_balance, member_voucher_name
      FROM member_vouchers
      WHERE member_id = $1 AND member_voucher_name = $2
      LIMIT 1
    `;
    const voucherValues = [memberId, memberVoucherName];
    const voucherResult = await pool().query(getVoucherQuery, voucherValues);

    if (voucherResult.rows.length === 0) {
      throw new Error("Member voucher record not found");
    }

    const memberVoucher = voucherResult.rows[0];
    const oldMemberVoucherName = memberVoucher.member_voucher_name;

    const now = new Date();
    const amountChange = memberVoucher.current_balance ? -memberVoucher.current_balance : 0;

    // Step 3: Insert INTO transaction log - Transfer TO new voucher
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

    // Insert log: Transfer TO new voucher
    const insertValuesStep3 = [
      memberVoucher.id,
      `Transfer TO ${memberVoucherName}`,
      now,
      0,
      amountChange,
      14, // serviced_by
      "TRANSFER TO",
      14, // created_by
      14, // last_updated_by
      now,
      now,
    ];

    await pool().query(insertLogQuery, insertValuesStep3);

    // Step 4: Insert INTO transaction log - Transfer FROM old voucher
    const insertValuesStep4 = [
      memberVoucher.id,
      `Transfer FROM ${oldMemberVoucherName}`,
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

    await pool().query(insertLogQuery, insertValuesStep4);

  } catch (error) {
    console.error("Error adding member voucher transaction log:", error);
    throw new Error("Failed to add member voucher transaction log");
  }
};

export default {
  addTransferMemberVoucherTransactionLog,
};

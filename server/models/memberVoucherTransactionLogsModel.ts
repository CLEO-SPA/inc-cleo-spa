import { pool } from '../config/database.js';

const addTransferMemberVoucherTransactionLog = async (
  memberId: number,
  memberVoucherName: string,
  service_by: number,
  created_by: number,
  last_updated_by: number
): Promise<void> => {
  try {
    const now = new Date();

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
    const amountChange = memberVoucher.current_balance ? -memberVoucher.current_balance : 0;

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    // Insert log: Transfer FROM this voucher
    const insertValuesFrom = [
      memberVoucher.id,
      `Transfer FROM ${memberVoucherName}`,
      now,
      0,
      amountChange,
      service_by,
      "TRANSFER FROM",
      created_by,
      last_updated_by,
      now,
      now,
    ];

    // Insert log: Transfer TO new voucher (log FROM context, not TO voucher ID)
    const insertValuesTo = [
      memberVoucher.id,
      `Transfer TO new voucher`,
      now,
      0,
      amountChange,
      service_by,
      "TRANSFER TO",
      created_by,
      last_updated_by,
      now,
      now,
    ];

    await pool().query(insertLogQuery, insertValuesFrom);
    await pool().query(insertLogQuery, insertValuesTo);

  } catch (error) {
    console.error("Error adding member voucher transaction log:", error);
    throw new Error("Failed to add member voucher transaction log");
  }
};

export default {
  addTransferMemberVoucherTransactionLog,
};

import { pool } from '../config/database.js';

const addTransferMemberVoucherTransactionLog = async (
  memberId: number,
  memberVoucherName: string,
  serviced_by: number,
  created_by: number,
  created_at: string // ✅ New param
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
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    // "FROM" log entry
    const insertValuesFrom = [
      memberVoucher.id,
      `Transfer FROM ${memberVoucherName}`,
      created_at,
      0,
      amountChange,
      serviced_by,
      "TRANSFER FROM",
      created_by,
      created_at,
      created_at,
    ];

    // "TO" log entry
    const insertValuesTo = [
      memberVoucher.id,
      `Transfer TO new voucher`,
      created_at,
      0,
      amountChange,
      serviced_by,
      "TRANSFER TO",
      created_by,
      created_at,
      created_at,
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

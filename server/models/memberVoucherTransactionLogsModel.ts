import { tr } from 'date-fns/locale';
import { pool } from '../config/database.js';

const addTransferMemberVoucherTransactionLog = async (
  memberId: number,
  newMemberVoucherId: number,
  memberVoucherName: string,
  foc: number,
  voucherTemplateName: string,
  servicedBy: number,
  createdBy: number,
  createdAt: string,
  topUpBalance: number
): Promise<void> => {
  try {
    // Step 1: Retrieve the old voucher being transferred
    const getVoucherQuery = `
      SELECT id, current_balance
      FROM member_vouchers
      WHERE member_id = $1 AND member_voucher_name = $2
      LIMIT 1
    `;
    const voucherResult = await pool().query(getVoucherQuery, [memberId, memberVoucherName]);

    if (voucherResult.rows.length === 0) {
      throw new Error("Member voucher record not found");
    }

    const memberVoucher = voucherResult.rows[0];
    var transferAmount = memberVoucher.current_balance;

    // Common insert query for all log types
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

    // ➤ Log: Transfer TO old voucher
    const insertValuesTo = [
      memberVoucher.id,
      `Transfer TO ${voucherTemplateName} voucher`,
      createdAt,
      0,
      -transferAmount,
      servicedBy,
      "TRANSFER TO",
      createdBy,
      createdAt,
      createdAt,
    ];

    // ➤ Log: Transfer FROM to new voucher
    const insertValuesFrom = [
      newMemberVoucherId,
      `Transfer FROM ${memberVoucherName}`,
      createdAt,
      transferAmount,
      transferAmount,
      servicedBy,
      "TRANSFER FROM",
      createdBy,
      createdAt,
      createdAt,
    ];

    transferAmount = Number(memberVoucher.current_balance);
    const topUpAmount = Number(topUpBalance);
    const focAmount = Number(foc);
    console.log("foc:", foc);
    console.log("topUpBalance:", topUpBalance);
    console.log(transferAmount, "transferAmount");
    // ➤ Log: Top-Up (only if topUpBalance > 0)
    const topUpNewCurrentBalance = transferAmount + topUpAmount;
    console.log("Top Up New Current Balance:", topUpNewCurrentBalance);

    const insertValuesTopUp = [
      newMemberVoucherId,
      `Top Up ${voucherTemplateName}`,
      createdAt,
      topUpNewCurrentBalance,
      topUpBalance,
      servicedBy,
      "TOP UP",
      createdBy,
      createdAt,
      createdAt,
    ];
    // ➤ Log: Add FOC (only if foc > 0)

    const FOCNewCurrentBalance = transferAmount + topUpAmount + focAmount

    console.log("FOC CURRENT BALANCE", FOCNewCurrentBalance)
    const insertValuesFOC = [
      newMemberVoucherId,
      `Add FOC ${voucherTemplateName}`,
      createdAt,
      FOCNewCurrentBalance,
      foc,
      servicedBy,
      "ADD FOC",
      createdBy,
      createdAt,
      createdAt,
    ];
    // Execute logs in order
    await pool().query(insertLogQuery, insertValuesTo);
    await pool().query(insertLogQuery, insertValuesFrom);

    await pool().query(insertLogQuery, insertValuesTopUp);

    await pool().query(insertLogQuery, insertValuesFOC);


  } catch (error) {
    console.error("❌ Error adding member voucher transaction log:", error);
    throw new Error("Failed to add member voucher transaction log");
  }
};

export default {
  addTransferMemberVoucherTransactionLog,
};

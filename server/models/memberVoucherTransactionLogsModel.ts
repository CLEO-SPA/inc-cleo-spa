import { tr } from 'date-fns/locale';
import { pool } from '../config/database.js';

const addTransferMemberVoucherTransactionLog = async (
  memberId: number,
  newMemberVoucherId: number,
  memberVoucherName: string,
  voucherTemplateName: string,
  servicedBy: number,
  createdBy: number,
  createdAt: string
): Promise<number> => {
  try {

    const createdDateObj = new Date(createdAt);
    if (isNaN(createdDateObj.getTime())) {
      throw new Error(`Invalid date string for createdAt: ${createdAt}`);
    }
    const createdAtISO = createdDateObj.toISOString();
    // Get old voucher details
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
    const transferAmount = Number(memberVoucher.current_balance);

    // Get the latest current_balance for the new voucher from transaction logs
    const getLatestBalanceQuery = `
      SELECT current_balance
      FROM member_voucher_transaction_logs
      WHERE member_voucher_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `;
    const latestBalanceResult = await pool().query(getLatestBalanceQuery, [newMemberVoucherId]);

    const latestBalance = latestBalanceResult.rows.length > 0 ? Number(latestBalanceResult.rows[0].current_balance) : 0;

    const newBalance = latestBalance + transferAmount;

    // Insert log query
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

    // Log: Transfer TO old voucher
    const insertValuesTo = [
      memberVoucher.id,
      `Transfer TO ${voucherTemplateName} voucher`,
      createdAt,
      0,
      -transferAmount,
      servicedBy,
      "TRANSFER TO",
      createdBy,
      createdAtISO,
      createdAtISO,
    ];

    const insertValuesFrom = [
      newMemberVoucherId,
      `Transfer FROM ${memberVoucherName}`,
      createdAt,
      newBalance,  // cumulative balance in new voucher transaction logs
      transferAmount,
      servicedBy,
      "TRANSFER FROM",
      createdBy,
      createdAtISO,
      createdAtISO,
    ];


    await pool().query(insertLogQuery, insertValuesTo);
    await pool().query(insertLogQuery, insertValuesFrom);

    return transferAmount;
  } catch (error) {
    console.error("❌ Error logging transfer:", error);
    throw new Error("Failed to log member voucher transfer");
  }
};



const addPaymentFOCMemberVoucherTransactionLogs = async (
  newMemberVoucherId: number,
  voucherTemplateName: string,
  foc: number,
  servicedBy: number,
  createdBy: number,
  createdAt: string,
  topUpBalance: number,
  baseBalance: number // this is the current balance before top-up and foc
): Promise<void> => {
  try {
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

    const topUpAmount = Number(topUpBalance);
    const focAmount = Number(foc);

    // ➤ Log: Top-Up (only if topUpBalance > 0)
    const topUpNewCurrentBalance = baseBalance + topUpAmount;

    const insertValuesTopUp = [
      newMemberVoucherId,
      `Top Up ${voucherTemplateName}`,
      createdAt,
      topUpNewCurrentBalance,
      topUpAmount,
      servicedBy,
      "TOP UP",
      createdBy,
      createdAt,
      createdAt,
    ];

    await pool().query(insertLogQuery, insertValuesTopUp);


    // ➤ Log: Add FOC (only if foc > 0)
    const FOCNewCurrentBalance = baseBalance + topUpAmount + focAmount;

    const insertValuesFOC = [
      newMemberVoucherId,
      `Add FOC ${voucherTemplateName}`,
      createdAt,
      FOCNewCurrentBalance,
      focAmount,
      servicedBy,
      "ADD FOC",
      createdBy,
      createdAt,
      createdAt,
    ];

    await pool().query(insertLogQuery, insertValuesFOC);

  } catch (error) {
    console.error("❌ Error adding payment/FOC voucher transaction log:", error);
    throw new Error("Failed to add payment/FOC transaction log");
  }
};


export default {
  addTransferMemberVoucherTransactionLog,
  addPaymentFOCMemberVoucherTransactionLogs
};

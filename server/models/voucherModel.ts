import { pool, getProdPool as prodPool } from '../config/database.js';
import { VoucherTemplate, VoucherTemplateDetail, MemberName, MemberVouchers } from '../types/model.types.js';

// Helper to recursively convert BigInt to string
const normalizeBigInts = (data: any): any =>
    JSON.parse(JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));


const getVoucherTemplatesDetails = async (name: string | null = null): Promise<any[]> => {
    try {
        const templatesQuery = name
            ? `SELECT * FROM voucher_templates WHERE LOWER(voucher_template_name) = LOWER($1)`
            : `SELECT * FROM voucher_templates`;

        const templatesValues = name ? [name] : [];


        const templatesResult = await pool().query(templatesQuery, templatesValues);
        const templates: VoucherTemplate[] = templatesResult.rows;

        const result = await Promise.all(
            templates.map(async (template) => {
                const detailQuery = `
                    SELECT service_id, service_name, original_price, custom_price, discount, final_price, duration
                    FROM voucher_template_details
                    WHERE voucher_template_id = $1
                `;
                const detailValues = [template.id];
                const detailsResult = await pool().query(detailQuery, detailValues);
                const details: VoucherTemplateDetail[] = detailsResult.rows;

                return {
                    ...template,
                    details,
                };
            })
        );

        return normalizeBigInts(result);
    } catch (error) {
        console.error("Error fetching voucher templates:", error);
        throw new Error("Failed to fetch voucher templates");
    }
};


const getMemberVoucherWithDetails = async (name: string | null = null): Promise<any[]> => {
    try {
        if (!name) {
            throw new Error("Member name is required");
        }

        const memberQuery = `
  SELECT * 
  FROM members 
  WHERE LOWER(name) LIKE LOWER($1) 
  LIMIT 1
`;
        const memberResult = await pool().query(memberQuery, [`%${name}%`]);
        const member: MemberName = memberResult.rows[0];

        if (!member) {
            throw new Error(`Member with name "${name}" not found`);
        }

        const vouchersQuery = `
  SELECT * 
  FROM member_vouchers 
  WHERE member_id = $1 
    AND status = 'is_enabled'
`;
        // const vouchersQuery = `SELECT * FROM member_vouchers WHERE member_id = $1`;

        const vouchersResult = await pool().query(vouchersQuery, [member.id]);
        const vouchers: MemberVouchers[] = vouchersResult.rows;

        const result = await Promise.all(
            vouchers.map(async (voucher) => {
                const detailQuery = `
          SELECT service_id, service_name, original_price, custom_price, discount, final_price, duration
          FROM member_voucher_details
          WHERE member_voucher_id = $1
        `;
                const detailValues = [voucher.id];
                const detailsResult = await pool().query(detailQuery, detailValues);

                return {
                    ...voucher,
                    details: detailsResult.rows,
                };
            })
        );

        return normalizeBigInts(result);
    } catch (error) {
        console.error("Error fetching member voucher:", error);
        throw new Error("Failed to fetch member voucher");
    }
};

const getAllVoucherTemplateNames = async (): Promise<any[]> => {
    try {
        const query = `SELECT id, voucher_template_name FROM voucher_templates ORDER BY id ASC`;
        const result = await pool().query(query);
        return normalizeBigInts(result.rows);
    } catch (error) {
        console.error("Error fetching voucher template names:", error);
        throw new Error("Failed to fetch voucher template names");
    }
};

const checkIfFreeOfChargeIsUsed = async (
    memberId: number,
    voucher_template_name: string
): Promise<boolean> => {
    try {
        const query = `
      SELECT id, current_balance, free_of_charge
      FROM member_vouchers
      WHERE member_id = $1 AND member_voucher_name = $2
    `;
        const values = [memberId, voucher_template_name];
        const result = await pool().query(query, values);

        if (result.rows.length === 0) {
            throw new Error('No member_voucher found');
        }

        const { current_balance, free_of_charge } = result.rows[0];
        return current_balance < free_of_charge;
    } catch (error) {
        console.error("Error checking free of charge usage:", error);
        throw new Error("Failed to check free of charge usage");
    }
};

const removeFOCFromVoucher = async (
    memberId: number,
    member_voucher_name: string,
    created_by: number,
    created_at: string // ✅ passed in timestamp
): Promise<{ member_voucher_name: string; newBalance: number }> => {
    try {
        // Step 1: Fetch the voucher record
        const fetchQuery = `
      SELECT id, current_balance, free_of_charge
      FROM member_vouchers
      WHERE member_voucher_name = $1 AND member_id = $2
    `;
        const fetchValues = [member_voucher_name, memberId];
        const fetchResult = await pool().query(fetchQuery, fetchValues);

        if (fetchResult.rows.length === 0) {
            throw new Error("Member voucher not found.");
        }

        const { id: memberVoucherId, current_balance, free_of_charge } = fetchResult.rows[0];

        const currentBalanceNum = parseFloat(current_balance);
        const focNum = parseFloat(free_of_charge);

        // Step 2: Calculate new balance
        const newBalance = Math.max(0, currentBalanceNum - focNum);

        // Step 3: Update voucher record
        const updateQuery = `
      UPDATE member_vouchers
      SET current_balance = $1,
          updated_at = $2
      WHERE member_voucher_name = $3 AND member_id = $4
    `;
        const updateValues = [newBalance, created_at, member_voucher_name, memberId];
        await pool().query(updateQuery, updateValues);

        // Step 4: Log the FOC removal
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
      ) VALUES (
        $1, 'Remove Free Of Charge', $2,
        $3, $4, $5, 'Remove OF FOC',
        $5, $2, $2
      )
    `;
        const insertValues = [
            memberVoucherId, // $1
            created_at,      // $2 (service_date, created_at, updated_at)
            newBalance,      // $3
            -focNum,         // $4
            created_by       // $5 (serviced_by, created_by)
        ];
        await pool().query(insertLogQuery, insertValues);

        return { member_voucher_name, newBalance };
    } catch (error) {
        console.error("Error removing FOC from member voucher:", error);
        throw new Error("Failed to remove FOC from member voucher.");
    }
};


const setMemberVoucherBalanceAfterTransfer = async (
    memberId: number,
    member_voucher_name: string,
    transferredBalance: number
): Promise<{ member_voucher_name: string; newBalance: number }> => {
    try {
        const selectQuery = `
      SELECT current_balance
      FROM member_vouchers
      WHERE member_voucher_name = $1 AND member_id = $2
    `;
        const selectValues = [member_voucher_name, memberId];
        const result = await pool().query(selectQuery, selectValues);

        if (result.rows.length === 0) {
            throw new Error("Member voucher not found.");
        }

        const currentBalance = result.rows[0].current_balance;
        const newBalance = 0;
        const updateQuery = `
      UPDATE member_vouchers
      SET current_balance = $1, updated_at = NOW(), status = 'disabled'
      WHERE member_voucher_name = $2 AND member_id = $3
    `;
        const updateValues = [newBalance, member_voucher_name, memberId];
        await pool().query(updateQuery, updateValues);

        return {
            member_voucher_name,
            newBalance,
        };
    } catch (error) {
        console.error("Error updating member voucher balance:", error);
        throw new Error("Failed to update member voucher balance.");
    }
};


export default {
    getVoucherTemplatesDetails,
    getMemberVoucherWithDetails,
    getAllVoucherTemplateNames,
    checkIfFreeOfChargeIsUsed,
    removeFOCFromVoucher,
    setMemberVoucherBalanceAfterTransfer
};
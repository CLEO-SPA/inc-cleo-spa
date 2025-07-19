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

const checkIfFreeOfChargeIsUsedById = async (
    voucher_id: number
): Promise<boolean> => {
    try {
        const query = `
      SELECT current_balance, free_of_charge
      FROM member_vouchers
      WHERE id = $1
    `;
        const values = [voucher_id];
        const result = await pool().query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Voucher not found');
        }

        const { current_balance, free_of_charge } = result.rows[0];
        return Number(current_balance) > Number(free_of_charge);
    } catch (error) {
        console.error("Error checking FOC usage by ID:", error);
        throw new Error("Failed to check free of charge usage by ID");
    }
};


const removeFOCFromVoucherById = async (
    voucher_id: number,
    created_by: number,
    created_at: string
): Promise<{ voucher_id: number; newBalance: number }> => {
    try {
        const fetchQuery = `
      SELECT current_balance, free_of_charge
      FROM member_vouchers
      WHERE id = $1
    `;
        const fetchResult = await pool().query(fetchQuery, [voucher_id]);

        if (fetchResult.rows.length === 0) {
            throw new Error("Voucher not found.");
        }

        const { current_balance, free_of_charge } = fetchResult.rows[0];
        const currentBalanceNum = parseFloat(current_balance);
        const focNum = parseFloat(free_of_charge);
        const newBalance = Math.max(0, currentBalanceNum - focNum);

        const updateQuery = `
      UPDATE member_vouchers
      SET current_balance = $1, updated_at = $2
      WHERE id = $3
    `;
        await pool().query(updateQuery, [newBalance, created_at, voucher_id]);

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
        $1, 'Remove Free Of Charge', $2, $3, $4, $5, 'Remove OF FOC', $5, $2, $2
      )
    `;
        const insertValues = [
            voucher_id,
            created_at,
            newBalance,
            -focNum,
            created_by
        ];
        await pool().query(insertLogQuery, insertValues);

        return { voucher_id, newBalance };
    } catch (error) {
        console.error("Error removing FOC by ID:", error);
        throw new Error("Failed to remove FOC by voucher ID.");
    }
};


const setMemberVoucherBalanceAfterTransferById = async (
    voucher_id: number,
    transferredBalance: number,
    created_at: string
): Promise<{ voucher_id: number; newBalance: number }> => {
    try {
        const selectQuery = `
      SELECT current_balance
      FROM member_vouchers
      WHERE id = $1
    `;
        const result = await pool().query(selectQuery, [voucher_id]);

        if (result.rows.length === 0) {
            throw new Error("Voucher not found.");
        }

        const newBalance = 0;

        const updateQuery = `
      UPDATE member_vouchers
      SET current_balance = $1, updated_at = $2, status = 'disabled'
      WHERE id = $3
    `;
        await pool().query(updateQuery, [newBalance, created_at, voucher_id]);

        return { voucher_id, newBalance };
    } catch (error) {
        console.error("Error updating voucher balance by ID:", error);
        throw new Error("Failed to update voucher balance by ID");
    }
};


const getMemberVoucherCurrentBalanceById = async (
    voucher_id: number
): Promise<number> => {
    try {
        const query = `
      SELECT current_balance
      FROM member_vouchers
      WHERE id = $1
      LIMIT 1
    `;
        const result = await pool().query(query, [voucher_id]);

        if (result.rows.length === 0) {
            throw new Error('Voucher not found');
        }

        return Number(result.rows[0].current_balance);
    } catch (error) {
        console.error("❌ Error getting current balance by ID:", error);
        throw new Error("Failed to get current balance by ID");
    }
};

export default {
    getVoucherTemplatesDetails,
    getMemberVoucherWithDetails,
    getAllVoucherTemplateNames,
    checkIfFreeOfChargeIsUsedById,
    removeFOCFromVoucherById,
    setMemberVoucherBalanceAfterTransferById,
    getMemberVoucherCurrentBalanceById
};
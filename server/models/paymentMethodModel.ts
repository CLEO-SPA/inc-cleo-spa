import { pool, query as dbQuery, queryOnPool } from '../config/database.js';
import { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../types/paymentMethod.types.js';

// Fetch all payment methods with pagination and optional search
const getAllPaymentMethods = async (offset: number, limit: number, search?: string) => {
  try {
    const filters: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search) {
      filters.push(`payment_method_name ILIKE $${idx++}`);
      values.push(`%${search}%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT *
      FROM payment_methods
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${idx++} OFFSET $${idx++};
    `;
    values.push(limit, offset);
    const result = await dbQuery(query, values);

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_methods
      ${whereClause};
    `;
    const countResult = await dbQuery(countQuery, values.slice(0, -2));
    const totalPages = Math.ceil(Number(countResult.rows[0].count) / limit);

    return {
      paymentMethods: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw new Error('Error fetching payment methods');
  }
};

// Create a new payment method
const createPaymentMethod = async (input: CreatePaymentMethodInput) => {
  const { payment_method_name, is_enabled, is_income, show_on_payment_page, created_at, updated_at } = input;

  try {
    // Check if name already exists
    const existing = await dbQuery(`SELECT id FROM payment_methods WHERE LOWER(payment_method_name) = LOWER($1);`, [
      payment_method_name,
    ]);
    if (existing.rows.length > 0) {
      throw new Error('Another payment method with this name already exists');
    }

    const query = `
      INSERT INTO payment_methods (
        payment_method_name, is_enabled, is_income,
        show_on_payment_page, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [payment_method_name, is_enabled, is_income, show_on_payment_page, created_at, updated_at];
    const result = await dbQuery(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating payment method:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Could not create payment method');
  }
};

// Update a payment method
const updatePaymentMethod = async (input: UpdatePaymentMethodInput) => {
  const {
    id,
    payment_method_name,
    is_enabled,
    is_income,
    show_on_payment_page,
    percentage_rate,
    created_at,
    updated_at,
  } = input;

  try {
    // Step 1: Fetch current payment method
    const existingMethod = await dbQuery(
      `SELECT payment_method_name, is_protected, LOWER(payment_method_name) as lower_name FROM payment_methods WHERE id = $1;`,
      [id]
    );

    if (existingMethod.rows.length === 0) {
      throw new Error('Payment method not found');
    }

    const currentMethod = existingMethod.rows[0];

    // Step 2: Check if it's protected
    const isGstMethod = currentMethod.lower_name === 'gst' || currentMethod.lower_name.includes('gst');

    if (currentMethod.is_protected) {
      // Special case: GST is protected but can have percentage_rate edited
      if (isGstMethod) {
        // Update only percentage_rate for GST
        const gstQuery = `
          UPDATE payment_methods
          SET
            percentage_rate = $1,
            updated_at = $2
          WHERE id = $3
          RETURNING *;
        `;

        const gstValues = [
          percentage_rate, // $1
          updated_at, // $2
          id, // $3
        ];

        const result = await dbQuery(gstQuery, gstValues);
        return result.rows[0];
      } else {
        // All other protected methods cannot be modified at all
        throw new Error('This payment method is protected and cannot be modified');
      }
    }

    // Step 3: For non-protected methods, check for duplicate name (excluding current id)
    const duplicateCheck = await dbQuery(
      `SELECT id FROM payment_methods WHERE LOWER(payment_method_name) = LOWER($1) AND id != $2;`,
      [payment_method_name, id]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error('Another payment method with this name already exists');
    }

    // Step 4: Proceed with full update for non-protected methods
    const query = `
      UPDATE payment_methods
      SET
        payment_method_name = $1,
        is_enabled = $2,
        is_income = $3,
        show_on_payment_page = $4,
        percentage_rate = $5,
        updated_at = $6,
        created_at = $7
      WHERE id = $8
      RETURNING *;
    `;

    const values = [
      payment_method_name, // $1
      is_enabled, // $2
      is_income, // $3
      show_on_payment_page, // $4
      percentage_rate, // $5
      updated_at, // $6
      created_at, // $7
      id, // $8
    ];

    const result = await dbQuery(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating payment method:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Could not update payment method');
  }
};

const deletePaymentMethod = async (id: number) => {
  try {
    // Step 1: Fetch the payment method
    const result = await dbQuery(`SELECT is_protected FROM payment_methods WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Payment method not found.',
      };
    }

    // Step 2: Check if it's protected
    if (result.rows[0].is_protected) {
      return {
        success: false,
        error: 'Cannot delete: This payment method is protected by the system.',
      };
    }

    // Step 3: Check for usage in transactions
    const checkResult = await dbQuery(
      `SELECT COUNT(*) AS count FROM payment_to_sale_transactions WHERE payment_method_id = $1`,
      [id]
    );

    const usageCount = parseInt(checkResult.rows[0].count, 10);

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete: This payment method is used in ${usageCount} transaction(s).`,
      };
    }

    // Step 4: Proceed with deletion
    await dbQuery(`DELETE FROM payment_methods WHERE id = $1`, [id]);

    return { success: true };
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return {
      success: false,
      error: 'An error occurred while deleting the payment method.',
    };
  }
};

const getPaymentMethodsForPaymentPage = async () => {
  try {
    const query = `
      SELECT *
      FROM payment_methods
      WHERE show_on_payment_page = true
      AND is_enabled = true
      ORDER BY id ASC;
    `;
    const { rows } = await dbQuery(query);
    return rows;
  } catch (error) {
    console.error('Error fetching payment methods for payment page:', error);
    throw new Error('Could not fetch visible payment methods');
  }
};

const getPaymentMethodById = async (id: number) => {
  try {
    const query = `SELECT * FROM payment_methods WHERE id = $1`;
    const result = await dbQuery(query, [id]);

    return result.rows[0]; // or `null` if not found
  } catch (error) {
    console.error('Error fetching payment method by ID:', error);
    throw new Error('Could not fetch payment method');
  }
};

export default {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodsForPaymentPage,
  getPaymentMethodById,
};

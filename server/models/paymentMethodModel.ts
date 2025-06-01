import { pool } from '../config/database.js';
import { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../types/paymentMethod.types.js';


// Fetch all payment methods with pagination and optional search
const getAllPaymentMethods = async (
  offset: number,
  limit: number,
  search?: string
) => {
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
    const result = await pool().query(query, values);

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_methods
      ${whereClause};
    `;
    const countResult = await pool().query(countQuery, values.slice(0, -2));
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
  const {
    payment_method_name,
    is_enabled,
    is_revenue,
    show_on_payment_page,
    created_at,
    updated_at,
  } = input;

  try {
    const query = `
      INSERT INTO payment_methods (
        payment_method_name, is_enabled, is_revenue,
        show_on_payment_page, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      payment_method_name,
      is_enabled,
      is_revenue,
      show_on_payment_page,
      created_at,
      updated_at,
    ];
    const result = await pool().query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw new Error('Could not create payment method');
  }
};


// Update a payment method
const updatePaymentMethod = async (input: UpdatePaymentMethodInput) => {
  const { id, payment_method_name, is_enabled, is_revenue, show_on_payment_page, updated_at } = input;
  try {
    const query = `
      UPDATE payment_methods
      SET
        payment_method_name = $1,
        is_enabled = $2,
        is_revenue = $3,
        show_on_payment_page = $4,
        updated_at = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [
      payment_method_name,
      is_enabled,
      is_revenue,
      show_on_payment_page,
      updated_at,
      id,
    ];
    const result = await pool().query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw new Error('Could not update payment method');
  }
};


// Delete a payment method
const deletePaymentMethod = async (id: number) => {
  try {
    await pool().query(`DELETE FROM payment_methods WHERE id = $1`, [id]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw new Error('Could not delete payment method');
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
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching payment methods for payment page:', error);
    throw new Error('Could not fetch visible payment methods');
  }
};

const getPaymentMethodById = async (id: number) => {
  try {
    const query = `SELECT * FROM payment_methods WHERE id = $1`;
    const result = await pool().query(query, [id]);

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
  getPaymentMethodById
};

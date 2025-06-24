import { pool, getProdPool as prodPool } from '../config/database.js';

const getProductCategories = async () => {
  try {
    const query = `
      SELECT 
        pc.*,
        COUNT(p.id) AS total_products
      FROM product_categories pc
      LEFT JOIN products p ON p.product_category_id = pc.id
      GROUP BY pc.id
      ORDER BY pc.product_category_sequence_no;
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching product categories:', error);
    throw new Error('Error fetching product categories');
  }
};

const getProductCategoryById = async (id: number) => {
  try {
    const query = `
        SELECT 
            id,
            product_category_name
        FROM product_categories
        WHERE id = $1; 
    `;
    const result = await pool().query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching product category by id:', error);
    throw new Error('Error fetching product category by id');
  }
};

// create a new product category
const createProductCategory = async (name: string) => {
  try {
    const query = `SELECT * FROM create_product_category($1)`;
    const result = await pool().query(query, [name]);
    return result.rows;
  } catch (error) {
    console.error('Error creating product category:', error);

    if (error instanceof Error && error.message.includes('Category already exists')) {
      throw new Error('Category already exists');
    }

    throw new Error('Error creating product category');
  }
};

// update product category by id
const updateProductCategory = async (id: number, name: string) => {
  try {
    const result = await prodPool().query('SELECT * FROM update_product_category($1, $2)', [id, name]);
    return result.rows;
  } catch (error) {
    console.error('Error updating product category:', error);

    if (error instanceof Error && error.message.includes('does not exist')) {
      throw new Error('Category not found');
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('Category already exists');
    }

    throw new Error('Error updating product category');
  }
};

// reorder product category sequence no
const reorderProductCategory = async (categories: { id: number; product_category_sequence_no: number }[]) => {
  const client = await prodPool().connect();

  try {
    await client.query('BEGIN');

    for (const { id, product_category_sequence_no } of categories) {
      await client.query(
        `UPDATE product_categories
         SET product_category_sequence_no = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [product_category_sequence_no, id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// get sales history by product id, selected month and year
const getSalesHistoryByProductId = async (id: number, month: number, year: number) => {
  try {
    const salesQuery = `SELECT * FROM get_sales_history_for_each_product($1, $2, $3);`;
    const result = await pool().query(salesQuery, [id, year, month]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching sales history by product ID:', error);
    throw new Error('Error fetching sales history');
  }
};

export default {
  getProductCategories,
  getProductCategoryById,
  createProductCategory,
  updateProductCategory,
  reorderProductCategory,
  getSalesHistoryByProductId,
};

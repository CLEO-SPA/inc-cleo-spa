import { get } from 'http';
import { pool, getProdPool as prodPool } from '../config/database.js';
import { createProductInput, updateProductInput } from '../types/product.type.js';

// get products with pagination and filter
const getProductsPaginationFilter = async (
  page: number,
  limit: number,
  search?: string | null,
  category?: number | null,
  status?: boolean | null
) => {
  try {
    const query = `
      SELECT * FROM get_products_with_pagination(
      $1::INT, 
      $2::INT,
      $3::TEXT,
      $4::BIGINT,
      $5::BOOLEAN
      );`;
    const params = [page, limit, search, category, status];
    const result = await prodPool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getProductsPaginationFilter:', error);
    throw new Error('Error fetching products with pagination and filter');
  }
};

// get total pages for pagination
const getTotalCount = async (search?: string | null, category?: number | null, status?: boolean | null) => {
  try {
    let query = `SELECT COUNT(*) AS total_count FROM products`;
    const conditions: string[] = [];
    const params: (string | number | boolean)[] = [];

    if (search != null) {
      params.push(search);
      conditions.push(`product_name ILIKE '%' || $${params.length}::TEXT || '%'`);
    }

    if (category != null) {
      params.push(category);
      conditions.push(`product_category_id = $${params.length}::BIGINT`);
    }

    if (status != null) {
      params.push(status);
      conditions.push(`product_is_enabled = $${params.length}::BOOLEAN`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    const result =
      search || category || status !== null ? await prodPool().query(query, params) : await prodPool().query(query);
    if (result.rows.length === 0) {
      return 0; // No products found
    }

    return result.rows[0].total_count;
  } catch (error) {
    console.error('Error in getTotalPages:', error);
    throw new Error('Error fetching total number of pages');
  }
};

// get product by id, include both enabled and disabled products
const getProductById = async (id: number) => {
  try {
    const query = `
        SELECT *
        FROM public.products
        WHERE id = $1; 
    `;
    const result = await pool().query(query, [id]); // Added id parameter to query
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching product by id:', error);
    throw new Error('Error fetching product by id');
  }
};

// get product by name
const getProductByName = async (product_name: string) => {
  try {
    const query = `
        SELECT 
            s.id,
            s.product_name
        FROM products AS s
        WHERE s.product_name = $1; 
    `;
    const result = await pool().query(query, [product_name]); // Added string parameter to query
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching product by name:', error);
    throw new Error('Error fetching product by name');
  }
};

// get products by category id
const getProductByCategory = async (product_category_id: number) => {
  try {
    const query = `
    SELECT id, product_name, product_sequence_no FROM products
    WHERE product_category_id = $1
    AND product_is_enabled = true
    ORDER BY product_sequence_no ASC;`;
    const result = await pool().query(query, [product_category_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Error fetching products');
  }
};

// get product sequence number by counting products that are enabled and in same category
const getProductSequenceNo = async (product_category_id: number) => {
  try {
    // get sequence number by counting products that are enabled and in same category
    const query = `
    SELECT COUNT(*) + 1 AS seq_no FROM products
    WHERE product_category_id = $1
    AND product_is_enabled = true;`;
    const result = await pool().query(query, [product_category_id]);
    return result.rows[0].seq_no;
  } catch (error) {
    console.error('Error fetching product sequence no:', error);
    throw new Error('Error fetching product sequence no');
  }
};

// create product
const createProduct = async ({
  product_name,
  product_description,
  product_remarks,
  product_unit_sale_price,
  product_unit_cost_price,
  product_is_enabled,
  created_at,
  updated_at,
  product_category_id,
  product_sequence_no,
  created_by,
  updated_by,
}: createProductInput) => {
  try {
    const query = `
      INSERT INTO products (
        product_name,
        product_description,
        product_remarks,
        product_unit_sale_price,
        product_unit_cost_price,
        product_is_enabled,
        created_at,
        updated_at,
        product_category_id,
        product_sequence_no,
        created_by,
        updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
    `;
    const params = [
      product_name,
      product_description,
      product_remarks,
      product_unit_sale_price,
      product_unit_cost_price,
      product_is_enabled,
      created_at,
      updated_at,
      product_category_id,
      product_sequence_no,
      created_by,
      updated_by,
    ];
    const result = await pool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error creating new product:', error);
    throw new Error('Error creating new product');
  }
};

// update product
const updateProduct = async ({
  id,
  product_name,
  product_description,
  product_remarks,
  product_unit_sale_price,
  product_unit_cost_price,
  created_at,
  updated_at,
  product_category_id,
  product_sequence_no,
  created_by,
  updated_by,
}: Partial<updateProductInput>) => {
  try {
    const conditions: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let index = 1;

    if (product_name) {
      params.push(product_name);
      conditions.push(`product_name = $${index++}`);
    }

    if (product_description != null) {
      params.push(product_description);
      conditions.push(`product_description = $${index++}`);
    }

    if (product_remarks != null) {
      params.push(product_remarks);
      conditions.push(`product_remarks = $${index++}`);
    }

    if (product_unit_sale_price) {
      params.push(product_unit_sale_price);
      conditions.push(`product_unit_sale_price = $${index++}`);
    }

    if (product_unit_cost_price) {
      params.push(product_unit_cost_price);
      conditions.push(`product_unit_cost_price = $${index++}`);
    }

    if (product_category_id) {
      params.push(product_category_id);
      conditions.push(`product_category_id = $${index++}`);
      if (product_sequence_no) {
        params.push(product_sequence_no);
        conditions.push(`product_sequence_no = $${index++}`);
      }
    }

    if (created_at) {
      params.push(created_at);
      conditions.push(`created_at = $${index++}`);
    }

    if (created_by) {
      params.push(created_by);
      conditions.push(`created_by = $${index++}`);
    }

    // Always update updated_at and updated_by
    params.push(updated_at || new Date().toISOString());
    conditions.push(`updated_at = $${index++}`);

    params.push(updated_by || '');
    conditions.push(`updated_by = $${index++}`);

    const query = `UPDATE products SET ${conditions.join(', ')} WHERE id = $${index}
    RETURNING *`;
    params.push(id || 0);

    const result = await prodPool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Error updating product');
  }
};

// reorder product
const reorderProducts = async (products: { id: number; product_sequence_no: number }[]) => {
  try {
    const query = `
    UPDATE products
    SET product_sequence_no = $1
    WHERE id = $2`;
    for (const product of products) {
      const params = [product.product_sequence_no, product.id];
      await prodPool().query(query, params);
    }
    return { success: true, updatedCount: products.length };
  } catch (error) {
    console.error('Error updating product sequence:', error);
    throw new Error('Error updating product sequence');
  }
};



// PRODUCT CATEGORIES
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
  getProductsPaginationFilter,
  getTotalCount,
  getProductById,
  getProductByName,
  getProductByCategory,
  getProductSequenceNo,
  createProduct,
  updateProduct,
  reorderProducts,
  getProductCategories,
  getProductCategoryById,
  createProductCategory,
  updateProductCategory,
  reorderProductCategory,
  getSalesHistoryByProductId,
};

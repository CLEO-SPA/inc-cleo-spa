import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import productModel from '../models/productModel.js';
import { updateProductInput } from '../types/product.type.js';

//Validation for safe input
function isSafeInput(input: string) {
  // Allow only letters, numbers, spaces, and a few symbols
  return /^[\w\s\,-.&+_()$/]+$/.test(input);
}

// get products with pagination and filter
const getProductsPaginationFilter = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, search, category, status } = req.query;
  try {
    const data: { [key: string]: (string | number | boolean | null) } = {};

    if (typeof page === 'string' && validator.isInt(page)) {
      data.page = parseInt(page, 10);
    } else {
      data.page = 1;
    }

    if (typeof limit === 'string' && validator.isInt(limit)) {
      data.limit = parseInt(limit, 10);
    } else {
      data.limit = 10;
    }

    if (typeof search === 'string' && isSafeInput(search)) {
      data.search = search;
    } else {
      data.search = null;
    }

    if (typeof category === 'string' && validator.isInt(category) && parseInt(category, 10) != 0) {
      data.category = parseInt(category, 10);
    } else {
      data.category = null;
    }

    if (typeof status === 'string' && validator.isBoolean(status)) {
      data.status = status.toLowerCase() === 'true'; // convert to boolean
    } else {
      data.status = null;
    }

    const totalCount = await productModel.getTotalCount(data.search, data.category, data.status);
    const totalPages = Math.ceil(totalCount / data.limit);
    const products = await productModel.getProductsPaginationFilter(
      data.page,
      data.limit,
      data.search,
      data.category,
      data.status
    );
    res.status(200).json({ totalPages, products });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get product by id
const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const product = await productModel.getProductById(id);

    if (!product || product.length === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json(product); // Assuming only one row is returned
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// get product by category
const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category_id = parseInt(req.params.category_id, 10);

    if (isNaN(category_id)) {
      res.status(400).json({ message: 'Invalid product category ID' });
      return;
    }

    const products = await productModel.getProductByCategory(category_id);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Validate product data before creating or updating
const validateProductData = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10) || null;
  const productData = req.body;

  const {
    product_name,
    product_description,
    product_remarks,
    product_unit_sale_price,
    product_unit_cost_price,
    product_category_id,
    created_at,
    created_by,
  } = productData;

  //Check if all fields are provided
  if (!product_name || !product_unit_sale_price || !product_unit_cost_price || !product_category_id || !created_at || !created_by) {
    res.status(400).json({ message: 'Data missing from required fields.' });
    return;
  }

  if (product_name) {
    if (!isSafeInput(product_name.trim())) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    } else {
      const product = await productModel.getProductByName(product_name);
      if (product) {
        if (id) {
          // Updating: allow only if it's the same product
          if (parseInt(product.id,10) != id) {
            res.status(400).json({ message: 'Product name already exists' });
            return;
          }
        } else {
          // Creating: any existing product with same name is a conflict
          res.status(400).json({ message: 'Product name already exists' });
          return;
        }
      }
    }
  }

  if (product_description && !isSafeInput(product_description.trim())) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (product_remarks && !isSafeInput(product_remarks.trim())) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (product_category_id) {
    if (!validator.isInt(product_category_id)) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    } else {
      const category = await productModel.getProductCategoryById(product_category_id);
      if (!category || category.length === 0) {
        res.status(404).json({ message: 'Product Category not found' });
        return;
      }
    }
  }
  if (!validator.isNumeric(product_unit_sale_price) || !validator.isNumeric(product_unit_cost_price)) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (!validator.isISO8601(created_at)) {
    throw new Error('Invalid data type');
  }

  next();
};

// create product
const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  const formData = req.body;
  try {
    // check if all required fields are present
    if (!validator.isBoolean(formData.product_is_enabled.toString())) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    }

    // get product sequence no (last in the category)
    const product_sequence_no = parseInt(await productModel.getProductSequenceNo(formData.product_category_id));

    // add product_sequence_no, updated_at, updated_by
    const productData = {
      ...formData,
      created_at: new Date(formData.created_at).toISOString(),
      product_sequence_no: product_sequence_no,
      updated_by: formData.created_by,
      updated_at: req.session.start_date_utc
        ? new Date(req.session.start_date_utc).toISOString
        : new Date().toISOString(),
    };

    const newProduct = await productModel.createProduct(productData);
    if (newProduct) {
      res.status(201).json({ product: newProduct[0], message: 'Product created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to create product' });
    }
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// update product
const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const formData = req.body;
  const { updated_by, updated_at } = formData;
  try {
    //check if product exists
    const product = await productModel.getProductById(id);
    if (!product) {
      res.status(404).json({ message: 'Product Not Found' });
      return;
    }

    // validate updated by and updated at values
    if (!updated_by || !updated_at) {
      res.status(400).json({ message: 'Data missing from required fields.' });
      return;
    }

    // Dynamic Update payload
    const updatePayload: Partial<updateProductInput> = {};

    if (formData.product_name && formData.product_name !== product.product_name) {
      updatePayload.product_name = formData.product_name;
    }

    if (formData.product_description !== product.product_description) {
      updatePayload.product_description = formData.product_description;
    }

    if (formData.product_remarks !== product.product_remarks) {
      updatePayload.product_remarks = formData.product_remarks;
    }

    if (formData.product_unit_sale_price && formData.product_unit_sale_price !== product.product_unit_sale_price) {
      updatePayload.product_unit_sale_price = formData.product_unit_sale_price;
    }
    if (formData.product_unit_cost_price && formData.product_unit_cost_price !== product.product_unit_cost_price) {
      updatePayload.product_unit_cost_price = formData.product_unit_cost_price;
    }

    if (formData.product_category_id && formData.product_category_id !== product.product_category_id) {
      updatePayload.product_category_id = formData.product_category_id;
      updatePayload.product_sequence_no = parseInt(await productModel.getProductSequenceNo(formData.product_category_id));
      }

    if (formData.created_at && formData.created_at !== product.created_at) {
      updatePayload.created_at = formData.created_at;
    }

    if (formData.created_by && formData.created_by !== product.created_by) {
      updatePayload.created_by = formData.created_by;
    }

    //if no changes detected so far
    if (Object.keys(updatePayload).length === 0) {
      res.status(400).json({ message: 'No changes detected' });
    } else {
      // add in updated at and updated by
      // because they might be changed
      updatePayload.updated_at = formData.updated_at;
      updatePayload.updated_by = formData.updated_by;
      updatePayload.id = id;
    }

    const updatedProduct = await productModel.updateProduct(updatePayload);
    if (updatedProduct) {
      res.status(200).json({ product: updatedProduct[0], message: 'Product updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update product' });
    }
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// reorder product
const reorderProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || !products.every(product =>
      typeof product === 'object' &&
      validator.isInt(product.id) &&
      validator.isInt(product.product_sequence_no.toString()))) {
      res.status(400).json({ message: 'Invalid Data' });
      return;
    }

    const updatedSequence = await productModel.reorderProducts(products);

    if (updatedSequence.success) {
      res.status(200).json({ message: 'Reorder Product Sequence Successfully' });
    } else {
      res.status(400).json({ message: 'Error reordering product sequence' });
    }
  } catch (error) {
    console.error('Error in reorderProduct:', error);
    res.status(500).json({ message: 'Failed to reorder product sequence' });
  }
};

// enable/disable product by id

// PRODUCT CATEGORIES ROUTES
// Get Product Categories
const getProductCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productCategories = await productModel.getProductCategories();

    if (!productCategories || productCategories.length === 0) {
      res.status(404).json({ message: 'Product categories not found' });
      return;
    }

    res.status(200).json(productCategories);
  } catch (error) {
    console.error('Error in getProductCategories:', error);
    next(error);
  }
};

// create a new product category
const createProductCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { category_name } = req.body;
  console.log(category_name);

  try {
    if (!category_name || typeof category_name !== 'string') {
      res.status(400).json({ message: 'Invalid or missing category name' });
      return;
    }

    const newCategory = await productModel.createProductCategory(category_name.trim());

    res.status(201).json({ category: newCategory[0], message: 'Category created successfully' });
  } catch (error) {
    console.error('Error in createProductCategory:', error);

    if (error instanceof Error && error.message === 'Category already exists') {
      res.status(409).json({ message: 'Category already exists' });
      return;
    }

    next(error);
  }
};

// update product category by id
const updateProductCategory = async (req: Request, res: Response, next: NextFunction) => {
  const catId = parseInt(req.params.catId, 10);
  const { name } = req.body;

  try {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Invalid or missing category name' });
      return;
    }

    const updated = await productModel.updateProductCategory(catId, name.trim());
    res.status(200).json({ category: updated[0], message: 'Category name updated successfully.' });
  } catch (error) {
    console.error('Error in updateProductCategory:', error);

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        res.status(404).json({ message: error.message });
        return;
      }

      if (error.message === 'Category already exists') {
        res.status(409).json({ message: error.message });
        return;
      }
    }

    next(error);
  }
};

// reorder product category sequence no
const reorderProductCategory = async (req: Request, res: Response, next: NextFunction) => {
  const categories = req.body;

  if (!Array.isArray(categories) || categories.some((cat) => !cat.id || cat.product_category_sequence_no == null)) {
    res.status(400).json({ message: 'Invalid category data.' });
    return;
  }

  try {
    await productModel.reorderProductCategory(categories);
    res.status(200).json({ message: 'Product categories reordered successfully.' });
    return;
  } catch (error) {
    console.error('Error updating category order:', error);
    next(error);
  }
};

// get sales history by product id, selected month and year
const getSalesHistoryByProductId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.productId, 10);
    const { month, year } = req.query;

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }

    const salesData = await productModel.getSalesHistoryByProductId(
      id,
      parseInt(month as string, 10),
      parseInt(year as string, 10)
    );

    if (!salesData || salesData.length === 0) {
      res.status(404).json({ message: 'No sales history found' });
      return;
    }

    const summary = salesData.find((row) => row.result_type === 'monthly_summary');
    const daily = salesData.filter((row) => row.result_type === 'daily_breakdown');

    res.status(200).json({ summary, daily });
  } catch (error) {
    console.error('Error in getSalesHistoryByProductId:', error);
    next(error);
  }
};

export default {
  getProductsPaginationFilter,
  getProductById,
  getProductsByCategory,
  getProductCategories,
  validateProductData,
  createProduct,
  updateProduct,
  reorderProduct,
  createProductCategory,
  updateProductCategory,
  reorderProductCategory,
  getSalesHistoryByProductId,
};

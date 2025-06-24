import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import productModel from '../models/productModel.js';

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
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  reorderProductCategory,
  getSalesHistoryByProductId,
};

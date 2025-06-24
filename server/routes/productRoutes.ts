import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

// PRODUCT CATEGORIES ROUTES
//  get all product categories
router.get('/product-cat', productController.getProductCategories)
//  create a new product category
router.post('/create-product-cat', productController.createProductCategory)
//  update product category by id
router.put('/update-product-cat/:catId', productController.updateProductCategory)
//  reorder product category sequence number
router.put('/reorder-product-cat', productController.reorderProductCategory)

// get sales history by product id, selected month and year
router.get('/sales-history/:productId', productController.getSalesHistoryByProductId);

export default router;

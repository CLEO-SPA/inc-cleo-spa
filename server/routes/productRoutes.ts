import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();
// get all products

// get products with pagination and filter
router.get('/all-page-filter', productController.getProductsPaginationFilter);

// get product by category
router.get('/all-by-cat/:category_id', productController.getProductsByCategory);

// create product
router.post('/create-product', productController.validateProductData, productController.createProduct);

// update product by id
router.put('/update-product/:id', productController.validateProductData, productController.updateProduct);

// update product sequence no
router.put('/reorder-product', productController.reorderProduct);

// update product status
router.put('/product-status/:id', productController.changeProductStatus);

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

// get Product by id
router.get('/:id', productController.getProductById);

// Get product categories with pagination and search filter
router.get('/product-cat/page-filter', productController.getProductCategoriesPaginationFilter);

export default router;

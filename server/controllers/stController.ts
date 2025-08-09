import { Request, Response, NextFunction } from 'express';
import model from '../models/stModel.js';
// import { decodeCursor } from '../utils/cursorUtils.js';
// import { PaginatedOptions, CursorPayload } from '../types/common.types.js';
// import { create } from 'domain';
import { ProcessPartialPaymentDataWithHandler } from '../types/SaleTransactionTypes.js';

const getSalesTransactionList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      filter,
      searchQuery,
      memberSearchQuery,
      sortField = 'transaction_id',
      sortDirection = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const result = await model.getSalesTransactionList(
      filter as string,
      searchQuery as string,
      memberSearchQuery as string,
      sortField as string,
      sortDirection as string,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: parseInt(limit as string) || 10,
      },
    });
  } catch (error) {
    console.error('Error fetching sales transaction list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales transaction list',
    });
  }
};

// Get sales transaction by ID
const getSalesTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Sales transaction ID is required',
      });
      return;
    }

    const transaction = await model.getSalesTransactionById(id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Sales transaction not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching sales transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales transaction',
    });
  }
};

const searchServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;

    const searchResults = await model.searchServices(query || '');

    res.status(200).json({
      success: true,
      data: searchResults,
      total: searchResults.length,
    });
  } catch (error: any) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search services',
      details: error.message,
    });
  }
};

const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;

    const searchResults = await model.searchProducts(query || '');

    res.status(200).json({
      success: true,
      data: searchResults,
      total: searchResults.length,
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      details: error.message,
    });
  }
};

const createServicesProductsTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Creating services/products transaction:', req.body);

    // Call the model function
    const result = await model.createServicesProductsTransaction(req.body);

    console.log('Services/products transaction created successfully:', result);

    res.locals.data = {
      success: true,
      message: 'Services/products transaction created successfully',
      data: result
    };

    next();

    // res.status(201).json({
    //   success: true,
    //   message: 'Services/products transaction created successfully',
    //   data: result,
    // });
  } catch (error: any) {
    console.error('Error creating services/products transaction:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create services/products transaction',
      details: error.message,
    });
  }
};

const createMcpTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Creating MCP transaction:', req.body);

    const result = await model.createMcpTransaction(req.body);

    console.log('MCP transaction created successfully:', result);

    res.locals.data = {
      success: true,
      message: 'MCP transaction created successfully',
      data: result,
    };

    next();

    // res.status(201).json({
    //   success: true,
    //   message: 'MCP transaction created successfully',
    //   data: result,
    // });
  } catch (error: any) {
    console.error('Error creating MCP transaction:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create MCP transaction',
      details: error.message,
    });
  }
};



const createMcpTransferTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating MCP Transfer transaction:', req.body);

    const result = await model.createMcpTransferTransaction(req.body);

    console.log('MCP Transfer transaction created successfully:', result);

    res.status(201).json({
      success: true,
      message: 'MCP Transfer transaction created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating MCP Transfer transaction:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create MCP Transfer transaction',
      details: error.message,
    });
  }
};

const createMvTransferTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating MV Transfer transaction:', req.body);

    const result = await model.createMvTransferTransaction(req.body);

    console.log('MV Transfer transaction created successfully:', result);

    res.status(201).json({
      success: true,
      message: 'MV Transfer transaction created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating MV Transfer transaction:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create MV Transfer transaction',
      details: error.message,
    });
  }
};
const processPartialPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const paymentData: ProcessPartialPaymentDataWithHandler = req.body;

    console.log('Processing partial payment for transaction:', id, req.body);

    // Validate that we have the transaction ID
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
      return;
    }

    // Validate payment data structure
    if (!paymentData.payments || !Array.isArray(paymentData.payments) || paymentData.payments.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one payment method is required',
      });
      return;
    }

    // Validate that we have the transaction handler ID
    if (!paymentData.transaction_handler_id) {
      res.status(400).json({
        success: false,
        message: 'Transaction handler ID is required',
      });
      return;
    }

    const result = await model.processPartialPayment(id, paymentData);

    console.log('Partial payment processed successfully:', result);

    res.status(201).json({
      success: true,
      message: 'Partial payment processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error processing partial payment:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process partial payment',
      details: error.message,
    });
  }
};

export default {
  getSalesTransactionList,
  getSalesTransactionById,
  searchServices,
  searchProducts,
  createServicesProductsTransaction,
  createMcpTransaction,
  createMcpTransferTransaction,
  createMvTransferTransaction,
  processPartialPayment,
};
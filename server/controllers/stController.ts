import { Request, Response, NextFunction } from 'express';
import model from '../models/stModel.js';
// import { decodeCursor } from '../utils/cursorUtils.js';
// import { PaginatedOptions, CursorPayload } from '../types/common.types.js';
// import { create } from 'domain';


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
      parseInt(limit as string) || 10,
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: parseInt(limit as string) || 10
      }
    });
  } catch (error) {
    console.error('Error fetching sales transaction list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales transaction list'
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
        error: 'Sales transaction ID is required'
      });
      return;
    }

    const transaction = await model.getSalesTransactionById(id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Sales transaction not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching sales transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales transaction'
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
      total: searchResults.length
    });
  } catch (error: any) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search services',
      details: error.message
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
      total: searchResults.length
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      details: error.message
    });
  }
};


export default {
  getSalesTransactionList,
  getSalesTransactionById,
  searchServices,
  searchProducts
};

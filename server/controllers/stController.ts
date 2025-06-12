import { Request, Response, NextFunction } from 'express';
import model from '../models/stModel.js';
// import { decodeCursor } from '../utils/cursorUtils.js';
// import { PaginatedOptions, CursorPayload } from '../types/common.types.js';
// import { create } from 'domain';

const getAllSaleTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // if (!req.session || !req.session.user_id) {
    //   res.status(401).json({ message: 'Not authenticated' });
    //    return;
    // }

    const transactions = await model.getAllSaleTransactions();
     res.status(200).json({ transactions });
      return;
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
     res.status(500).json({ message: 'Error fetching sales transactions' });
      return;
  }
};

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




export default {
  getAllSaleTransaction,
  getSalesTransactionList,
  getSalesTransactionById,
};

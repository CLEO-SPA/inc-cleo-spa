import { Request, Response, NextFunction } from 'express';
import model from '../models/stModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';
import { PaginatedOptions, CursorPayload } from '../types/common.types.js';

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

async function getInvoiceList(req, res) {
  try {
    const {
      filter,
      searchQuery,
      memberSearchQuery,
      sortField,
      sortDirection,
      page,
      limit,
      outlet_id
    } = req.query;

    const outletId = outlet_id ? outlet_id : res.locals.outlet?.[0].outlet_id || 1;

    const invoices = await invoiceModel.getInvoiceList(
      filter,
      searchQuery,
      memberSearchQuery,
      sortField,
      sortDirection,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      outletId
    );

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoice list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice list'
    });
  }
};

async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID is required'
      });
    }

    const invoice = await invoiceModel.getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
};

export default {
  getAllSaleTransaction,
};

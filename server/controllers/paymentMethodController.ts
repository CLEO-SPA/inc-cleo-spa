import { Request, Response, NextFunction } from 'express';
import model from '../models/paymentMethodModel.js';

// Get all payment methods with search and pagination
const getAllPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const pageLimit = parseInt(limit as string);

    const result = await model.getAllPaymentMethods(offset, pageLimit, search as string);

    res.status(200).json({
      data: result.paymentMethods,
      pageInfo: {
        currentPage: parseInt(page as string),
        totalPages: result.totalPages,
        totalCount: result.paymentMethods.length,
        limit: pageLimit,
      },
    });
  } catch (error) {
    console.error('Error in getAllPaymentMethods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

// Get only methods that should show on payment page
const getPaymentMethodsForPaymentPage = async (req: Request, res: Response) => {
  try {
    const methods = await model.getPaymentMethodsForPaymentPage();
    res.status(200).json(methods);
  } catch (error) {
    console.error('Error in getPaymentMethodsForPaymentPage:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods for payment page' });
  }
};

// Get a single payment method by ID
const getPaymentMethodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payment method ID' });
      return; // Add explicit return
    }

    const method = await model.getPaymentMethodById(id);

    if (!method) {
      res.status(404).json({ message: 'Payment method not found' });
      return; // Add explicit return
    }

    res.status(200).json(method);
  } catch (error) {
    console.error('Error in getPaymentMethodById:', error);
    res.status(500).json({ message: 'Failed to fetch payment method' });
  }
};


// Create a new payment method
const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const newMethod = await model.createPaymentMethod(req.body);
    res.status(201).json(newMethod);
  } catch (error) {
    console.error('Error in createPaymentMethod:', error);
    if (error instanceof Error && error.message === 'Another payment method with this name already exists') {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create payment method' });
    }
  }
};

// Update an existing payment method
const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedMethod = await model.updatePaymentMethod({
      ...req.body,
      id: Number(id),
    });
    
    res.status(200).json(updatedMethod);
  } catch (error) {
    console.error('Error in updatePaymentMethod:', error);
    if (error instanceof Error && error.message === 'Another payment method with this name already exists') {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update payment method' });
    }
  }
};

// Delete a payment method by ID
const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await model.deletePaymentMethod(Number(id));
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deletePaymentMethod:', error);
    res.status(500).json({ message: 'Failed to delete payment method' });
  }
};

// Export all handlers
export default {
  getPaymentMethodById,
  getAllPaymentMethods,
  getPaymentMethodsForPaymentPage,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
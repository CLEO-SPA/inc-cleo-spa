import { Request, Response, NextFunction } from 'express';
import model from '../models/superAdminModel.js';

const insertPreDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.insertPreDataModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in insertPreDataController', error);
    next(error);
  }
};

const insertPostDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.insertPostDataModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in insertPostDataController', error);
    next(error);
  }
};

const getPreDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPreDataModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getPreDataController', error);
    next(error);
  }
};

const getPostDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPostDataModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getPostDataController', error);
    next(error);
  }
};

const getAllExistingTables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await model.getAllExistingTablesModel();

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in checkDataFileExists', error);
    next(error);
  }
};

const getCurrentSeedingOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await model.getCurrentSeedingOrderModel();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getCurrentSeedingOrderController', error);
    // The error from the model (which includes cycle details) will be passed to the error handler
    next(error);
  }
};

const getOrdersForTableController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tableName } = req.params;
    if (!tableName) {
      res.status(400).json({ message: 'Table name parameter is required.' });
      return;
    }
    const results = await model.getOrdersForTableModel(tableName);
    res.status(200).json(results);
  } catch (error) {
    console.error(`Error in getOrdersForTableController for table ${req.params.tableName}:`, error);
    next(error);
  }
};

export default {
  insertPreDataController,
  insertPostDataController,
  getPreDataController,
  getPostDataController,
  getAllExistingTables,
  getCurrentSeedingOrderController,
  getOrdersForTableController,
};

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import model from '../models/superAdminModel.js';
import { postSeedDir, preSeedDir } from '../store/multerStore.js';

const insertPreDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { targetTable, tablePayload } = req.body;

    if (!Array.isArray(tablePayload)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidTablePayload = tablePayload.every((s) => {
      return typeof s.table === 'string' && typeof s.file === 'string';
    });

    if (!isValidTablePayload) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.insertPreDataModel(targetTable, tablePayload);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in insertPreDataController', error);
    next(error);
  }
};

const insertPostDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { targetTable, tablePayload } = req.body;

    if (!Array.isArray(tablePayload)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidTablePayload = tablePayload.every((s) => {
      return typeof s.table === 'string' && typeof s.file === 'string';
    });

    if (!isValidTablePayload) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.insertPostDataModel(targetTable, tablePayload);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in insertPostDataController', error);
    next(error);
  }
};

const getAllPreDataFilesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPreDataFilesModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getAllPreDataFilesController', error);
    next(error);
  }
};

const getAllPostDataFilesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPostDataFilesModel(tableName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getAllPostDataFilesController', error);
    next(error);
  }
};

const getPreDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;
    const fileName: string = req.params.file;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPreDataModel(tableName, fileName);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getPreDataController', error);
    next(error);
  }
};

const getPostDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName: string = req.params.table;
    const fileName: string = req.params.file;

    if (!tableName) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.getPostDataModel(tableName, fileName);

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

const savePreDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'File upload failed or no file was provided.' });
    return;
  }
  if (!req.body.tableName) {
    // Clean up the uploaded temp file if tableName is missing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    res.status(400).json({ message: 'Table name is required.' });
    return;
  }

  const tempPath = req.file.path;
  const targetDir = path.join(preSeedDir, req.body.tableName);
  const finalPath = path.join(targetDir, req.file.originalname); // Use originalname for the final file

  try {
    // Ensure the target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Move the file from temp path to final path
    fs.renameSync(tempPath, finalPath); // Or use fs.promises.rename for async

    res.status(200).json({
      message: `File '${req.file.originalname}' uploaded successfully to 'pre/${req.body.tableName}' directory.`,
    });
  } catch (error) {
    console.error('Error moving file:', error);
    // Attempt to clean up the temp file in case of an error during move
    fs.unlink(tempPath, (err) => {
      if (err) console.error('Error deleting temp file after move error:', err);
    });
    res.status(500).json({ message: 'Error processing file upload.' });
  }
};

const savePostDataController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'File upload failed or no file was provided.' });
    return;
  }
  if (!req.body.tableName) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    res.status(400).json({ message: 'Table name is required.' });
    return;
  }

  const tempPath = req.file.path;
  const targetDir = path.join(postSeedDir, req.body.tableName);
  const finalPath = path.join(targetDir, req.file.originalname);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.renameSync(tempPath, finalPath);
    res.status(200).json({
      message: `File '${req.file.originalname}' uploaded successfully to 'post/${req.body.tableName}' directory.`,
    });
  } catch (error) {
    console.error('Error moving file:', error);
    fs.unlink(tempPath, (err) => {
      if (err) console.error('Error deleting temp file after move error:', err);
    });
    res.status(500).json({ message: 'Error processing file upload.' });
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
  getAllPreDataFilesController,
  getAllPostDataFilesController,
  savePreDataController,
  savePostDataController,
};

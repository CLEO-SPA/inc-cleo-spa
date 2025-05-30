import { Request, Response, NextFunction } from 'express';
import model from '../models/cpModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';
import { PaginatedOptions, CursorPayload } from '../types/common.types.js';

const getAllCarePackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);
  const searchTerm = req.query.searchTerm as string;

  // console.log(`\n${startDate_utc} || ${endDate_utc} \n`);

  if (limit <= 0) {
    res.status(400).json({ error: 'Limit must be a positive integer.' });
    return;
  }
  if (page && (isNaN(page) || page <= 0)) {
    res.status(400).json({ error: 'Page must be a positive integer.' });
    return;
  }

  let after: CursorPayload | null = null;
  if (afterCursor) {
    after = decodeCursor(afterCursor);
    if (!after) {
      res.status(400).json({ error: 'Invalid "after" cursor.' });
      return;
    }
  }

  let before: CursorPayload | null = null;
  if (beforeCursor) {
    before = decodeCursor(beforeCursor);
    if (!before) {
      res.status(400).json({ error: 'Invalid "before" cursor.' });
      return;
    }
  }

  // Hybrid logic (Prioritize page over cursors if condition met)
  if (page && (after || before)) {
    console.warn('Both page and cursor parameters provided. Prioritizing page.');
    after = null;
    before = null;
  }

  const options: PaginatedOptions = {
    after,
    before,
    page,
    searchTerm,
  };

  try {
    const results = await model.getPaginatedCarePackages(limit, options, start_date_utc, end_date_utc as string);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in CarePackageController.getCarePackages:', error);
    throw new Error('Error in CarePackageController.getCarePackages');
  }
};

const getCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    const results = await model.getCarePackageById(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting carePackage By Id', error);
    throw new Error('Error getting carePackage By Id');
  }
};

const createCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      employee_id,
      services,
      created_at,
      updated_at,
    } = req.body;

    if (!package_name || !package_price || !Array.isArray(services)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidService = services.every((s) => {
      return (
        typeof s.id === 'string' ||
        (typeof s.id === 'number' &&
          typeof s.name === 'string' &&
          typeof s.quantity === 'number' &&
          s.quantity > 0 &&
          typeof s.price === 'number' &&
          s.price >= 0 &&
          typeof s.finalPrice === 'number' &&
          s.finalPrice >= 0 &&
          typeof s.discount === 'number' &&
          s.discount >= 0 &&
          s.discount <= 1)
      );
    });

    if (!isValidService) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.createCarePackage(
      package_name,
      package_remarks,
      parseFloat(package_price),
      services,
      !!!is_customizable,
      employee_id || req.session.user_id,
      created_at,
      updated_at
    );

    res.status(201).json(results);
  } catch (error) {
    console.error('Error creating carePackage', error);
    throw new Error('Error creating carePackage');
  }
};

const updateCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, package_name, package_remarks, package_price, is_customizable, services, created_at, updated_at } =
      req.body;

    if (!!!is_customizable) {
      res.status(401).json({ message: 'Package is not customizable' });
      return;
    }

    if (!id || !package_name || !package_price || !Array.isArray(services)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidService = services.every((s) => {
      return (
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        typeof s.quantity === 'number' &&
        s.quantity > 0 &&
        typeof s.price === 'number' &&
        s.price >= 0 &&
        typeof s.discount === 'number' &&
        s.discount >= 0 &&
        s.discount <= 1
      );
    });

    if (!isValidService) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    // const results = await model.updateCarePackageById(
    //   id,
    //   package_name,
    //   package_remarks,
    //   package_price,
    //   services,
    //   is_customizable,
    //   created_at,
    //   updated_at
    // );

    // res.status(200).json(results);
  } catch (error) {
    console.error('Error updating carePackage By Id', error);
    throw new Error('Error updating carePackage By Id');
  }
};

const deleteCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
  } catch (error) {
    console.error('Error deleting carePackage By Id', error);
    throw new Error('Error deleting carePackage By Id');
  }
};

const emulateCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      id,
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      status_id,
      services,
      created_at,
      updated_at,
    } = req.body;
    const method = req.method;

    if (method === 'GET') {
      res.status(400).send('Cannot Emulate GET method');
      return;
    }

    if (!package_name || !package_price || !Array.isArray(services)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidService = services.every((s) => {
      return (
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        typeof s.quantity === 'number' &&
        s.quantity > 0 &&
        typeof s.price === 'number' &&
        s.price >= 0 &&
        typeof s.discount === 'number' &&
        s.discount >= 0 &&
        s.discount <= 1
      );
    });

    if (!isValidService) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.emulateCarePackage(method, {
      id,
      package_name,
      package_remarks,
      package_price: parseFloat(package_price),
      services,
      is_customizable,
      status_id,
      created_at,
      updated_at,
      user_id: req.session.user_id!,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error emulating carePackage');
    throw new Error('Error emulating carePackage');
  }
};

export default {
  getAllCarePackages,
  getCarePackageById,
  createCarePackage,
  updateCarePackageById,
  emulateCarePackage,
  deleteCarePackageById,
};

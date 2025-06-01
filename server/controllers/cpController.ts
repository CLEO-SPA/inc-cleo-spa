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
    next(error);
  }
};

const getCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    const results = await model.getCarePackageById(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting carePackage By Id', error);
    next(error);
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
    next(error);
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
    next(error);
  }
};

const deleteCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
  } catch (error) {
    console.error('Error deleting carePackage By Id', error);
    next(error);
  }
};

interface servicePayload {
  id: string;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
  discount: number;
}

interface emulatePayload {
  id?: string;
  package_name: string;
  package_remarks: string;
  package_price: number;
  services: servicePayload[];
  is_customizable: boolean;
  status_id: string;
  created_at: string;
  updated_at: string;
  employee_id?: string;
  user_id?: string;
}

const emulateCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const method = req.method as string;
    const user_id = req.session?.user_id;

    if (method === 'GET') {
      res.status(400).send('Cannot Emulate GET method');
      return;
    }

    if (method === 'DELETE') {
      const deleteId = req.query?.id;
      if (!deleteId) {
        res.status(400).json({ message: "Missing 'id' for DELETE operation (expected in body or params)." });
        return;
      }

      const results = await model.emulateCarePackage(method, { id: deleteId } as emulatePayload);
      res.status(200).json(results);
      return;
    }

    const {
      id,
      package_name,
      package_remarks,
      package_price,
      services,
      is_customizable,
      status_id,
      created_at,
      updated_at,
      employee_id,
    } = req.body;

    // --- Validations for POST and PUT ---
    const requiredFieldsErrorMessages: string[] = [];
    if (!package_name) requiredFieldsErrorMessages.push('package_name is required');
    if (package_price === undefined) requiredFieldsErrorMessages.push('package_price is required');
    if (!Array.isArray(services) || services.length === 0) {
      requiredFieldsErrorMessages.push('services must be a non-empty array');
    }
    if (typeof is_customizable !== 'boolean') requiredFieldsErrorMessages.push('is_customizable (boolean) is required');
    if (method === 'PUT') if (!status_id) requiredFieldsErrorMessages.push('status_id is required');
    if (method === 'POST') if (!created_at) requiredFieldsErrorMessages.push('created_at is required');
    if (!updated_at) requiredFieldsErrorMessages.push('updated_at is required');

    if (requiredFieldsErrorMessages.length > 0) {
      res
        .status(400)
        .json({ message: 'Missing or invalid required fields: ' + requiredFieldsErrorMessages.join(', ') });
      return;
    }

    const numericPackagePrice = parseFloat(package_price);
    if (isNaN(numericPackagePrice)) {
      res.status(400).json({ message: 'Invalid package_price format.' });
      return;
    }

    const isValidService = services.every(
      (s: any) =>
        s &&
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

    if (!isValidService) {
      res.status(400).json({ message: 'One or more service items have an invalid format or missing fields.' });
      return;
    }

    const modelPayload: Partial<emulatePayload> = {
      id,
      package_name,
      package_remarks: package_remarks || '',
      package_price: numericPackagePrice,
      services,
      is_customizable,
      status_id,
      created_at,
      updated_at,
      employee_id,
      user_id,
    };

    const results = await model.emulateCarePackage(method, modelPayload);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error emulating carePackage');
    next(error);
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

import { Request, Response, NextFunction } from 'express';
import model from '../models/mcpModel.js';
import { decodeCursor } from '../utils/cursorUtils.js';
import { CursorPayload, PaginatedOptions } from '../types/common.types.js';

const getAllMemberCarePackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { start_date_utc, end_date_utc } = req.session;
  const limit: number = parseInt((req.query.limit as string) || '10');
  const afterCursor: string = req.query.after as string;
  const beforeCursor: string = req.query.before as string;
  const page = parseInt(req.query.page as string);
  const searchTerm = req.query.searchTerm as string;

  if (limit <= 0) {
    res.status(400).json({ error: 'Limit must be a positive integer.' });
    return;
  }
  if (page && (isNaN(page) || page <= 0)) {
    res.status(400).json({ error: 'Page must be a positive integer.' });
    return;
  }

  if (afterCursor && !decodeCursor(afterCursor)) {
    res.status(400).json({ error: 'Invalid "after" cursor.' });
    return;
  }

  if (beforeCursor && !decodeCursor(beforeCursor)) {
    res.status(400).json({ error: 'Invalid "before" cursor.' });
    return;
  }

  if (page && (afterCursor || beforeCursor)) {
    console.warn('Both page and cursor parameters provided. Prioritizing page.');
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

  const options: PaginatedOptions = {
    after,
    before,
    page,
    searchTerm,
  };

  try {
    const results = await model.getPaginatedMemberCarePackages(limit, options, start_date_utc, end_date_utc as string);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in CarePackageController.getCarePackages:', error);
    next(error);
  }
};

const getMemberCarePackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ message: 'Missing or invalid id' });
      return;
    }

    const results = await model.getMemberCarePackageById(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting member care package by id', error);
    next(error);
  }
};

const createMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { package_name, member_id, employee_id, package_remarks, package_price, services, created_at, updated_at } =
      req.body;

    if (!package_name || !member_id || !employee_id || !package_price || !Array.isArray(services)) {
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
        typeof s.finalPrice === 'number' &&
        s.finalPrice >= 0 &&
        typeof s.discount === 'number' &&
        s.discount >= 0 &&
        s.discount <= 1
      );
    });

    if (!isValidService) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.createMemberCarePackage(
      package_name,
      member_id,
      employee_id,
      package_remarks,
      parseFloat(package_price),
      services,
      created_at,
      updated_at
    );

    res.status(201).json(results);
  } catch (error) {
    console.error('Error creating member care package', error);
    next(error);
  }
};

const updateMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      id,
      package_name,
      package_remarks,
      package_price,
      package_balance,
      services,
      status,
      updated_at,
      employee_id,
    } = req.body;

    const requiredFieldsErrorMessages: string[] = [];
    if (!package_name) requiredFieldsErrorMessages.push('package_name is required');
    if (package_price === undefined) requiredFieldsErrorMessages.push('package_price is required');
    if (!Array.isArray(services) || services.length === 0) {
      requiredFieldsErrorMessages.push('services must be a non-empty array');
    }
    if (!status) requiredFieldsErrorMessages.push('status is required');
    if (status !== 'ENABLED' && status !== 'DISABLED') requiredFieldsErrorMessages.push('Invalid Status Name');
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
      (s: { id: string; name: string; quantity: number; price: number; discount: number }) =>
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

    const results = await model.updateMemberCarePackage(
      id,
      package_name,
      package_remarks,
      package_price,
      package_balance,
      services,
      status,
      employee_id,
      req.session.user_id!,
      updated_at
    );
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error Updating member care package', error);
    next(error);
  }
};

// Permanent Delete
const deleteMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ message: 'Missing or invalid id' });
      return;
    }

    const results = await model.deleteMemberCarePackage(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error deleting member care package', error);
    next(error);
  }
};

// Soft delete
const removeMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ message: 'Missing or invalid id' });
      return;
    }

    const results = await model.removeMemberCarePackage(id);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error removing member care package', error);
    next(error);
  }
};

const createConsumption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mcp_id, mcp_details, employee_id } = req.body;

    if (!mcp_id || !Array.isArray(mcp_details)) {
      res.status(400).json({ message: 'Missing or Invalid Required Field' });
      return;
    }

    const isValidDetails = mcp_details.every((s) => {
      return typeof s.mcpd_id === 'string' && typeof s.mcpd_quantity === 'number' && typeof s.mcpd_date === 'string';
    });

    if (!isValidDetails) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.createConsumption(mcp_id, mcp_details, employee_id, req.session.user_id!);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error creating consumption', error);
    next(error);
  }
};

const enableMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, services } = req.body;

    if (!id || !Array.isArray(services)) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const isValidService = services.every((s) => {
      return (
        typeof s.id === 'string' &&
        typeof s.status_name === 'string' &&
        (s.status_name === 'ENABLED' || s.status_name === 'DISABLED')
      );
    });

    if (!isValidService) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.enableMemberCarePackage(id, services);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error enabling member care package', error);
    next(error);
  }
};

const transferMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mcp_id1, mcp_id2 } = req.body;

    if (!mcp_id1 && !mcp_id2) {
      res.status(400).json({ message: 'Missing required fields or invalid data format' });
      return;
    }

    const results = await model.transferMemberCarePackage(mcp_id1, mcp_id2);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error transfering member care package', error);
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
  member_id: string;
  employee_id?: string;
  user_id?: string;
  package_remarks: string;
  package_price: number;
  services: servicePayload[];
  status: 'ENABLED' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

const emulateMemberCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const results = await model.emulateMemberCarePackage(method, { id: deleteId as string });
      res.status(200).json(results);
      return;
    }

    const {
      id,
      package_name,
      package_remarks,
      package_price,
      services,
      status,
      created_at,
      updated_at,
      member_id,
      employee_id,
    } = req.body;

    // --- Validations for POST and PUT ---
    const requiredFieldsErrorMessages: string[] = [];
    if (!package_name) requiredFieldsErrorMessages.push('package_name is required');
    if (package_price === undefined) requiredFieldsErrorMessages.push('package_price is required');
    if (!Array.isArray(services) || services.length === 0) {
      requiredFieldsErrorMessages.push('services must be a non-empty array');
    }
    if (method === 'PUT') if (!status) requiredFieldsErrorMessages.push('status is required');
    if (method === 'PUT')
      if (status !== 'ENABLED' && status !== 'DISABLED') requiredFieldsErrorMessages.push('Invalid Status Name');
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
      (s: { id: string; name: string; quantity: number; price: number; discount: number }) =>
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
      status,
      created_at,
      updated_at,
      employee_id,
      user_id,
      member_id,
    };

    const results = await model.emulateMemberCarePackage(method, modelPayload);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error emulating carePackage');
    next(error);
  }
};

export default {
  getAllMemberCarePackages,
  getMemberCarePackageById,
  createMemberCarePackage,
  updateMemberCarePackage,
  deleteMemberCarePackage,
  createConsumption,
  removeMemberCarePackage,
  enableMemberCarePackage,
  transferMemberCarePackage,
  emulateMemberCarePackage,
};

import { Request, Response, NextFunction } from 'express';
import model from '../models/voucherTemplateModel.js';

// Get all voucher templates with filters and pagination
const getAllVoucherTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date_utc, end_date_utc } = req.session;

    const {
      page = '1',
      limit = '10',
      startDate_utc,
      endDate_utc,
      createdBy,
      search,
      status
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const pageLimit = parseInt(limit as string);

    const result = await model.getAllVoucherTemplates(
      offset,
      pageLimit,
      startDate_utc as string,
      endDate_utc as string,
      createdBy as string,
      search as string,
      status as string,
      start_date_utc!,
      end_date_utc!
    );

    res.status(200).json({
      data: result.voucherTemplates,
      pageInfo: {
        currentPage: parseInt(page as string),
        totalPages: result.totalPages,
        totalCount: result.voucherTemplates.length,
        limit: pageLimit
      }
    });
  } catch (error) {
    console.error('Error in getAllVoucherTemplates:', error);
    next(error);
}
};
// Create a new voucher template
const createVoucherTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newVoucherTemplate = await model.createVoucherTemplate(req.body);
    res.status(201).json(newVoucherTemplate);
  } catch (error) {
    console.error('Error in createVoucherTemplate:', error);
  }
};

// Update an existing voucher template
const updateVoucherTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const updatedVoucherTemplate = await model.updateVoucherTemplate({
      ...req.body,
      id: id,
    });

    res.status(200).json(updatedVoucherTemplate);
  } catch (error) {
    console.error('Error in updateVoucherTemplate:', error);
    res.status(500).json({ message: 'Failed to update voucher template' });
  }
};

// Delete a voucher template by ID
const deleteVoucherTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await model.deleteVoucherTemplate(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteVoucherTemplate:', error);
    res.status(500).json({ message: 'Failed to delete voucher template' });
  }
};

// Get a single voucher template by ID
const getVoucherTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
      const { start_date_utc, end_date_utc } = req.session;
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid voucher template ID' });
        return;
        }

    const voucherTemplate = await model.getVoucherTemplateById(id, start_date_utc!, end_date_utc!);

    if (!voucherTemplate) {
      res.status(404).json({ message: 'Voucher template not found' });
      return;
    }

    res.status(200).json(voucherTemplate);
  } catch (error) {
    console.error('Error in getVoucherTemplateById:', error);
    next(error);
  }
};

const getAllVoucherTemplatesForDropdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date_utc, end_date_utc } = req.session;
    const templates = await model.getAllVoucherTemplatesForDropdown(start_date_utc!, end_date_utc!);
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error in getAllVoucherTemplates:', error);
    next(error);
  }
};

// Export all handlers in the same pattern
export default {
  getAllVoucherTemplates,
  getVoucherTemplateById,
  createVoucherTemplate,
  updateVoucherTemplate,
  deleteVoucherTemplate,
  getAllVoucherTemplatesForDropdown
};
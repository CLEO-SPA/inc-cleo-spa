import { Request, Response, NextFunction } from 'express';
import model from '../models/memberModel.js';

// Get all members with filters and pagination
const getAllMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date_utc, end_date_utc } = req.session;

    const {
      page = '1',
      limit = '10',
      startDate_utc,
      endDate_utc,
      createdBy,
      search
    } = req.query;

    const offset = (parseInt(page as string)-1) * parseInt(limit as string);
    const pageLimit = parseInt(limit as string);

    const result = await model.getAllMembers(
      offset,
      pageLimit,
      startDate_utc as string,
      endDate_utc as string,
      createdBy as string,
      search as string,
      start_date_utc!,
      end_date_utc!
    );

      res.status(200).json({
      data: result.members,
      pageInfo: {
        currentPage: parseInt(page as string),
        totalPages: result.totalPages,
        totalCount: result.totalCount, 
        limit: pageLimit
      }
    });  } catch (error) {
    console.error('Error in getAllMembers:', error);
    next(error);
  }
};


// Create a new member
const createMember = async (req: Request, res: Response) => {
  try {
    const newMember = await model.createMember(req.body);
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error in createMember:', error);
    
    // Check for specific validation errors
    if (error instanceof Error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      if (error.message === 'Contact number already exists') {
        return res.status(409).json({ message: 'Contact number already exists' });
      }
      if (error.message === 'Error creating member') {
        return res.status(500).json({ message: 'Failed to create member' });
      }
    }
    
    // Generic error fallback
    res.status(500).json({ message: 'Failed to create member' });
  }
};

// Update an existing member
const updateMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedMember = await model.updateMember({
      ...req.body,
      id: Number(id),
    });
    
    res.status(200).json(updatedMember);
  } catch (error) {
    console.error('Error in updateMember:', error);
    
    // Check for specific validation errors
    if (error instanceof Error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      if (error.message === 'Contact number already exists') {
        return res.status(409).json({ message: 'Contact number already exists' });
      }
      if (error.message.includes('Member with ID') && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Could not update member') {
        return res.status(500).json({ message: 'Failed to update member' });
      }
    }
    
    // Generic error fallback
    res.status(500).json({ message: 'Failed to update member' });
  }
};


// Delete a member by ID
const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await model.deleteMember(Number(id));
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteMember:', error);
    
    // Pass specific error message if it's an Error instance
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete member' });
    }
  }
};


// Get a single member by ID
const getMemberById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date_utc, end_date_utc } = req.session;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid member ID' });
      return;
    }

    const member = await model.getMemberById(id, start_date_utc!, end_date_utc!);

    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    res.status(200).json(member);
  } catch (error) {
    console.error('Error in getMemberById:', error);
    next(error);
  }
};

const searchMemberByNameOrPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date_utc, end_date_utc } = req.session;
    const searchTerm = req.query.q as string;

    if (!searchTerm || searchTerm.trim() === '') {
      res.status(400).json({ message: 'Search term is required' });
      return;
    }

    const result = await model.searchMemberByNameOrPhone(searchTerm, start_date_utc!, end_date_utc!);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in searchMemberByNameOrPhone:', error);
    next(error);
  }
};


const getMemberVouchers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = parseInt(req.params.memberId, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const searchTerm = (req.query.searchTerm as string)?.trim() || undefined;

    if (isNaN(memberId)) {
      res.status(400).json({ message: 'Invalid member ID' });
      return;
    }

    const offset = (page - 1) * limit;

    const { vouchers, totalPages, totalCount } = await model.getMemberVouchers(
      memberId,
      offset,
      limit,
      searchTerm
    );

    res.status(200).json({
      data: vouchers,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });
  } catch (error) {
    console.error('Error in getMemberVouchers:', error);
    next(error);
  }
};


const getMemberCarePackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date_utc, end_date_utc } = req.session;
    const memberId = parseInt(req.params.memberId, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const searchTerm = (req.query.searchTerm as string)?.trim() || undefined;

    if (isNaN(memberId)) {
      res.status(400).json({ message: 'Invalid member ID' });
      return;
    }

    const offset = (page - 1) * limit;

    const { carePackages, totalPages, totalCount } = await model.getMemberCarePackages(
      memberId,
      offset,
      limit,
      searchTerm,
      start_date_utc!,
      end_date_utc!
    );

    res.status(200).json({
      data: carePackages,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });
  } catch (error) {
    console.error('Error in getMemberCarePackages:', error);
    next(error);
  }
};


// Export all handlers in the same pattern
export default {
  getAllMembers,
  getMemberById, 
  createMember,
  updateMember,
  deleteMember,
  searchMemberByNameOrPhone,
  getMemberVouchers,  
  getMemberCarePackages
};

import { Request, Response, NextFunction } from 'express';
import model from '../models/memberModel.js';

// Get all members with filters and pagination
const getAllMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      search as string
    );

      res.status(200).json({
      data: result.members,
      pageInfo: {
        currentPage: parseInt(page as string),
        totalPages: result.totalPages,
        totalCount: result.members.length, // You might want to add this to your model
        limit: pageLimit
      }
    });  } catch (error) {
    console.error('Error in getAllMembers:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
};


// Create a new member
const createMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newMember = await model.createMember(req.body);
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error in createMember:', error);
    res.status(500).json({ message: 'Failed to create member' });
  }
};

// Update an existing member
const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const updatedMember = await model.updateMember({
      ...req.body,
      id: Number(id),
    });

    res.status(200).json(updatedMember);
  } catch (error) {
    console.error('Error in updateMember:', error);
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
    res.status(500).json({ message: 'Failed to delete member' });
  }
};


// Get a single member by ID
const getMemberById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid member ID' });
      return;
    }

    const member = await model.getMemberById(id);

    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    res.status(200).json(member);
  } catch (error) {
    console.error('Error in getMemberById:', error);
    res.status(500).json({ message: 'Failed to fetch member' });
  }
};


// Export all handlers in the same pattern
export default {
  getAllMembers,
  getMemberById, 
  createMember,
  updateMember,
  deleteMember,
};

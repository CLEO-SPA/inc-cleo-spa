import { Request, Response, NextFunction } from 'express';
import model from '../models/positionModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import validator from 'validator';

const createPosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { position_name, position_description, position_is_active } = req.body;

    if (!position_name || !position_description) {
      res.status(400).json({ message: 'Position name and description are required' });
      return;
    }

    // Validate position name length
    if (!validator.isLength(position_name, { min: 2, max: 100 })) {
      res.status(400).json({ message: 'Position name must be between 2 and 100 characters' });
      return;
    }

    // Validate description length
    if (!validator.isLength(position_description, { min: 5, max: 500 })) {
      res.status(400).json({ message: 'Position description must be between 5 and 500 characters' });
      return;
    }

    // Check if the position name already exists
    const exists = await model.checkPositionNameExists(position_name);
    if (exists) {
      res.status(400).json({ message: 'Position name already exists' });
      return;
    }

    const currentTime = new Date().toISOString();

    // Create the new position
    const newPosition = await model.createPosition({
      position_name: position_name.trim(),
      position_description: position_description.trim(),
      position_is_active: position_is_active !== undefined ? position_is_active : true,
      position_created_at: currentTime,
      position_updated_at: currentTime,
    });

    res.status(201).json({
      message: 'Position created successfully',
      position: newPosition,
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ message: 'Error creating position' });
  }
};

const getAllPositions = async (req: Request, res: Response, next: NextFunction) => {
    
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const { start_date_utc, end_date_utc } = req.session;



  try {
    const { positions, totalPages } = await model.getAllPositions(offset, limit, start_date_utc!, end_date_utc!);

    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      pageSize: limit,
      data: positions,
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    next(error);
  }
};

const getPositionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
      res.status(400).json({ message: 'Valid position ID is required' });
      return;
    }

    const position = await model.getPositionById(id);

    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    res.status(200).json(position);
  } catch (error) {
    console.error('Error getting position by ID:', error);
    res.status(500).json({ message: 'Error getting position' });
  }
};

const updatePosition = async (req: Request, res: Response, next: NextFunction):  Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { position_name, position_description, position_is_active } = req.body;

    if (!id || isNaN(id)) {
       res.status(400).json({ message: 'Valid position ID is required' });
       return;
    }

    // Validate inputs if provided
    if (position_name && !validator.isLength(position_name, { min: 2, max: 100 })) {
       res.status(400).json({ message: 'Position name must be between 2 and 100 characters' });
       return;
    }

    if (position_description && !validator.isLength(position_description, { min: 5, max: 500 })) {
       res.status(400).json({ message: 'Position description must be between 5 and 500 characters' });
       return
    }

    // Check if new position name already exists (excluding current position)
    if (position_name) {
      const exists = await model.checkPositionNameExists(position_name);
      if (exists) {
        // Get current position to check if it's the same name
        const currentPosition = await model.getPositionById(id);
        if (currentPosition && currentPosition.position_name !== position_name) {
           res.status(400).json({ message: 'Position name already exists' });
           return
        }
      }
    }

    const currentTime = new Date().toISOString();

    const updatedPosition = await model.updatePosition(id, {
      position_name: position_name?.trim(),
      position_description: position_description?.trim(),
      position_is_active,
      position_updated_at: currentTime,
    });

    res.status(200).json({
      message: 'Position updated successfully',
      position: updatedPosition,
    });
  } catch (error) {
    console.error('Error updating position:', error);
    next(error);
  }
};

const deletePosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
       res.status(400).json({ message: 'Valid position ID is required' });
       return;
    }

    const deletedPosition = await model.deletePosition(id);

    res.status(200).json({
      message: 'Position deleted successfully',
      position: deletedPosition,
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    next(error);
  }
};

const togglePositionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
       res.status(400).json({ message: 'Valid position ID is required' });
       return;
    }

    const currentTime = new Date().toISOString();
    const updatedPosition = await model.togglePositionStatus(id, currentTime);

    res.status(200).json({
      message: `Position ${updatedPosition.position_is_active ? 'activated' : 'deactivated'} successfully`,
      position: updatedPosition,
    });
  } catch (error) {
    console.error('Error toggling position status:', error);
    next(error);
  }
};

const getAllPositionsForDropdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const positions = await model.getAllPositionsForDropdown();
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error in getAllPositionsForDropdown:', error);
    next(error);
  }
};

const getPositionCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await model.getPositionCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting position count:', error);
    next(error);
  }
};

export default {
  createPosition,
  getAllPositions,
  getPositionById,
  updatePosition,
  deletePosition,
  togglePositionStatus,
  getAllPositionsForDropdown,
  getPositionCount,
};

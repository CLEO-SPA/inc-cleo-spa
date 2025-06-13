import { Request, Response, NextFunction } from 'express';
import roleModel from '../models/roleModel.js';

/**
 * Get all roles for the currently logged in user
 */
const getCurrentUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const roles = await roleModel.getUserRoles(req.session.user_id);
    return res.status(200).json({ roles });
  } catch (error) {
    console.error('Error fetching user roles', error);
    throw new Error('Error fetching user roles');
  }
};

export default {
  getCurrentUserRoles,
};

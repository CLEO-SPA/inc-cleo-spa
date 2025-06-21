import { Request, Response, NextFunction, RequestHandler } from 'express';
import roleModel from '../models/roleModel.js';

const hasRole = (requiredRoles: string | string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.user_id) {
        res.status(401).json({ message: 'Unauthorized - Please log in' });
        return;
      }

      const userId = req.session.user_id;

      console.log('User ID from session:', userId);

      const userRoles = await roleModel.getUserRoles(userId);

      console.log('User roles:', userRoles);

      // Convert requiredRoles to array if it's a string
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Check if user has at least one of the required roles
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        res.status(403).json({
          message: 'Forbidden - You do not have permission to access this resource',
          requiredRoles: roles,
          yourRoles: userRoles,
        });
        return;
      }

      // If user has the required role, proceed
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ message: 'Internal server error during role verification' });
    }
  };
};

export default {
  hasRole,
};

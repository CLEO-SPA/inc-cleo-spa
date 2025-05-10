import roleModel from '../models/roleModel.js';

/**
 * Middleware to check if a user has the required role(s)
 * @param {string|string[]} requiredRoles - Single role string or array of role strings
 * @returns {Function} Express middleware function
 */
const hasRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized - Please log in' });
      }

      const userId = req.session.userId;
      
      // Get user roles from the database
      const userRoles = await roleModel.getUserRoles(userId);
      
      // Convert requiredRoles to array if it's a string
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Check if user has at least one of the required roles
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          message: 'Forbidden - You do not have permission to access this resource',
          requiredRoles: roles,
          yourRoles: userRoles
        });
      }
      
      // If user has the required role, proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ message: 'Internal server error during role verification' });
    }
  };
};

export default {
  hasRole
};
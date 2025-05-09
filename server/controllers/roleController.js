import roleModel from '../models/roleModel.js';

/**
 * Get all roles for the currently logged in user
 */
const getCurrentUserRoles = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const roles = await roleModel.getUserRoles(req.session.userId);
    return res.status(200).json({ roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return res.status(500).json({ message: 'Error fetching user roles', error: error.message });
  }
};

export default {
  getCurrentUserRoles
};
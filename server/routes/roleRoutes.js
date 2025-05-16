import express from 'express';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/test-super-admin/', 
  roleMiddleware.hasRole('super_admin'), 
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Super admin access granted',
      protectedData: {
        systemStats: {
          totalUsers: 152,
          activeUsers: 87,
          pendingRequests: 14
        },
        sensitiveOperations: [
          'Full database access',
          'User role management',
          'System configuration',
          'Security audit logs'
        ],
        serverInfo: {
          version: '1.0.0',
          environment: process.env.NODE_ENV,
          uptime: process.uptime() + ' seconds'
        }
      }
    });
  }
);

export default router;
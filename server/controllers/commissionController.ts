import { Request, Response } from 'express';
import model from '../models/commissionModel.js';

/**
 * GET /api/com/commissionSettings
 * This endpoint retrieves commission settings.
 */
const getAllCommissionSettings = async (req: Request, res: Response) => {
  try {
    const commissions = await model.getAllCommissionSettings();
    
    // Transform database results to frontend format
    const simplified: Record<string, string> = {};
    
    // Initialize with default values for expected commission types only
    const expectedKeys = ['service', 'product', 'package', 'member-voucher', 'mcpConsumption', 'mvConsumption'];
    expectedKeys.forEach(key => {
      simplified[key] = '0.00';
    });
    
    // Override with actual database values
    commissions.forEach(commission => {
      // Find the frontend key that maps to this database key
      const frontendKey = Object.keys(model.KEY_MAPPING).find(
        key => model.KEY_MAPPING[key as keyof typeof model.KEY_MAPPING] === commission.key
      );
      
      if (frontendKey) {
        simplified[frontendKey] = commission.value;
      }
    });

    // Ensure we only send commission data, no timestamps
    res.status(200).json(simplified);
  } catch (error) {
    console.error('Error in getAllCommissionSettings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch commission settings' 
    });
  }
};

/**
 * PUT /api/com/commissionSettings
 * This endpoint updates commission settings.
 */
const updateCommissionSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    // Validate request body
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request body must contain commission settings to update' 
      });
    }

    // Validate settings using model
    // const validation = model.validateCommissionSettings(updates);
    // if (!validation.isValid) {
    //   console.warn('Commission settings validation failed:', validation.errors);
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Invalid commission settings', 
    //     errors: validation.errors 
    //   });
    // }

    // Update settings
    const results = await model.updateMultipleCommissionSettings(updates);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${results.length} commission settings`,
      data: results
    });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update commission settings',
      error: errorMessage
    });
  }
};

export default {
  getAllCommissionSettings,
  updateCommissionSettings
};
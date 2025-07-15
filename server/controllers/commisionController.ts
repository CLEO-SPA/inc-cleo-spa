import { Request, Response, NextFunction } from 'express';
import model from '../models/commisionModel.js';

/**
 * Get /api/com/commissionSettings
 * This endpoint retrieves commission settings for assigned employee functionality.
 */
const getAllCommissionSettings = async (req: Request, res: Response) => {
  try {
    const commissions = await model.getAllCommissionSettings();
    console.log('raw commissions', commissions);
    // simplify keys for front-end consumption
    const simplified = {
      service: commissions.find((c) => c.key === 'adhoc_service')?.value,
      product: commissions.find((c) => c.key === 'adhoc_product')?.value,
      package: commissions.find((c) => c.key === 'member_care_package_purchase')?.value,
      'member-voucher': commissions.find((c) => c.key === 'member_voucher_purchase')?.value,
      mcpConsumption: commissions.find((c) => c.key === 'member_care_package_consumption')?.value,
      mvConsumption: commissions.find((c) => c.key === 'member_voucher_consumption')?.value,
      transfer: commissions.find((c) => c.key === 'member_care_package_purchase')?.value, // Utilised in CartItemsWithPayment
      transferMCP: commissions.find((c) => c.key === 'member_care_package_purchase')?.value,
      transferMV: commissions.find((c) => c.key === 'member_voucher_purchase')?.value,
    };

    res.status(200).json(simplified);
  } catch (error) {
    console.error('Error in getAllCommissionSettings:', error);
    res.status(500).json({ message: 'Failed to fetch commission settings for assigned employees' });
  }
};

export default {
  getAllCommissionSettings,
};

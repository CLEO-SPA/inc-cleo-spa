import { Request, Response, NextFunction } from 'express';
import model from '../models/refundModel.js';

const viewAllRefundSaleTransactionRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const start_date_utc = req.query.start_date_utc as string | undefined;
    const end_date_utc = req.query.end_date_utc as string | undefined;

    const results = await model.getAllRefundSaleTransactionRecords(start_date_utc, end_date_utc);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in RefundController.viewAllRefundSaleTransactionRecords:', error);
    next(error);
  }
};

const getServiceTransactionsForRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await model.getServiceTransactionsForRefund(
      req.query.member_id ? Number(req.query.member_id) : undefined,
      req.query.member_name as string | undefined,
      req.query.receipt_no as string | undefined,
      req.query.start_date_utc as string | undefined,
      req.query.end_date_utc as string | undefined
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getServiceTransactionsForRefund:', error);
    next(error);
  }
};


const processRefundService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refundResult = await model.processRefundService(req.body);

    res.status(201).json({ message: 'Refund processed successfully', refundTransactionId: refundResult.refundTransactionId });
  } catch (error) {
    console.error('Error in RefundController.processRefund:', error);
    next(error);
  }
};

////////////////////////////////////////

  // Middleware: Ensure the MCP exists and hasn’t already been refunded
  const validateMCPExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mcpId } = req.body;
      const mcp = await model.getMCPById(mcpId);

      if (!mcp) {
        res.status(404).json({ error: 'Member Care Package not found.' });
        return;
      }

      const refundedStatusId = await model.getStatusId('Refunded');
      if (mcp.status_id === refundedStatusId) {
        res.status(400).json({ error: 'This Member Care Package has already been refunded.' });
        return;
      }

      (req as any).mcpData = mcp;
      next();
    } catch (error) {
      console.error('validateMCPExists error:', error);
      next(error);
    }
  };

  // Middleware: Check if any services remain in the MCP to refund
  const checkRemainingServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mcpId } = req.body;
      const services = await model.getRemainingServices(mcpId);

      if (!services || services.length === 0) {
        res.status(400).json({ error: 'No remaining services to refund in this Member Care Package.' });
        return;
      }

      (req as any).remainingServices = services;
      next();
    } catch (error) {
      console.error('checkRemainingServices error:', error);
      next(error);
    }
  };

  // Controller: Handle full refund of a Member Care Package
  const processFullRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mcpId, refundedBy, refundRemarks } = req.body;

      const reqWithExtras = req as Request & {
        mcpData: { id: number; member_id: number; status_id: number };
        remainingServices: {
          id: number;
          service_id: number;
          service_name: string;
          quantity: number;
          price: number;
          discount: number;
        }[];
      };

      const result = await model.processFullRefundTransaction({
        mcpId,
        memberId: reqWithExtras.mcpData.member_id,
        remainingServices: reqWithExtras.remainingServices,
        refundedBy,
        refundRemarks
      });

      res.status(201).json({
        message: 'Full Member Care Package refund processed successfully.',
        refundTransactionId: result.refundTransactionId,
        totalRefundAmount: result.totalRefund,
        refundedServices: result.refundedServices
      });
    } catch (error) {
      console.error('processFullRefund error:', error);
      next(error);
    }
  };

  export default {
    viewAllRefundSaleTransactionRecords,
    getServiceTransactionsForRefund,
    processRefundService,
    validateMCPExists,
    checkRemainingServices,
    processFullRefund
  };

import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
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

  // Updated controller
const verifyRefundableServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mcpId } = req.body;
    
    // Get detailed status information
    const results = await model.fetchMCPStatusById(mcpId);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: 'Package not found',
        details: `No package found with ID ${mcpId}`
      });
    }

    // Filter services that are actually refundable
    const refundableServices = results
      .map(service => ({
        ...service,
        refundableQuantity: Math.min(
          service.purchased - service.consumed - service.refunded, // Actually paid and not consumed
          service.remaining // And still remaining in the package
        )
      }))
      .filter(service => service.refundableQuantity > 0);

    if (refundableServices.length === 0) {
      return res.status(400).json({
        error: 'No refundable services',
        details: 'All services are either unpaid, already consumed, or already refunded'
      });
    }

    // Prepare data for the refund processor
    const refundableDetails = refundableServices.map(service => ({
      id: service.detail_id || service.id, // Adjust based on your actual schema
      service_id: service.service_id,
      service_name: service.service_name,
      quantity: service.refundableQuantity, // Only the refundable amount
      price: service.price, // You'll need to include this in your status query
      discount: service.discount // You'll need to include this in your status query
    }));

    (req as any).remainingServices = refundableDetails;
    next();
  } catch (error) {
    console.error('verifyRefundableServices error:', error);
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

const fetchMCPStatus = async (
  req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        details: 'ID must be a numeric value'
      });
    }

    const results = await model.fetchMCPStatusById(id);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: 'Package not found',
        details: `No package found with ID ${id}`
      });
    }

    const { package_id, package_name } = results[0];

    const services = results.map((s) => ({
      service_id: s.service_id,
      service_name: s.service_name,
      totals: {
        purchased: s.purchased,
        consumed: s.consumed,
        refunded: s.refunded,
        remaining: s.remaining,
        unpaid: s.unpaid
      },
      is_eligible_for_refund: s.consumed > s.refunded
    }));

    res.status(200).json({ package_id, package_name, services });
  } catch (error) {
    console.error('fetchMCPStatus error:', error);
    next(error);
  }
};

export default {
  viewAllRefundSaleTransactionRecords,
  getServiceTransactionsForRefund,
  processRefundService,
  validateMCPExists,
  verifyRefundableServices: verifyRefundableServices as RequestHandler,
  processFullRefund,
  fetchMCPStatus: fetchMCPStatus as RequestHandler,
};

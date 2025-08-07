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
    //console.log(req.query.member_id)
    const results = await model.getServiceTransactionsForRefund(
      req.query.member_id ? Number(req.query.member_id) : undefined,
      req.query.member_name as string | undefined,
      req.query.receipt_no as string | undefined,
      req.query.start_date_utc as string | undefined,
      req.query.end_date_utc as string | undefined,
      req.query.limit ? Number(req.query.limit) : undefined,
      req.query.offset ? Number(req.query.offset) : undefined,
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getServiceTransactionsForRefund:', error);
    next(error);
  }
};


const processRefundService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Processing refund for service:', req.body);
    const refundResult = await model.processRefundService(req.body);

    res.status(200).json({ message: 'Refund processed successfully', refundTransactionId: refundResult.refundTransactionId });
  } catch (error) {
    console.error('Error in RefundController.processRefund:', error);
    next(error);
  }
};

const getSaleTransactionItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const itemId = Number(req.params.id);
  if (isNaN(itemId)) {
    res.status(400).json({ message: 'Invalid sale_transaction_item_id' });
    return;
  }

  try {
    const item = await model.getSaleTransactionItemById(itemId);
    if (!item) {
      res.status(404).json({ message: 'Sale transaction item not found' });
      return;
    }

    const isFullyRefunded = Number(item.remaining_quantity) <= 0;

    res.status(200).json({
      ...item,
      is_fully_refunded: isFullyRefunded,
      message: isFullyRefunded ? 'This item has been fully refunded.' : undefined,
    });

  } catch (error) {
    console.error('Error in getSaleTransactionItemById:', error);
    next(error);
  }
};

const processRefundMemberVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refundResult = await model.processRefundMemberVoucher(req.body);

    res.status(200).json({ message: 'Refund processed successfully', refundTransactionId: refundResult.refundTransactionId });
  } catch (error) {
    console.error('Error in RefundController.processRefund:', error);
    next(error);
  }
};

////////////////////////////////////////

// Middleware: Ensure the MCP exists
const validateMCPExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mcpId } = req.body;
    const mcp = await model.getMCPById(mcpId);

    if (!mcp) {
      res.status(404).json({ error: 'Member Care Package not found.' });
      return;
    }

    (req as any).mcpData = mcp;
    next();
  } catch (error) {
    console.error('validateMCPExists error:', error);
    next(error);
  }
};

// Updated verifyRefundableServices middleware
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
          service.purchased - service.consumed - service.refunded,
          service.remaining
        )
      }))
      .filter(service => service.refundableQuantity > 0);

    if (refundableServices.length === 0) {
      return res.status(400).json({
        error: 'No refundable services',
        details: 'All services are either unpaid, already consumed, or already refunded'
      });
    }

    const refundableDetails = refundableServices.map(service => ({
      id: service.id, // detail_id from member_care_package_details
      service_name: service.service_name,
      price: service.price,
      discount: service.discount,
      quantity: service.refundableQuantity
    }));

    (req as any).remainingServices = refundableDetails;
    next();
  } catch (error) {
    console.error('verifyRefundableServices error:', error);
    next(error);
  }
};

// Updated processPartialRefund controller
const processPartialRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Incoming refund request:', JSON.stringify(req.body, null, 2));
    const { 
      mcpId, 
      refundedBy, 
      refundRemarks, 
      refundDate, 
      refundItems,
      additionalBalanceRefund = 0
    } = req.body;

    // Validate refundedBy exists and is a number
    if (!refundedBy || typeof refundedBy !== 'number') {
      return res.status(400).json({
        error: 'Valid refundedBy employee ID required',
        details: 'Please provide the employee/user ID performing the refund'
      });
    }

    // Validate additionalBalanceRefund
    if (additionalBalanceRefund < 0) {
      return res.status(400).json({
        error: 'Additional balance refund cannot be negative'
      });
    }

    // Validate refundDate if provided
    let processedRefundDate = new Date();
    if (refundDate) {
      processedRefundDate = new Date(refundDate);
      if (isNaN(processedRefundDate.getTime())) {
        return res.status(400).json({ error: 'Invalid refund date format' });
      }
    }

    const reqWithExtras = req as Request & {
      mcpData: { id: number; member_id: number; balance: number };
      remainingServices: Array<{
        id: number;
        service_name: string;
        quantity: number;
        price: number;
        discount: number;
      }>;
    };

    // Validate refund items
    if (!refundItems || !Array.isArray(refundItems)) {
      return res.status(400).json({ error: 'Invalid refund items format' });
    }

    // Calculate service-based refunds
    const refundDetails = reqWithExtras.remainingServices.map(service => {
      const refundItem = refundItems.find((item: any) => item.detail_id === Number(service.id));
      const refundQuantity = refundItem ? Math.min(refundItem.quantity, service.quantity) : 0;

      return {
        ...service,
        refundQuantity,
        refundAmount: refundQuantity * service.price * service.discount
      };
    }).filter(service => service.refundQuantity > 0);

    const serviceRefundAmount = refundDetails.reduce((sum, item) => sum + item.refundAmount, 0);
    const totalRefundAmount = serviceRefundAmount + Number(additionalBalanceRefund);

    // Check if total refund amount exceeds package balance
    if (totalRefundAmount > reqWithExtras.mcpData.balance) {
      return res.status(400).json({
        error: 'Refund amount exceeds package balance',
        currentBalance: reqWithExtras.mcpData.balance,
        requestedRefund: totalRefundAmount
      });
    }

    // Process the transaction
    const result = await model.processPartialRefundTransaction({
      mcpId,
      memberId: reqWithExtras.mcpData.member_id,
      refundDetails,
      additionalBalanceRefund,
      refundedBy,
      refundRemarks,
      refundDate: processedRefundDate,
      totalRefundAmount
    });

    res.status(201).json({
      message: 'Partial refund processed successfully',
      refundTransactionId: result.refundTransactionId,
      totalRefundAmount: result.totalRefund,
      refundedServices: result.refundedServices,
      additionalBalanceRefund: result.additionalBalanceRefund,
      newPackageBalance: result.newPackageBalance,
      refundDate: processedRefundDate.toISOString(),
      receiptNo: result.receiptNo
    });
  } catch (error) {
    console.error('Partial refund processing error:', error);
    next(error);
  }
};

// Controller: Handle full refund of a Member Care Package
const processFullRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mcpId, refundRemarks, refundDate } = req.body;
    const refundedBy = req.session.user_id;

    if (!refundedBy) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate refundDate if provided
    let processedRefundDate = new Date();
    if (refundDate) {
      processedRefundDate = new Date(refundDate);
      if (isNaN(processedRefundDate.getTime())) {
        return res.status(400).json({ error: 'Invalid refund date format' });
      }
    }

    const reqWithExtras = req as Request & {
      mcpData: { id: number; member_id: number; status: string };
      remainingServices: Array<{
        id: number;
        service_id: number;
        service_name: string;
        quantity: number;
        price: number;
        discount: number;
      }>;
    };

    const result = await model.processFullRefundTransaction({
      mcpId,
      memberId: reqWithExtras.mcpData.member_id,
      remainingServices: reqWithExtras.remainingServices,
      refundedBy: Number(refundedBy),
      refundRemarks,
      refundDate: processedRefundDate
    });

    res.status(201).json({
      message: 'Refund processed successfully',
      refundTransactionId: result.refundTransactionId,
      totalRefundAmount: result.totalRefund,
      refundedServices: result.refundedServices,
      refundDate: processedRefundDate.toISOString(),
      receiptNo: result.receiptNo
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    next(error);
  }
};

const fetchMCPStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const results = await model.fetchMCPStatusById(id);
    if (!results?.length) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const { package_id, package_name, balance, created_at } = results[0];  // Add created_at here
    const hasRefundedService = results.some(s => parseInt(s.refunded) > 0);
    let refundDetails = null;

    if (hasRefundedService) {
      refundDetails = await model.getRefundDetailsForPackage(id);
    }

    const services = results.map((s) => {
      const purchased = parseInt(s.purchased) || 0;
      const consumed = parseInt(s.consumed) || 0;
      const refunded = parseInt(s.refunded) || 0;
      const unpaid = parseInt(s.unpaid) || 0;
      const price = parseFloat(s.discounted_price) || 0;
      const remaining = parseInt(s.remaining) || 0;
      const total = parseInt(s.total_quantity) || 0;

      let refundStatus;
      if (refunded > 0) {
        refundStatus = 'refunded';
      } else if (remaining > 0) {
        refundStatus = 'eligible';
      } else {
        refundStatus = 'ineligible';
      }

      return {
        detail_id: s.detail_id,
        service_id: s.service_id,
        service_name: s.service_name,
        totals: {
          total,
          price,
          purchased,
          consumed,
          refunded,
          remaining,
          unpaid
        },
        is_eligible_for_refund: hasRefundedService ? 'refunded' : refundStatus,
        ...(hasRefundedService && refundDetails && {
          refund_amount: refundDetails.refund_amount,
          refund_date: refundDetails.refund_date
        })
      };
    });

    res.status(200).json({
      package_id,
      package_name,
      balance,
      created_at, 
      services
    });
  } catch (error) {
    next(error);
  }
};

const searchMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        error: 'Invalid search query'
      });
    }

    const results = await model.searchMembers(searchQuery.toString());
    res.status(200).json(results);
  } catch (error) {
    console.error('searchMembers error:', error);
    next(error);
  }
};

const listMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const results = await model.listMembers(Number(page), Number(limit));
    res.status(200).json(results);
  } catch (error) {
    console.error('listMembers error:', error);
    next(error);
  }
};

const getMemberCarePackages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = parseInt(req.params.memberId, 10);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Invalid member ID',
        details: 'Member ID must be a numeric value'
      });
    }

    const packages = await model.getMemberCarePackages(memberId);

    if (!packages || packages.length === 0) {
      return res.status(404).json({
        error: 'No packages found',
        details: `No packages found for member ID ${memberId}`
      });
    }

    res.status(200).json(packages);
  } catch (error) {
    console.error('getMemberPackages error:', error);
    next(error);
  }
};

const searchMemberCarePackages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: searchQuery, memberId } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Invalid search query' });
    }

    const results = await model.searchMemberCarePackages(
      searchQuery.toString(),
      memberId ? parseInt(memberId.toString(), 10) : null
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('searchMemberCarePackages error:', error);
    next(error);
  }
};

const getRefundDate = async (req: Request, res: Response) => {
  try {
    const { mcpId } = req.params;
    const refundDate = await model.getRefundDateByMcpId(mcpId);

    if (!refundDate) {
      return res.status(404).json({
        error: 'Refund record not found for this MCP'
      });
    }

    res.json({
      refund_date: refundDate
    });

  } catch (error) {
    console.error('Error fetching refund date:', error);
    res.status(500).json({
      error: 'Failed to retrieve refund date'
    });
  }
};

const getEligibleMemberVoucherForRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = Number(req.params.memberId);
    const results = await model.getEligibleMemberVoucherForRefund(memberId);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in RefundController.getMemberVoucherByMemberId:', error);
    next(error);
  }
};

const getMemberVoucherById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucherId = Number(req.params.voucherId);
    if (isNaN(voucherId)) {
      return res.status(400).json({ error: 'Invalid voucherId parameter' });
    }

    const voucher = await model.getMemberVoucherById(voucherId);

    if (!voucher) {
      return res.status(404).json({ error: 'Member voucher not found' });
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error('Error in RefundController.getMemberVoucherById:', error);
    next(error);
  }
};


const getAllRefundRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, memberName, refundType, startDate, endDate } = req.query;

    const records = await model.getAllRefundRecords({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      memberName: memberName ? String(memberName) : undefined,
      refundType: refundType ? String(refundType) as 'mcp' | 'mv' | 'service' : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });

    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching refund records:', err);
    next(err);
  }
};

const getRefundRecordDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid refund record ID' });

    const detail = await model.getRefundRecordDetails(id);
    if (!detail) return res.status(404).json({ error: 'Refund record not found' });

    res.status(200).json(detail);
  } catch (err) {
    console.error('Error fetching refund detail:', err);
    next(err);
  }
};


export default {
  viewAllRefundSaleTransactionRecords,
  getServiceTransactionsForRefund,
  processRefundService,
  getSaleTransactionItemById,
  validateMCPExists,
  verifyRefundableServices: verifyRefundableServices as RequestHandler,
  processFullRefund: processFullRefund as RequestHandler,
  processPartialRefund: processPartialRefund as RequestHandler,
  fetchMCPStatus: fetchMCPStatus as RequestHandler,
  searchMembers: searchMembers as RequestHandler,
  getMemberCarePackages: getMemberCarePackages as RequestHandler,
  searchMemberCarePackages: searchMemberCarePackages as RequestHandler,
  getRefundDate: getRefundDate as RequestHandler,
  processRefundMemberVoucher,
  getEligibleMemberVoucherForRefund,
  getMemberVoucherById: getMemberVoucherById as RequestHandler,
  getAllRefundRecords,
  getRefundRecordDetails: getRefundRecordDetails as RequestHandler,
  listMembers: listMembers as RequestHandler
};

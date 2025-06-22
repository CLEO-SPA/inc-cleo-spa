import { Request, Response, NextFunction } from 'express';
import model from '../models/revenueModel.js';

const getMVMonthlyReport = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const data = await model.getMVMonthlyReport(year, month);

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Create array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date, // YYYY-MM-DD format
        cash: "0.00",
        nets: "0.00",
        paynow: "0.00",
        visa: "0.00",
        total: "0.00",
        vip: "0.00",
        package: "0.00",
        foc: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });

    // mapping original data to formatted array
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].cash = incomeItem.cash;
        daysArray[day].nets = incomeItem.nets;
        daysArray[day].paynow = incomeItem.paynow;
        daysArray[day].visa = incomeItem.visa_mastercard;
        // Calculate total income for the day
        let totalForTheDay = (
          parseFloat(incomeItem.cash) +
          parseFloat(incomeItem.nets) +
          parseFloat(incomeItem.paynow) +
          parseFloat(incomeItem.visa_mastercard)
        ).toFixed(2);

        daysArray[day].total = totalForTheDay;
        daysArray[day].package = totalForTheDay;
      }
    });

    // Net sales
    data.netsales.forEach(saleItem => {
      const day = parseInt(saleItem.service_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].vip = saleItem.total_revenue_earned;
        daysArray[day].net_sales = saleItem.total_revenue_earned;
        daysArray[day].foc = (parseFloat(saleItem.total_amount_change) - parseFloat(saleItem.total_revenue_earned)).toFixed(2);
      }
    });

    // Refund
    data.refund.forEach(refundItem => {
      const day = parseInt(refundItem.refund_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].refund = refundItem.total_refund_amount;
      }
    });

    res.json({ success: true, data: daysArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch MV report' });
  }
};

const getMCPMonthlyReport = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const data = await model.getMCPMonthlyReport(year, month);

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Create array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date, // YYYY-MM-DD format
        cash: "0.00",
        nets: "0.00",
        paynow: "0.00",
        visa: "0.00",
        total: "0.00",
        vip: "0.00",
        package: "0.00",
        foc: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });

    // mapping original data to formatted array
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].cash = incomeItem.cash;
        daysArray[day].nets = incomeItem.nets;
        daysArray[day].paynow = incomeItem.paynow;
        daysArray[day].visa = incomeItem.visa_mastercard;
        // Calculate total income for the day
        let totalForTheDay = (
          parseFloat(incomeItem.cash) +
          parseFloat(incomeItem.nets) +
          parseFloat(incomeItem.paynow) +
          parseFloat(incomeItem.visa_mastercard)
        ).toFixed(2);

        daysArray[day].total = totalForTheDay;
        daysArray[day].package = totalForTheDay;
      }
    });

    // Net sales
    data.netsales.forEach(saleItem => {
      const day = parseInt(saleItem.consumption_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].vip = saleItem.total_consumed_amount;
        daysArray[day].net_sales = saleItem.total_consumed_amount;
      }
    });

    // Refund
    data.refund.forEach(refundItem => {
      const day = parseInt(refundItem.refund_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].refund = refundItem.total_refund_amount;
      }
    });

    res.json({ success: true, data: daysArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch MCP report' });
  }
};

const getAdHocMonthlyReport = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const data = await model.getAdHocMonthlyReport(year, month);

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Create array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date, // YYYY-MM-DD format
        cash: "0.00",
        nets: "0.00",
        paynow: "0.00",
        visa: "0.00",
        total: "0.00",
        vip: "0.00",
        package: "0.00",
        foc: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });

    // mapping original data to formatted array
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].cash = incomeItem.cash;
        daysArray[day].nets = incomeItem.nets;
        daysArray[day].paynow = incomeItem.paynow;
        daysArray[day].visa = incomeItem.visa_mastercard;
        // Calculate total income for the day
        let totalForTheDay = (
          parseFloat(incomeItem.cash) +
          parseFloat(incomeItem.nets) +
          parseFloat(incomeItem.paynow) +
          parseFloat(incomeItem.visa_mastercard)
        ).toFixed(2);

        daysArray[day].total = totalForTheDay;
        daysArray[day].net_sales = totalForTheDay;
      }
    });

    // Refund
    data.refund.forEach(refundItem => {
      const day = parseInt(refundItem.refund_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].refund = refundItem.total_refund_amount;
      }
    });

    res.json({ success: true, data: daysArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch AdHoc report' });
  }
};

const getTransactionDateRange = async (req: Request, res: Response) => {
  try {
    const data = await model.getTransactionDateRange();

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch report date range' });
  }
};

export default {
  getMVMonthlyReport,
  getMCPMonthlyReport,
  getAdHocMonthlyReport,
  getTransactionDateRange,
}
import { Request, Response, NextFunction } from 'express';
import model from '../models/revenueModel.js';

const getMVMonthlyReport = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const data = await model.getMVMonthlyReport(year, month);

    // get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // create an array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date,
        income: [] as {
          payment_method_id: number;
          payment_method_name: string;
          amount: string;
        }[],
        total_income: "0.00",
        gst: "0.00",
        vip: "0.00",
        package: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });


    // income
    // mapping original data to formatted day objects
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        const targetDay = daysArray[day];

        if (incomeItem.is_gst) {
          // add to gst
          targetDay.gst = (parseFloat(targetDay.gst) + parseFloat(incomeItem.amount)).toFixed(2);
        } else {
          // add to income array
          targetDay.income.push({
            payment_method_id: incomeItem.payment_method_id,
            payment_method_name: incomeItem.payment_method_name,
            amount: incomeItem.amount
          });

          // update total_income
          targetDay.total_income = (
            parseFloat(targetDay.total_income) + parseFloat(incomeItem.amount)
          ).toFixed(2);

          targetDay.package = targetDay.total_income;
        }
      }
    });

    // net sales
    data.netsales.forEach(saleItem => {
      const day = parseInt(saleItem.service_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].vip = saleItem.total_revenue_earned;
        daysArray[day].net_sales = saleItem.total_revenue_earned;
      }
    });

    // refund
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

    // get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // create an array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date,
        income: [] as {
          payment_method_id: number;
          payment_method_name: string;
          amount: string;
        }[],
        total_income: "0.00",
        gst: "0.00",
        vip: "0.00",
        package: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });

    // income
    // mapping original data to day objects
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        const targetDay = daysArray[day];

        if (incomeItem.is_gst) {
          // add to gst
          targetDay.gst = (parseFloat(targetDay.gst) + parseFloat(incomeItem.amount)).toFixed(2);
        } else {
          // add to income array
          targetDay.income.push({
            payment_method_id: incomeItem.payment_method_id,
            payment_method_name: incomeItem.payment_method_name,
            amount: incomeItem.amount
          });

          // update total_income
          targetDay.total_income = (
            parseFloat(targetDay.total_income) + parseFloat(incomeItem.amount)
          ).toFixed(2);

          targetDay.package = targetDay.total_income;
        }
      }
    });

    // net sales
    data.netsales.forEach(saleItem => {
      const day = parseInt(saleItem.consumption_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        daysArray[day].vip = saleItem.total_consumed_amount;
        daysArray[day].net_sales = saleItem.total_consumed_amount;
      }
    });

    // refund
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

    // get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // create an array of day objects
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${month.toString().padStart(2, '0')}-${day}`;

      return {
        date,
        income: [] as {
          payment_method_id: number;
          payment_method_name: string;
          amount: string;
        }[],
        total_income: "0.00",
        gst: "0.00",
        vip: "0.00",
        package: "0.00",
        net_sales: "0.00",
        refund: "0.00",
      };
    });


    // mapping original data to formatted array
    data.income.forEach(incomeItem => {
      const day = parseInt(incomeItem.payment_date_gmt8.split('-')[2], 10) - 1;
      if (day >= 0 && day < daysInMonth) {
        const targetDay = daysArray[day];

        if (incomeItem.is_gst) {
          // Add to GST total
          targetDay.gst = (parseFloat(targetDay.gst) + parseFloat(incomeItem.amount)).toFixed(2);
        } else {
          // Push to income array
          targetDay.income.push({
            payment_method_id: incomeItem.payment_method_id,
            payment_method_name: incomeItem.payment_method_name,
            amount: incomeItem.amount
          });

          // Update total_income
          targetDay.total_income = (
            parseFloat(targetDay.total_income) + parseFloat(incomeItem.amount)
          ).toFixed(2);

          targetDay.net_sales = targetDay.total_income;
        }
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

const getMVDeferredRevenue = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

    const data = await model.getMVDeferredRevenue();
    const rows = data.result.rows;

    // Get the exact month's row, or fallback to default values
    const targetRow =
      rows.find(row => row.transaction_month === targetMonth) ?? {
        transaction_month: targetMonth,
        income: "0.00",
        net_sale: "0.00",
        refund: "0.00",
        deferred_amount: "0.00",
      };

    // Calculate cumulative deferred_amount for all months BEFORE the target month
    const prevDeferredAmount = rows
      .filter(row => row.transaction_month < targetMonth)
      .reduce((sum, row) => sum + parseFloat(row.deferred_amount), 0);

    const result = {
      ...targetRow,
      previous_total_deferred_amount: prevDeferredAmount.toFixed(2),
    };

    res.json({ success: true, data: result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch deferred MV' });
  }
};

const getMCPDeferredRevenue = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

    const data = await model.getMCPDeferredRevenue();
    const rows = data.result.rows;

    // Get the exact month's row, or fallback to default values
    const targetRow =
      rows.find(row => row.transaction_month === targetMonth) ?? {
        transaction_month: targetMonth,
        income: "0.00",
        net_sale: "0.00",
        refund: "0.00",
        deferred_amount: "0.00",
      };

    // Calculate cumulative deferred_amount for all months BEFORE the target month
    const prevDeferredAmount = rows
      .filter(row => row.transaction_month < targetMonth)
      .reduce((sum, row) => sum + parseFloat(row.deferred_amount), 0);

    const result = {
      ...targetRow,
      previous_total_deferred_amount: prevDeferredAmount.toFixed(2),
    };

    res.json({ success: true, data: result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch deferred MCP' });
  }
};

export default {
  getMVMonthlyReport,
  getMCPMonthlyReport,
  getAdHocMonthlyReport,
  getTransactionDateRange,
  getMVDeferredRevenue,
  getMCPDeferredRevenue,
}
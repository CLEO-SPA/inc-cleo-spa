import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';

const ProductDBSalesHistory = () => {
  const { product_name, date } = useParams();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchDailySalesSummary = async () => {
      try {
        const encodedProductName = encodeURIComponent(product_name);
        const res = await api.get(`/p/sales-db-summary/${encodedProductName}?date=${date}`);

        if (res.data) {
          setSummary(res.data.sales_summary || null);
          setInvoices(res.data.invoices || []);
        } else {
          console.error('Unexpected response structure:', res.data);
          setSummary(null);
        }
      } catch (error) {
        console.error('Error fetching daily sales summary:', error.response?.data || error.message);
        setSummary(null);
      }
    };

    fetchDailySalesSummary();
  }, [product_name, date]);

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
      >
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-4">
        Daily Breakdown of Sales History for "{decodeURIComponent(product_name)}" on {date}
      </h2>

      {/* Daily Sales Summary Table */}
      <h3 className="text-xl font-bold mb-4">Daily Sales Summary</h3>
      {summary ? (
        <table className="w-full border-collapse border mb-6 bg-gray-50 rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="border p-3">Product</th>
              <th className="border p-3">Category</th>
              <th className="border p-3">Gross Sales</th>
              <th className="border p-3">Quantity Sold</th>
              <th className="border p-3">Discount Applied</th>
              <th className="border p-3">Discounted Quantity</th>
              <th className="border p-3">Extra Charge Amount</th>
              <th className="border p-3">Extra Charged Quantity</th>
              <th className="border p-3">Net Sales</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center bg-white">
              <td className="border p-3">{product_name}</td>
              <td className="border p-3">{summary.product_category_name}</td>
              <td className="border p-3 text-green-600 font-semibold">${summary.total_sales.toFixed(2)}</td>
              <td className="border p-3">{summary.total_quantity_sold.toFixed(2)}</td>
              <td className="border p-3 text-red-500 font-semibold">-${summary.total_discounts_applied.toFixed(2)}</td>
              <td className="border p-3">{summary.total_discounted_quantity.toFixed(2)}</td>
              <td className="border p-3 text-yellow-500 font-semibold">
                +${summary.total_extra_charge_amount.toFixed(2)}
              </td>
              <td className="border p-3">{summary.total_extra_charged_quantity.toFixed(2)}</td>
              <td className="border p-3 text-blue-600 font-semibold">${summary.total_net_sales.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600 text-center">Loading daily summary...</p>
      )}

      {/* Invoice List - Enhanced UI */}
      <h3 className="text-xl font-bold mb-4">Invoices for {date}</h3>
      {invoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <div
              key={invoice.invoice_id}
              className="p-5 border rounded-lg bg-white shadow-lg hover:shadow-xl transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-800">Invoice ID: #{invoice.invoice_id}</h4>
              </div>

              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Manual Invoice No:</span> {invoice.manual_invoice_no}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Time:</span> {invoice.invoice_created_at}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Customer:</span> {invoice.member_name || 'N/A'}
                </p>
                <p className="text-green-600 font-semibold">
                  <span className="text-gray-700 font-semibold">Amount:</span> ${invoice.item_gross_sales.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Quantity:</span> {invoice.item_quantity.toFixed(2) || '0.00'}
                </p>
                <p className="text-red-500 font-semibold">
                  <span className="text-gray-700 font-semibold">Discount Applied:</span> -$
                  {invoice.item_discount.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Discounted Quantity:</span>{' '}
                  {invoice.item_discounted_qty.toFixed(2) || '0.00'}
                </p>
                <p className="text-yellow-500 font-semibold">
                  <span className="text-gray-700 font-semibold">Extra Charge Amount:</span> +$
                  {invoice.item_extra_charge.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Extra Charged Quantity:</span>{' '}
                  {invoice.item_extra_charged_qty.toFixed(2) || '0.00'}
                </p>
                <p className="text-blue-600 font-semibold">
                  <span className="text-gray-700 font-semibold">Net Amount:</span> ${invoice.item_net_sales.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No invoices available for this date.</p>
      )}
    </div>
  );
};

export default ProductDBSalesHistory;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';

const ServiceMonthlySalesHistory = () => {
  const { service_name } = useParams();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(service_name || '');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState('');
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Fetch available services
  const fetchServices = async () => {
    try {
      const res = await api.get(`/service/getAllSerO`);
      setServices(res.data || []);
    } catch (error) {
      console.error('Error fetching services:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch Monthly Sales Summary
  const fetchSalesSummary = async () => {
    if (!selectedService) return;
    try {
      const encodedServiceName = encodeURIComponent(selectedService);
      const formattedMonth = month.toString().padStart(2, '0');
      const res = await api.get(`/service/sales-summary/${encodedServiceName}?month=${formattedMonth}&year=${year}`);

      if (res.data && res.data.sales_summary) {
        setMonthlySummary(res.data);
        processDailySales(res.data.detailed_sales);
        setAvailableYears(res.data.available_years || []);
      } else {
        console.error('Unexpected response structure:', res.data);
        setMonthlySummary(null);
      }
    } catch (error) {
      console.error('Error fetching sales summary:', error.response?.data || error.message);
      setMonthlySummary(null);
    }
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [month, year]);

  useEffect(() => {
    const currentDate = new Date();
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth() + 1);
    fetchSalesSummary();
  }, [selectedService]);

  // Process Daily Sales Data from detailed_sales
  const processDailySales = (salesData) => {
    const groupedSales = salesData.reduce((acc, sale) => {
      // const dateKey = new Date(sale.sales_date).toISOString().split('T')[0];
      const dateKey = sale.sales_date.split(' ')[0];

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          gross_sales: 0,
          quantity: 0,
          discounts_applied: 0,
          discounted_quantity: 0,
          extra_charge_amount: 0,
          extra_charged_quantity: 0,
          net_sales: 0,
        };
      }

      acc[dateKey].gross_sales += sale.gross_sales;
      acc[dateKey].quantity += sale.quantity;
      acc[dateKey].discounts_applied += sale.discounts_applied;
      acc[dateKey].discounted_quantity += sale.discounted_quantity;
      acc[dateKey].extra_charge_amount += sale.extra_charge_amount;
      acc[dateKey].extra_charged_quantity += sale.extra_charged_quantity;
      acc[dateKey].net_sales += sale.net_sales;

      return acc;
    }, {});

    setDailySales(Object.values(groupedSales)); // Convert object to array for rendering
  };

  // Filter sales by selected date (exact match)
  useEffect(() => {
    if (selectedDate) {
      setFilteredSales(dailySales.filter((sale) => sale.date === selectedDate));
    } else {
      setFilteredSales(dailySales); // Show all if no date is selected
    }
  }, [selectedDate, dailySales]);

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Service Monthly Sales History</h2>

      {/* Filter Section */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Month:</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-2 border rounded-md">
            {[...Array(12).keys()].map((m) => (
              <option key={m + 1} value={m + 1}>
                {new Date(0, m).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="font-medium">Year:</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="p-2 border rounded-md">
            <option key={new Date().getFullYear()} value={new Date().getFullYear()}>
              {new Date().getFullYear()}
            </option>
            {availableYears
              .filter((y) => y !== new Date().getFullYear()) // Remove duplicate if exists
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
        </div>

        {/* Exact Date Search */}
        <div className="flex items-center space-x-2">
          <label className="font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate ? selectedDate.split('/').reverse().join('-') : ''}
            onChange={(e) => {
              const selected = e.target.value;

              if (!selected) {
                // Reset when date is cleared
                setSelectedDate('');
                setFilteredSales(dailySales);
              } else {
                const [year, month, day] = selected.split('-');
                const formattedDate = `${day}/${month}/${year}`;
                setSelectedDate(formattedDate);

                // Apply filtering based on selected date
                setFilteredSales(dailySales.filter((sale) => sale.date === formattedDate));
              }
            }}
            className="p-2 border rounded-md"
          />
        </div>

        {/* Service Selection Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="font-medium">Select Service:</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="">Select Service</option>
            {services.map((service) => (
              <option key={service.service_id} value={service.service_name}>
                {service.service_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <h3 className="text-xl font-bold mb-4">Monthly Summary</h3>
      {monthlySummary ? (
        <table className="w-full border-collapse border mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Service</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Month/Year</th>
              <th className="border p-2">Total Gross Sales</th>
              <th className="border p-2">Total Quantity Sold</th>
              <th className="border p-2">Total Discount Applied</th>
              <th className="border p-2">Total Discounted Quantity</th>
              <th className="border p-2">Total Extra Charge Amount</th>
              <th className="border p-2">Total Extra Charged Quantity</th>
              <th className="border p-2">Total Net Sales</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border p-2">{selectedService || 'N/A'}</td>
              <td className="border p-2">{monthlySummary?.detailed_sales[0]?.service_category_name || 'N/A'}</td>
              <td className="border p-2">{`${month}/${year}`}</td>
              <td className="border p-2 text-green-600 font-semibold">
                ${monthlySummary.sales_summary.total_sales.toFixed(2)}
              </td>
              <td className="border p-2">{monthlySummary.sales_summary.total_quantity_sold.toFixed(2)}</td>
              <td className="border p-2 text-red-500 font-semibold">
                -${monthlySummary.sales_summary.total_discounts_applied.toFixed(2)}
              </td>
              <td className="border p-2">{monthlySummary.sales_summary.total_discounted_quantity.toFixed(2)}</td>
              <td className="border p-2 text-yellow-500 font-semibold">
                +${monthlySummary.sales_summary.total_extra_charge_amount.toFixed(2)}
              </td>
              <td className="border p-2">{monthlySummary.sales_summary.total_extra_charged_quantity.toFixed(2)}</td>
              <td className="border p-2 text-blue-600 font-semibold">
                ${monthlySummary.sales_summary.total_net_sales.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>Loading sales summary...</p>
      )}

      {/* Daily Breakdown Table */}
      <h3 className="text-xl font-bold mb-4">Daily Breakdown</h3>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Gross Sales</th>
            <th className="border p-2">Quantity Sold</th>
            <th className="border p-2">Discount Applied</th>
            <th className="border p-2">Discounted Quantity</th>
            <th className="border p-2">Extra Charge Amount</th>
            <th className="border p-2">Extra Charge Quantity</th>
            <th className="border p-2">Net Sales</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.length > 0 ? (
            filteredSales.map((sale, index) => (
              <tr key={index} className="text-center">
                <td className="border p-2">{sale.date}</td>
                <td className="border p-2 text-green-600 font-semibold">${sale.gross_sales.toFixed(2)}</td>
                <td className="border p-2">{sale.quantity.toFixed(2)}</td>
                <td className="border p-2 text-red-500 font-semibold">-${sale.discounts_applied.toFixed(2)}</td>
                <td className="border p-2">{sale.discounted_quantity.toFixed(2)}</td>
                <td className="border p-2 text-yellow-500 font-semibold">+${sale.extra_charge_amount.toFixed(2)}</td>
                <td className="border p-2">{sale.extra_charged_quantity.toFixed(2)}</td>
                <td className="border p-2 text-blue-600 font-semibold">${sale.net_sales.toFixed(2)}</td>
                <td className="border p-2">
                  <button
                    onClick={() => {
                      // Convert DD/MM/YYYY to YYYY-MM-DD
                      const [day, month, year] = sale.date.split('/');
                      const formattedDate = `${year}-${month}-${day}`;

                      navigate(`/sh/db/${encodeURIComponent(selectedService)}/${formattedDate}`);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    View Breakdown
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="border p-2 text-center">
                No sales data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceMonthlySalesHistory;

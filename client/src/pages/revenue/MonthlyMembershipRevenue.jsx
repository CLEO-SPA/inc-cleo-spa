import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MonthlyMembershipRevenue = () => {
  const navigate = useNavigate();

  // State for selected month and year
  const [selectedMonth, setSelectedMonth] = useState("05"); // Default to May
  const [selectedYear, setSelectedYear] = useState("2024"); // Default to 2024
  const [dateRange, setDateRange] = useState(null); // State to store the date range from the API
  const [validSelectedMonth, setValidSelectedMonth] = useState("05"); // State to track valid selected month
  const [validSelectedYear, setValidSelectedYear] = useState("2024"); // State to track valid selected year
  const [revenueData, setRevenueData] = useState(null); // State to store fetched revenue data
  const [loading, setLoading] = useState(false); // State to track loading state

  // Fetch the date range from the API when the component mounts
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/iv/ma/range");
        const data = await response.json();
        setDateRange(data[0]); // Assuming the API returns an array with a single object
      } catch (error) {
        console.error("Error fetching date range:", error);
      }
    };

    fetchDateRange();
  }, []);

  // Function to handle month change
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Function to handle year change
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Function to handle "View breakdown" button click
  const handleViewBreakdown = (day) => {
    // Format the date as dd-mm-yyyy
    const formattedDate = `${day.toString().padStart(2, '0')}-${selectedMonth}-${selectedYear}`;

    // Store the formattedDate in localStorage
    localStorage.setItem('formattedDate', formattedDate);

    // Navigate to the revenue details page
    navigate(`/da/ma`);
  };
  
  // Function to handle "Get Details" button click
  const handleGetDetails = async () => {
    if (!dateRange) return;

    // Create Date objects for the selected month and year (ignoring the day)
    const selectedDate = new Date(`${selectedYear}-${selectedMonth}-01`);
    const earliestDate = new Date(dateRange.earliest_invoice_created_at);
    const latestDate = new Date(dateRange.latest_invoice_created_at);

    // Extract year and month from the dates
    const selectedYearMonth = selectedDate.getFullYear() * 100 + selectedDate.getMonth(); // e.g., 202405 for May 2024
    const earliestYearMonth = earliestDate.getFullYear() * 100 + earliestDate.getMonth(); // e.g., 202501 for January 2025
    const latestYearMonth = latestDate.getFullYear() * 100 + latestDate.getMonth(); // e.g., 202501 for January 2025

    // Compare only the year and month
    if (selectedYearMonth >= earliestYearMonth && selectedYearMonth <= latestYearMonth) {
      setLoading(true); // Start loading
      setValidSelectedMonth(selectedMonth);
      setValidSelectedYear(selectedYear);

      try {
        // Fetch revenue data from the API
        const response = await fetch(`http://localhost:5000/api/iv/ma/m&y/${selectedMonth}/${selectedYear}/grouped`);

        if (!response.ok) {
          throw new Error("Failed to fetch revenue data");
        }

        const data = await response.json();
        setRevenueData(data); // Update revenue data state
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        alert("Failed to fetch revenue data. Please try again.");
      } finally {
        setLoading(false); // Stop loading
      }
    } else {
      alert(`You can select from ${earliestDate.toLocaleString('default', { month: 'long' })} ${earliestDate.getFullYear()} to ${latestDate.toLocaleString('default', { month: 'long' })} ${latestDate.getFullYear()}`);
    }
  };

  // Get the month name from the valid selected month value
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[parseInt(validSelectedMonth) - 1];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Month and Year Selection */}
      <div className="flex justify-center gap-4 mb-6">
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          {monthNames.map((month, index) => (
            <option key={index + 1} value={(index + 1).toString().padStart(2, '0')}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          {dateRange && (
            Array.from(
              { length: new Date(dateRange.latest_invoice_created_at).getFullYear() - new Date(dateRange.earliest_invoice_created_at).getFullYear() + 1 },
              (_, i) => new Date(dateRange.earliest_invoice_created_at).getFullYear() + i
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))
          )}
        </select>
        <button
          onClick={handleGetDetails}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading} // Disable button while loading
        >
          {loading ? "Loading..." : "Get Details"}
        </button>
      </div>

      {/* Report Title */}
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Monthly Membership Revenue Report - {monthName} {validSelectedYear}
      </h1>

      {/* Revenue Table or Placeholder */}
      {revenueData ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Day</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Cash</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Credit Card</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">PayNow</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Nets</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Total</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">VIP</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Member Care Package</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Net Sales</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Refund</th>
                <th className="px-4 py-2 border border-gray-200 text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.map((data, index) => {
                // Check if any value in the row is not 0.00
                const hasNonZeroValue = 
                  data.cash !== 0.00 ||
                  data.card !== 0.00 ||
                  data.paynow !== 0.00 ||
                  data.nets !== 0.00 ||
                  data.total !== 0.00 ||
                  data.vip !== 0.00 ||
                  data.memberCare !== 0.00 ||
                  data.netSales !== 0.00 ||
                  data.refund !== 0.00;

                return (
                  <tr key={index} className={`hover:bg-gray-50 ${hasNonZeroValue ? 'bg-green-100' : ''}`}>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.day}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.cash.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.card.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.paynow.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.nets.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.total.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.vip.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.memberCare.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.netSales.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center text-gray-700">{data.refund.toFixed(2)}</td>
                    <td className="px-4 py-2 border border-gray-200 text-center">
                      <button
                        onClick={() => handleViewBreakdown(data.day)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        View breakdown
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          Please select a valid Month and Year to view the revenue report.
        </div>
      )}
    </div>
  );
};

export default MonthlyMembershipRevenue;
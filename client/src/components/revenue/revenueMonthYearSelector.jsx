// --- File: MonthYearSelector.jsx ---
import React from 'react';

function RevenueMonthYearSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onGetReport,
  loading = false,
  earliestDate = null,
  buttonText = "Get Report",
  buttonClassName = "bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-600",
  containerClassName = "flex items-center space-x-4 mb-6"
}) {
  // Default months array
  const getMonths = () => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateYears = () => {
    if (!earliestDate) {
      // Default range if no earliest date provided
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = currentYear - 5; y <= currentYear + 1; y++) {
        years.push(y.toString());
      }
      return years;
    }
    
    const years = [];
    const start = earliestDate.getFullYear();
    const end = new Date().getFullYear() + 1;
    for (let y = start; y <= end; y++) {
      years.push(y.toString());
    }
    return years;
  };

  const getAvailableMonths = () => {
    const months = getMonths();
    
    if (!earliestDate) return months;
    
    const selectedYearNum = parseInt(selectedYear);
    const earliestYear = earliestDate.getFullYear();
    const earliestMonth = earliestDate.getMonth();
    
    if (selectedYearNum > earliestYear) return months;
    if (selectedYearNum === earliestYear) return months.slice(earliestMonth);
    return [];
  };

  return (
    <div className={containerClassName}>
      <select 
        value={selectedMonth} 
        onChange={(e) => onMonthChange(e.target.value)} 
        className="border border-gray-300 rounded px-3 py-2"
      >
        {getAvailableMonths().map(month => (
          <option key={month} value={month}>{month}</option>
        ))}
      </select>
      
      <select 
        value={selectedYear} 
        onChange={(e) => onYearChange(e.target.value)} 
        className="border border-gray-300 rounded px-3 py-2"
      >
        {generateYears().map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      
      <button 
        onClick={onGetReport} 
        className={buttonClassName}
        disabled={loading}
      >
        {loading ? 'Loading...' : buttonText}
      </button>
    </div>
  );
}

export default RevenueMonthYearSelector;
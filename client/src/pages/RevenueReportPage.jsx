import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Download } from 'lucide-react';


function RevenueReportPage() {
  // Default to current month and year dynamically
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Your original sample data (unchanged)
  const reportData = [
    { day: 1, cash: '', visa: '', payment: '1388.00', nets: '', total: '1388.00', foc: '500.00', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '1280.00' },
    { day: 2, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1280.00' },
    { day: 3, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1280.00' },
    { day: 4, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '1172.00' },
    { day: 5, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1172.00' },
    { day: 6, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1172.00' },
    { day: 7, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '25.00', package: '', netSales: '25.00', deferredRevenue: '1147.00' },
    { day: 8, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1147.00' },
    { day: 9, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '1039.00' },
    { day: 10, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1039.00' },
    { day: 11, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1039.00' },
    { day: 12, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '1039.00' },
    { day: 13, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '25.00', package: '', netSales: '25.00', deferredRevenue: '1014.00' },
    { day: 14, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '906.00' },
    { day: 15, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '906.00' },
    { day: 16, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '798.00' },
    { day: 17, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '798.00' },
    { day: 18, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '798.00' },
    { day: 19, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '798.00' },
    { day: 20, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '690.00' },
    { day: 21, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '690.00' },
    { day: 22, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '690.00' },
    { day: 23, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '108.00', package: '', netSales: '108.00', deferredRevenue: '582.00' },
    { day: 24, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '582.00' },
    { day: 25, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '582.00' },
    { day: 26, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '552.00' },
    { day: 27, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '558.00' },
    { day: 28, cash: '', visa: '', payment: '', nets: '', total: '', foc: '', vip: '', package: '', netSales: '', deferredRevenue: '559.00' },
  ];

  // Helper to parse float safely and fallback to 0 for empty strings
  const parseFloatSafe = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Calculate totals dynamically
  const totals = reportData.reduce(
    (acc, row) => {
      acc.payment += parseFloatSafe(row.payment);
      acc.total += parseFloatSafe(row.total);
      acc.foc += parseFloatSafe(row.foc);
      acc.vip += parseFloatSafe(row.vip);
      acc.netSales += parseFloatSafe(row.netSales);
      acc.deferredRevenue = parseFloatSafe(row.deferredRevenue); // last value
      return acc;
    },
    { payment: 0, total: 0, foc: 0, vip: 0, netSales: 0, deferredRevenue: 0 }
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (2020 + i).toString());

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleGetReport = () => {
    // In your case, just a placeholder to log
    console.log(`Getting report for ${selectedMonth} ${selectedYear}`);
  };

  // Format number with 2 decimals or show empty string
  const formatAmount = (val) => (val ? parseFloatSafe(val).toFixed(2) : '');

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Revenue Report</h2>
                <button
                  onClick={handleGetReport}
                  className="bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-200 mr-2" 
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <button
                  onClick={handleGetReport}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Get Report
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Revenue Amount For {selectedMonth}, {selectedYear}</span>
                  <span className="text-2xl font-bold">{totals.netSales.toFixed(2)} $</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">Day</th>
                      <th className="border border-gray-300 px-4 py-2">Cash</th>
                      <th className="border border-gray-300 px-4 py-2">Visa</th>
                      <th className="border border-gray-300 px-4 py-2">Payment</th>
                      <th className="border border-gray-300 px-4 py-2">Nets</th>
                      <th className="border border-gray-300 px-4 py-2">Total</th>
                      <th className="border border-gray-300 px-4 py-2">FOC</th>
                      <th className="border border-gray-300 px-4 py-2">VIP</th>
                      <th className="border border-gray-300 px-4 py-2">Package</th>
                      <th className="border border-gray-300 px-4 py-2">Net Sales</th>
                      <th className="border border-gray-300 px-4 py-2">Deferred Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.day} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-center">{row.day}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{row.cash}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{row.visa}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.payment)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{row.nets}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.total)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.foc)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.vip)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{row.package}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.netSales)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.deferredRevenue)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-semibold">
                      <td className="border border-gray-300 px-4 py-2 text-center">Total</td>
                      <td className="border border-gray-300 px-4 py-2 text-center"></td>
                      <td className="border border-gray-300 px-4 py-2 text-center"></td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.payment.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center"></td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.total.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.foc.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.vip.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center"></td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.netSales.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{totals.deferredRevenue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default RevenueReportPage;

// --- File: RevenueReportPage.jsx ---
import React, { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Download } from 'lucide-react';
import { useRevenueReportStore } from '@/stores/revenue/revenueStore';

function parseFloatSafe(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

function RevenueReportPage() {
  const {
    earliestDate,
    reportData,
    selectedMonth,
    selectedYear,
    loading,
    error,
    setMonth,
    setYear,
    fetchEarliestDate,
    fetchRevenueData,
    getMonths,
    setReportData,
    mvData,
    mcpData,
    adhocData,
    combinedData,
    totals,
  } = useRevenueReportStore();

  const [tab, setTab] = useState('combined');

  useEffect(() => {
    fetchEarliestDate();
  }, []);

  useEffect(() => {
    if (earliestDate) {
      fetchRevenueData();
    }
  }, [earliestDate]);

  useEffect(() => {
    switch (tab) {
      case 'mv': setReportData(mvData); break;
      case 'mcp': setReportData(mcpData); break;
      case 'adhoc': setReportData(adhocData); break;
      default: setReportData(combinedData); break;
    }
  }, [tab, mvData, mcpData, adhocData, combinedData]);

  const months = getMonths();

  const currentTotals = useMemo(() => {
    return totals[tab] || {};
  }, [totals, tab]);

  const generateYears = () => {
    if (!earliestDate) return [];
    const years = [];
    const start = earliestDate.getFullYear();
    const end = new Date().getFullYear() + 1;
    for (let y = start; y <= end; y++) years.push(y.toString());
    return years;
  };

  const getAvailableMonths = () => {
    if (!earliestDate) return months;
    const selectedYearNum = parseInt(selectedYear);
    const earliestYear = earliestDate.getFullYear();
    const earliestMonth = earliestDate.getMonth();
    if (selectedYearNum > earliestYear) return months;
    if (selectedYearNum === earliestYear) return months.slice(earliestMonth);
    return [];
  };

  const handleGetReport = () => {
    fetchRevenueData();
  };

  const formatAmount = (val) => (val && val !== '0.00' ? parseFloatSafe(val).toFixed(2) : '');

  const tabOptions = [
    { key: 'combined', label: 'Combined' },
    { key: 'mv', label: 'MV' },
    { key: 'mcp', label: 'MCP' },
    { key: 'adhoc', label: 'Ad Hoc' }
  ];

  const getTabClasses = (tabKey, index) => {
    const isActive = tab === tabKey;
    const isFirst = index === 0;
    const isLast = index === tabOptions.length - 1;

    let classes = "inline-block w-full p-4 transition-all duration-200";

    if (isActive) {
      classes += " text-white bg-black border-r border-gray-200";
    } else {
      classes += " bg-white border-r border-gray-200 hover:text-gray-700 hover:bg-gray-50";
    }

    if (isFirst) {
      classes += " rounded-s-lg";
    }
    if (isLast) {
      classes += " rounded-e-lg border-s-0";
    }

    return classes;
  };

  if (loading && !earliestDate) {
    return <div className="p-6 text-center">Loading date restrictions...</div>;
  }

  if (error && !earliestDate) {
    return <div className="p-6 text-center text-red-500">Error loading date: {error}</div>;
  }

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
                <button onClick={handleGetReport} className="bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-200">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <select value={selectedMonth} onChange={e => setMonth(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
                  {getAvailableMonths().map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select value={selectedYear} onChange={e => setYear(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
                  {generateYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button onClick={handleGetReport} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-600" disabled={loading}>
                  {loading ? 'Loading...' : 'Get Report'}
                </button>
              </div>

              {/* Enhanced Tab Navigation */}
              <div className="mb-6">
                {/* Mobile dropdown */}
                <div className="sm:hidden">
                  <label htmlFor="tabs" className="sr-only">Select report type</label>
                  <select
                    id="tabs"
                    value={tab}
                    onChange={(e) => setTab(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {tabOptions.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Desktop tabs */}
                {/* Desktop tabs */}
                {/* Desktop tabs */}
                <div className="hidden sm:flex">
                  <ul className="inline-flex text-sm font-medium text-black rounded-lg shadow-sm">
                    {tabOptions.map(({ key, label }, index) => (
                      <li key={key} className="focus-within:z-10">
                        <button
                          onClick={() => setTab(key)}
                          className={getTabClasses(key, index)}
                          aria-current={tab === key ? "page" : undefined}
                        >
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  Error loading revenue data: {error}
                </div>
              )}
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Revenue Amount For {selectedMonth}, {selectedYear}</span>
                  <span className="text-2xl font-bold">{((currentTotals.netSales || 0) - (currentTotals.refund || 0)).toFixed(2)} $</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-32">Loading revenue data...</div>
                ) : (
                  <table className="min-w-full border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        {['Day', 'Cash', 'Visa', 'PayNow', 'Nets', 'Total', 'FOC', 'VIP', 'Package', 'Net Sales', 'Refund'].map(header => (
                          <th key={header} className="border border-gray-300 px-4 py-2">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.length > 0 ? (
                        <>
                          {reportData.map(row => (
                            <tr key={row.day} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-center">{row.day}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.cash)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.visa)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.payment)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.nets)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.total)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.foc)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.vip)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.package)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.netSales)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.refund)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-200 font-semibold">
                            <td className="border border-gray-300 px-4 py-2 text-center">Total</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.cash || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.visa || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.payment || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.nets || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.total || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.foc || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.vip || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.package || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.netSales || 0).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.refund || 0).toFixed(2)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="11" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            No data available. Please select a month and year and click "Get Report".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default RevenueReportPage;
// --- File: RevenueReportPage.jsx ---
import React, { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Download, DollarSign, Tickets, Package, Wand } from 'lucide-react';
import { useRevenueReportStore } from '@/stores/revenue/revenueStore';
import MonthYearSelector from '@/components/revenue/revenueMonthYearSelector';
import * as XLSX from 'xlsx';

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
    resultMonth,
    resultYear,
    fetchEarliestDate,
    fetchRevenueData,
    setReportData,
    mvData,
    mcpData,
    adhocData,
    combinedData,
    totals,
  } = useRevenueReportStore();

  const [tab, setTab] = useState('combined');
  const [hoveredRow, setHoveredRow] = useState(null);

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

  const currentTotals = useMemo(() => {
    return totals[tab] || {};
  }, [totals, tab]);

  const handleGetReport = () => {
    fetchRevenueData();
  };

  const formatAmount = (val) => (val && val !== '0.00' ? parseFloatSafe(val).toFixed(2) : '');

  const handleDownloadExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data available to download. Please generate a report first.');
      return;
    }

    // Get current date for download timestamp
    const downloadDate = new Date();
    const downloadDateStr = downloadDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Create title based on tab type
    const tabLabels = {
      combined: 'Combined',
      mv: 'MV',
      mcp: 'MCP',
      adhoc: 'Ad Hoc'
    };

    const title = `${tabLabels[tab]} Monthly Revenue Report of ${resultMonth} ${resultYear}`;
    const subtitle = `Downloaded at ${downloadDateStr}`;

    // Prepare data for Excel
    const excelData = [
      [title], // Title row
      [subtitle], // Subtitle row
      [], // Empty row
      ['Day', 'Cash', 'Visa', 'PayNow', 'Nets', 'Total', 'FOC', 'VIP', 'Package', 'Net Sales', 'Refund'], // Header row
      ...reportData.map(row => [
        row.day,
        parseFloatSafe(row.cash).toFixed(2),
        parseFloatSafe(row.visa).toFixed(2),
        parseFloatSafe(row.payment).toFixed(2),
        parseFloatSafe(row.nets).toFixed(2),
        parseFloatSafe(row.total).toFixed(2),
        parseFloatSafe(row.foc).toFixed(2),
        parseFloatSafe(row.vip).toFixed(2),
        parseFloatSafe(row.package).toFixed(2),
        parseFloatSafe(row.netSales).toFixed(2),
        parseFloatSafe(row.refund).toFixed(2)
      ]),
      // Total row
      [
        'Total',
        (currentTotals.cash || 0).toFixed(2),
        (currentTotals.visa || 0).toFixed(2),
        (currentTotals.payment || 0).toFixed(2),
        (currentTotals.nets || 0).toFixed(2),
        (currentTotals.total || 0).toFixed(2),
        (currentTotals.foc || 0).toFixed(2),
        (currentTotals.vip || 0).toFixed(2),
        (currentTotals.package || 0).toFixed(2),
        (currentTotals.netSales || 0).toFixed(2),
        (currentTotals.refund || 0).toFixed(2)
      ],
      [], // Empty row
      [`Total Revenue Amount: ${((currentTotals.netSales || 0) - (currentTotals.refund || 0)).toFixed(2)} $`]
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 },  // Day
      { wch: 10 }, // Cash
      { wch: 10 }, // Visa
      { wch: 10 }, // PayNow
      { wch: 10 }, // Nets
      { wch: 10 }, // Total
      { wch: 10 }, // FOC
      { wch: 10 }, // VIP
      { wch: 10 }, // Package
      { wch: 12 }, // Net Sales
      { wch: 10 }  // Refund
    ];
    ws['!cols'] = colWidths;

    // Style the title and subtitle rows
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };
    }
    if (ws['A2']) {
      ws['A2'].s = {
        font: { italic: true, sz: 10 },
        alignment: { horizontal: 'center' }
      };
    }

    // Merge cells for title and subtitle
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Subtitle row
      { s: { r: excelData.length - 1, c: 0 }, e: { r: excelData.length - 1, c: 10 } } // Total revenue row
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');

    // Generate filename
    const timestamp = downloadDate.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `${tabLabels[tab]}_Revenue_Report_${resultMonth}_${resultYear}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const tabOptions = [
    { key: 'combined', label: 'Combined', icon: DollarSign },
    { key: 'mv', label: 'MV', icon: Tickets },
    { key: 'mcp', label: 'MCP', icon: Package },
    { key: 'adhoc', label: 'Ad Hoc', icon: Wand }
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
                <h2 className="text-2xl font-bold">Revenue Report</h2>
                <button
                  onClick={handleDownloadExcel}
                  className="bg-green-600 text-white p-3 rounded hover:bg-green-700 transition-colors"
                  disabled={!reportData || reportData.length === 0}
                  title="Download Excel Report"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Using the new MonthYearSelector component */}
              <MonthYearSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setMonth}
                onYearChange={setYear}
                onGetReport={handleGetReport}
                loading={loading}
                earliestDate={earliestDate}
                buttonText="Get Report"
                buttonClassName="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-600"
                containerClassName="flex items-center space-x-4 mb-6"
              />

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
                <div className="hidden sm:flex">
                  <ul className="inline-flex text-sm font-medium text-black rounded-lg shadow-sm">
                    {tabOptions.map(({ key, label, icon: Icon }, index) => (
                      <li key={key} className="focus-within:z-10">
                        <button
                          onClick={() => setTab(key)}
                          className={`inline-flex items-center ${getTabClasses(key, index)}`}
                          aria-current={tab === key ? "page" : undefined}
                        >
                          <Icon className="w-4 h-4 mr-2" />
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
                  <span className="font-medium">Total Revenue Amount For {resultMonth}, {resultYear}</span>
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
                        {['Day', 'Cash', 'Visa', 'PayNow', 'Nets', 'Total', 'VIP', 'Package', 'Net Sales', 'Refund'].map(header => (
                          <th key={header} className="border border-gray-300 px-4 py-2">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.length > 0 ? (
                        <>
                          {reportData.map((row, index) => (
                            <tr key={row.day} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-center">{row.day}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.cash)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.visa)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.payment)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.nets)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.total)}</td>
                              {/* <td className="border border-gray-300 px-4 py-2 text-center">{formatAmount(row.foc)}</td> */}
                              <td
                                className="border border-gray-300 px-4 py-2 text-center relative"
                                onMouseEnter={() => row.vip !== 0 && row.foc !== 0 && setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                              >
                                <span className={hoveredRow === index ? 'text-blue-600' : ''}>
                                  {formatAmount(row.vip)}
                                </span>
                                {hoveredRow === index && row.vip !== 0 && (
                                  <div className="absolute z-10 bg-gray-100 p-2 border border-gray-300 rounded shadow-lg whitespace-nowrap top-full left-1/2 transform -translate-x-1/2">
                                    {(row.foc + row.vip).toFixed(2)} - FOC {row.foc.toFixed(2)} = {formatAmount(row.vip)}
                                  </div>
                                )}
                              </td>
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
                            {/* <td className="border border-gray-300 px-4 py-2 text-center">{(currentTotals.foc || 0).toFixed(2)}</td> */}
                            <td
                                className="border border-gray-300 px-4 py-2 text-center relative"
                                onMouseEnter={() => currentTotals.vip !== 0 && currentTotals.foc !== 0 && setHoveredRow("vip")}
                                onMouseLeave={() => setHoveredRow(null)}
                              >
                                <span className={hoveredRow === "vip" ? 'text-blue-600' : ''}>
                                  {(currentTotals.vip || 0).toFixed(2)}
                                </span>
                                {hoveredRow === "vip" && currentTotals.vip !== 0 && (
                                  <div className="absolute z-10 bg-gray-100 p-2 border border-gray-300 rounded shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2">
                                    {(currentTotals.foc + currentTotals.vip).toFixed(2)} - FOC {currentTotals.foc.toFixed(2)} = {currentTotals.vip.toFixed(2)}
                                  </div>
                                )}
                              </td>
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
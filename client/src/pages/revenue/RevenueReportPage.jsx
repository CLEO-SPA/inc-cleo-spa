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
    // Add payment methods from store
    paymentMethods,
    paymentMethodsLoading,
    paymentMethodsError,
    fetchPaymentMethods,
  } = useRevenueReportStore();

  // Fixed columns that come after payment methods
  const fixedColumns = ['Total Income', 'GST', 'Total with GST', 'VIP', 'Package', 'Net Sales', 'Refund'];

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

  const currentTotals = useMemo(() => {
    const totalsData = totals[tab] || {};
    return totalsData;
  }, [totals, tab]);

  // Helper function to get the correct property name for payment methods
  const getPaymentMethodKey = (methodName) => {
    const lowerMethod = methodName.toLowerCase();
    return lowerMethod;
  };

  // Helper function to get total value for a payment method
  const getTotalValue = (methodName) => {
    const key = getPaymentMethodKey(methodName);
    return currentTotals[key] || 0;
  };

  const handleGetReport = () => {
    fetchPaymentMethods();
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

    // Create dynamic headers array
    const headers = [
      'Day',
      ...paymentMethods.map(method => method.payment_method_name),
      ...fixedColumns
    ];

    // Prepare data for Excel
    const excelData = [
      [title], // Title row
      [subtitle], // Subtitle row
      [], // Empty row
      headers, // Dynamic header row
      ...reportData.map(row => [
        row.day,
        // Dynamic payment method columns
        ...paymentMethods.map(method => {
          const key = getPaymentMethodKey(method.payment_method_name);
          return parseFloatSafe(row[key]).toFixed(2);
        }),
        // Fixed columns
        parseFloatSafe(row.total).toFixed(2),
        parseFloatSafe(row.gst).toFixed(2),
        parseFloatSafe(row.total + row.gst).toFixed(2),
        parseFloatSafe(row.vip).toFixed(2),
        parseFloatSafe(row.package).toFixed(2),
        parseFloatSafe(row.net_sales).toFixed(2),
        parseFloatSafe(row.refund).toFixed(2)
      ]),
      // Dynamic total row
      [
        'Total',
        // Dynamic payment method totals
        ...paymentMethods.map(method => getTotalValue(method.payment_method_name).toFixed(2)),
        // Fixed totals
        (currentTotals.total || 0).toFixed(2),
        (currentTotals.gst || 0).toFixed(2),
        (currentTotals.total + currentTotals.gst || 0).toFixed(2),
        (currentTotals.vip || 0).toFixed(2),
        (currentTotals.package || 0).toFixed(2),
        (currentTotals.net_sales || 0).toFixed(2),
        (currentTotals.refund || 0).toFixed(2)
      ],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set dynamic column widths
    const totalColumns = 1 + paymentMethods.length + fixedColumns.length;
    const colWidths = [
      { wch: 5 },  // Day
      ...paymentMethods.map(() => ({ wch: 10 })), // Payment methods
      { wch: 10 }, // Total Income
      { wch: 10 }, // GST
      { wch: 12 }, // Total with GST
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalColumns - 1 } }, // Subtitle row
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
    <div className='[--header-height:calc(theme(spacing.14))] h-screen overflow-hidden'>
      <SidebarProvider className='flex flex-col h-full'>
        <SiteHeader />
        <div className='flex flex-1 min-h-0'>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-w-0 flex-1">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Revenue Report</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownloadExcel}
                    className="bg-green-600 text-white p-3 rounded hover:bg-green-700 transition-colors"
                    disabled={!reportData || reportData.length === 0}
                    title="Download Excel Report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
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
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex-shrink-0">
                  Error loading revenue data: {error}
                </div>
              )}
              
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">Loading revenue data...</div>
                  ) : (
                    <table className="min-w-full border border-gray-200">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-gray-100">
                          {/* Day column */}
                          <th className="border border-gray-300 px-4 py-2 sticky left-0 bg-gray-100 z-20 min-w-[60px]">Day</th>

                          {/* Dynamic payment method columns */}
                          {paymentMethods.map(method => (
                            <th key={method.id} className="border border-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">
                              {method.payment_method_name}
                            </th>
                          ))}

                          {/* Fixed columns */}
                          {fixedColumns.map(header => (
                            <th key={header} className="border border-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.length > 0 ? (
                          <>
                            {reportData.map((row, index) => {
                              return (
                                <tr key={row.day} className="hover:bg-gray-50">
                                  {/* Day column - sticky */}
                                  <td className="border border-gray-300 px-4 py-2 text-center sticky left-0 bg-white z-10 font-medium">{row.day}</td>

                                  {/* Dynamic payment method columns */}
                                  {paymentMethods.map(method => {
                                    const key = getPaymentMethodKey(method.payment_method_name);
                                    return (
                                      <td key={method.id} className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">
                                        {formatAmount(row[key])}
                                      </td>
                                    );
                                  })}

                                  {/* Fixed columns */}
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.total)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.gst)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.total + row.gst)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">
                                    {formatAmount(row.vip)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.package)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.net_sales)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{formatAmount(row.refund)}</td>
                                </tr>
                              );
                            })}

                            {/* Dynamic Totals row */}
                            <tr className="bg-gray-200 font-semibold sticky bottom-0 z-20">
                              <td className="border border-gray-300 px-4 py-2 text-center sticky left-0 bg-gray-200 z-30">Total</td>

                              {/* Dynamic payment method totals */}
                              {paymentMethods.map((method, index) => (
                                <td key={method.id} className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                  <div className="flex flex-col">
                                    <span>{getTotalValue(method.payment_method_name).toFixed(2)}</span>
                                  </div>
                                </td>
                              ))}

                              {/* Fixed totals columns */}
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.total || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.gst || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.total + currentTotals.gst || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.vip || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.package || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.net_sales || 0).toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap bg-gray-200">
                                <div className="flex flex-col">
                                  <span>{(currentTotals.refund || 0).toFixed(2)}</span>
                                </div>
                              </td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan={1 + paymentMethods.length + fixedColumns.length} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                              No data available. Please select a month and year and click "Get Report".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default RevenueReportPage;

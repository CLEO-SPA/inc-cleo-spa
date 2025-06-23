// --- File: DeferredRevenuePage.jsx ---
import React, { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useRevenueReportStore } from '@/stores/revenue/revenueStore';
import MonthYearSelector from '@/components/revenue/revenueMonthYearSelector';

function DeferredRevenuePage() {
  const {
    earliestDate,
    selectedMonth,
    selectedYear,
    loading,
    error,
    setMonth,
    setYear,
    resultMonth,
    resultYear,
    fetchEarliestDate,
    fetchRevenueData
  } = useRevenueReportStore();

  useEffect(() => {
    fetchEarliestDate();
  }, []);

  useEffect(() => {
    if (earliestDate) {
      fetchRevenueData();
    }
  }, [earliestDate]);

  const handleGetReport = () => {
    fetchRevenueData();
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
                <h2 className="text-xl font-bold">Deferred Revenue Report</h2>
              </div>

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

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  Error loading revenue data: {error}
                </div>
              )}

              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Revenue Amount For {resultMonth}, {resultYear}</span>
                  <span className="text-2xl font-bold">{(100.00).toFixed(2)} $</span>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default DeferredRevenuePage;

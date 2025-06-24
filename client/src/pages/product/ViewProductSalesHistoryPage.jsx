import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import api from '@/services/api';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ViewProductSalesHistoryPage() {
  const { product_id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSalesHistory = async () => {
    setIsLoading(true);
    try {
      const numericMonth = months.indexOf(selectedMonth) + 1;

      const response = await api.get(`/product/sales-history/${product_id}?month=${numericMonth}&year=${selectedYear}`);

      const data = response.data;

      const summaryRow = data.summary;
      const dailyRows = data.daily;

      if (summaryRow) {
        setSummary({
          product_name: summaryRow.product_name,
          adhoc_count: parseInt(summaryRow.adhoc_transactions),
          adhoc_total: parseFloat(summaryRow.adhoc_amount).toFixed(2)
        });
      } else {
        setSummary(null);
      }

      const transformedDaily = dailyRows.map((entry) => ({
        product_name: entry.product_name,
        date: format(new Date(entry.txn_date), 'yyyy-MM-dd'),
        adhoc_count: parseInt(entry.adhoc_transactions),
        adhoc_total: parseFloat(entry.adhoc_amount).toFixed(2)
      }));

      setDailyBreakdown(transformedDaily);
    } catch (err) {
      console.error('Failed to fetch sales history:', err);
      setSummary(null);
      setDailyBreakdown([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (product_id) fetchSalesHistory();
  }, [product_id, selectedMonth, selectedYear]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-6 p-6'>
              <h2 className='text-2xl font-bold'>Product Monthly Sales History</h2>

              {/* Filters */}
              <div className='flex items-center gap-4'>
                <div>
                  <label className='block text-md font-medium mb-1'>Select Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className='w-[200px]'>
                      <SelectValue placeholder='Select Month' />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='block text-md font-medium mb-1'>Select Year</label>
                  <Input
                    type='number'
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className='w-[100px]'
                  />
                </div>
              </div>

              {/* Monthly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg font-semibold'>Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading summary data...</p>
                  ) : summary ? (
                    <table className='table-auto w-full border border-gray-200'>
                      <thead className='bg-gray-100'>
                        <tr>
                          <th className='text-left px-4 py-2 border'>Service Name</th>
                          <th className='text-left px-4 py-2 border'>Ad-hoc Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className='even:bg-gray-50'>
                          <td className='px-4 py-2 border'>{summary.product_name}</td>
                          <td className='px-4 py-2 border'>
                            {summary.adhoc_count > 0
                              ? `${summary.adhoc_count} transaction${summary.adhoc_count !== 1 ? 's' : ''} ($${
                                  summary.adhoc_total
                                })`
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p>
                      No summary data available for the product{' '}
                      <span className='font-semibold'>{dailyBreakdown[0]?.product_name || '—'}</span>.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Daily Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg font-semibold'>Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading daily breakdown data...</p>
                  ) : (
                    <table className='table-auto w-full border border-gray-200'>
                      <thead className='bg-gray-100'>
                        <tr>
                          <th className='text-left px-4 py-2 border'>Date</th>
                          <th className='text-left px-4 py-2 border'>Ad-hoc Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyBreakdown.length ? (
                          dailyBreakdown.map((entry, idx) => (
                            <tr key={idx} className='even:bg-gray-50'>
                              <td className='px-4 py-2 border'>{entry.date}</td>
                              <td className='px-4 py-2 border'>
                                {entry.adhoc_count > 0
                                  ? `${entry.adhoc_count} transaction${entry.adhoc_count !== 1 ? 's' : ''} ($${
                                      entry.adhoc_total
                                    })`
                                  : '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className='px-4 py-2 border' colSpan={4}>
                              No data available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

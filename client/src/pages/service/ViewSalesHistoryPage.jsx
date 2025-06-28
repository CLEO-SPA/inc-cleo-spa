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

export default function ViewSalesHistoryPage() {
  const { service_id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSalesHistory = async () => {
    setIsLoading(true);
    try {
      const numericMonth = months.indexOf(selectedMonth) + 1;

      const response = await api.get(`/service/sales-history/${service_id}?month=${numericMonth}&year=${selectedYear}`);

      const data = response.data;

      const summaryRow = data.summary;
      const dailyRows = data.daily;

      if (summaryRow) {
        setSummary({
          service_name: summaryRow.service_name,
          adhoc_count: parseInt(summaryRow.adhoc_transactions),
          mcp_count: parseInt(summaryRow.mcp_transactions),
          mcp_consumption_count: parseInt(summaryRow.mcp_consumption),
          adhoc_total: parseFloat(summaryRow.adhoc_amount).toFixed(2),
          mcp_total: parseFloat(summaryRow.mcp_amount).toFixed(2),
          mcp_consumption_amount: Math.abs(parseInt(summaryRow.mcp_consumption_amount)).toFixed(2),
          total_amount: parseFloat(summaryRow.total_amount).toFixed(2),
        });
      } else {
        setSummary(null);
      }

      const transformedDaily = dailyRows.map((entry) => ({
        service_name: entry.service_name,
        date: format(new Date(entry.txn_date), 'yyyy-MM-dd'),
        adhoc_count: parseInt(entry.adhoc_transactions),
        mcp_count: parseInt(entry.mcp_transactions),
        mcp_consumption_count: parseInt(entry.mcp_consumption),
        adhoc_total: parseFloat(entry.adhoc_amount).toFixed(2),
        mcp_total: parseFloat(entry.mcp_amount).toFixed(2),
        mcp_consumption_amount: Math.abs(parseInt(entry.mcp_consumption_amount)).toFixed(2),
        total_amount: parseFloat(entry.total_amount).toFixed(2),
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
    if (service_id) fetchSalesHistory();
  }, [service_id, selectedMonth, selectedYear]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-6 p-6'>
              <h2 className='text-2xl font-bold'>Service Monthly Sales History</h2>

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
                          <th className='text-left px-4 py-2 border'>MCP Transaction</th>
                          <th className='text-left px-4 py-2 border'>
                            <div className='flex items-center gap-1'>
                              Total Transaction
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className='w-3.5 h-3.5 text-gray-500' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Total number of ad-hoc and MCP transactions combined.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </th>
                          <th className='text-left px-4 py-2 border'>
                            <div className='flex items-center gap-1'>
                              MCP Consumption
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className='w-3.5 h-3.5 text-gray-500' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Number of consumption from pre-paid Member Care Packages.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className='even:bg-gray-50'>
                          <td className='px-4 py-2 border'>{summary.service_name}</td>
                          <td className='px-4 py-2 border'>
                            {summary.adhoc_count > 0
                              ? `${summary.adhoc_count} transaction${summary.adhoc_count !== 1 ? 's' : ''} ($${
                                  summary.adhoc_total
                                })`
                              : '—'}
                          </td>
                          <td className='px-4 py-2 border'>
                            {summary.mcp_count > 0
                              ? `${summary.mcp_count} transaction${summary.mcp_count !== 1 ? 's' : ''} ($${
                                  summary.mcp_total
                                })`
                              : '—'}
                          </td>
                          <td className='px-4 py-2 border'>
                            {summary.mcp_count + summary.adhoc_count > 0
                              ? `${summary.adhoc_count + summary.mcp_count} transaction${
                                  summary.adhoc_count + summary.mcp_count !== 1 ? 's' : ''
                                } ($${summary.total_amount})`
                              : '—'}
                          </td>
                          <td className='px-4 py-2 border'>
                            {summary.mcp_consumption_count > 0
                              ? `${summary.mcp_consumption_count} consumption${
                                  summary.mcp_consumption_count !== 1 ? 's' : ''
                                } ($${summary.mcp_consumption_amount})`
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p>
                      No summary data available for the service{' '}
                      <span className='font-semibold'>{dailyBreakdown[0]?.service_name || '—'}</span>.
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
                          <th className='text-left px-4 py-2 border'>MCP Transaction</th>
                          <th className='text-left px-4 py-2 border'>Total Transaction</th>
                          <th className='text-left px-4 py-2 border'>MCP Consumption</th>
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
                              <td className='px-4 py-2 border'>
                                {entry.mcp_count > 0
                                  ? `${entry.mcp_count} transaction${entry.mcp_count !== 1 ? 's' : ''} ($${
                                      entry.mcp_total
                                    })`
                                  : '—'}
                              </td>
                              <td className='px-4 py-2 border'>
                                {entry.mcp_count + entry.adhoc_count > 0
                                  ? `${entry.mcp_count + entry.adhoc_count} transaction${
                                      entry.mcp_count + entry.adhoc_count !== 1 ? 's' : ''
                                    } ($${entry.total_amount})`
                                  : '—'}
                              </td>
                              <td className='px-4 py-2 border'>
                                {entry.mcp_consumption_count > 0
                                  ? `${entry.mcp_consumption_count} consumption${
                                      entry.mcp_consumption_count !== 1 ? 's' : ''
                                    } ($${entry.mcp_consumption_amount})`
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

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// Dummy generator with performance and commission only
const generateDummyBreakdown = (year, month) => {
  const days = new Date(year, month, 0).getDate();
  const data = [];

  for (let d = 1; d <= days; d++) {
    let performance_amount = 0;

    if ([5, 7, 8].includes(d)) {
      performance_amount = d === 8 ? 3000 : 1500;
    }

    const commission_amount = performance_amount > 0 ? +(performance_amount * 0.06).toFixed(2) : 0;

    data.push({
      day: d,
      performance_amount,
      commission_amount,
    });
  }

  return data;
};

export default function ViewMonthlyEmployeeCommission() {
  const now = new Date();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const employeeId = searchParams.get('employeeId') || '14';
  const employeeCode = 'EMP002';
  const employeeName = 'Tina';

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(generateDummyBreakdown(year, month));
  }, [year, month]);

  const totalPerformance = data.reduce((sum, row) => sum + row.performance_amount, 0);
  const totalCommission = data.reduce((sum, row) => sum + row.commission_amount, 0);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg font-semibold'>
                    Monthly Employee Sales Performance / Commission Report
                  </CardTitle>
                  <div className='mt-4 flex flex-wrap gap-4 text-sm'>
                    <div>
                      <span>Select Month:</span>
                      <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className='ml-2 border rounded px-2 py-1'
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span>Select Year:</span>
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className='ml-2 border rounded px-2 py-1'
                      >
                        {[2022, 2023, 2024, 2025].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4 text-sm'>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    <div><strong>Employee ID:</strong> {employeeId}</div>
                    <div><strong>Employee Code:</strong> {employeeCode}</div>
                    <div><strong>Employee Name:</strong> {employeeName}</div>
                    <div><strong>Month/Year:</strong> {String(month).padStart(2, '0')}/{year}</div>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    <div><strong>Total Performance:</strong> ${totalPerformance.toFixed(2)}</div>
                    <div><strong>Total Commission:</strong> ${totalCommission.toFixed(2)}</div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Performance Amount</TableHead>
                        <TableHead>Commission Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row) => (
                        <TableRow key={row.day} className='hover:bg-muted'>
                          <TableCell>{row.day}</TableCell>
                          <TableCell>${row.performance_amount.toFixed(2)}</TableCell>
                          <TableCell>${row.commission_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size='sm'
                              className='text-xs bg-blue-500 hover:bg-blue-600'
                              onClick={() =>
                                navigate(`/cm/daily-commission-breakdown?employeeId=${employeeId}&day=${row.day}`)
                              }
                            >
                              View Breakdown
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const generateDummyDailyBreakdown = () => {
  return [
    {
      id: 1,
      item_type: 'service',
      item_id: 20,
      employee_id: 14,
      performance_rate: 50.0,
      performance_amount: 58.8,
      commission_rate: 10.0,
      commission_amount: 5.88,
      created_at: '2022-05-22 04:00:00+00',
      remarks: '',
    },
    {
      id: 2,
      item_type: 'product',
      item_id: 21,
      employee_id: 14,
      performance_rate: 75.0,
      performance_amount: 28.5,
      commission_rate: 10.0,
      commission_amount: 2.85,
      created_at: '2022-05-22 04:00:00+00',
      remarks: '',
    },
    {
      id: 3,
      item_type: 'mcp_purchase',
      item_id: 3,
      employee_id: 14,
      performance_rate: 100.0,
      performance_amount: 174.0,
      commission_rate: 6.0,
      commission_amount: 10.44,
      created_at: '2022-05-22 04:00:00+00',
      remarks: 'Full package bonus',
    },
  ];
};

export default function ViewDailyCommissionBreakdownPage() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId') || '14';
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(generateDummyDailyBreakdown());
  }, []);

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
                  <CardTitle className='text-lg font-semibold'>Daily Commission Breakdown - Employee #{employeeId}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Item Type</TableHead>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Performance Rate (%)</TableHead>
                        <TableHead>Performance Amount</TableHead>
                        <TableHead>Commission Rate (%)</TableHead>
                        <TableHead>Commission Amount</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.item_type}</TableCell>
                          <TableCell>{row.item_id}</TableCell>
                          <TableCell>{row.performance_rate.toFixed(2)}</TableCell>
                          <TableCell>${row.performance_amount.toFixed(2)}</TableCell>
                          <TableCell>{row.commission_rate.toFixed(2)}</TableCell>
                          <TableCell>${row.commission_amount.toFixed(2)}</TableCell>
                          <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                          <TableCell>{row.remarks || '-'}</TableCell>
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

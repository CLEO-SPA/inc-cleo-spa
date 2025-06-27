import React from 'react';
import { useConsumptionStore } from '@/stores/MemberCarePackage/useMcpConsumptionStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const MemberCarePackageTransactionLogs = () => {
  const { currentPackageInfo, isLoading } = useConsumptionStore();

  const logs = currentPackageInfo?.transactionLogs || [];
  const details = currentPackageInfo?.details || [];

  //   console.log(logs);

  const getServiceName = (detailId) => {
    const detail = details.find((d) => d.id === detailId);
    return detail ? detail.service_name : 'N/A';
  };

  return (
    <Card className='m-4 h-full flex flex-col'>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent activities for this package.</CardDescription>
      </CardHeader>
      <CardContent className='flex-grow p-0'>
        <ScrollArea className='h-[calc(100vh-32rem)]'>
          {isLoading && logs.length === 0 ? (
            <p className='p-4 text-center'>Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className='p-4 text-center'>No transaction logs found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Transaction amount</TableHead>
                  <TableHead>Amount changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...logs]
                  .sort((a, b) => {
                    const dateComparison =
                      new Date(a.transaction_date || a.created_at) - new Date(b.transaction_date || b.created_at);
                    if (dateComparison !== 0) {
                      return dateComparison;
                    }
                    return a.transaction_amount - b.transaction_amount;
                  })
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.transaction_date || log.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={log.type === 'CONSUMPTION' ? 'secondary' : 'outline'}>{log.type}</Badge>
                      </TableCell>
                      <TableCell>{getServiceName(log.member_care_package_details_id)}</TableCell>
                      <TableCell>{log.transaction_amount}</TableCell>
                      <TableCell>{log.amount_changed}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MemberCarePackageTransactionLogs;

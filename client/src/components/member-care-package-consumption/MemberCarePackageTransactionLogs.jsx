import React, { useMemo, useState } from 'react';
import { useConsumptionStore } from '@/stores/MemberCarePackage/useMcpConsumptionStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MemberCarePackageTransactionLogs = () => {
  const { currentPackageInfo, isLoading } = useConsumptionStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const logs = useMemo(() => currentPackageInfo?.transactionLogs || [], [currentPackageInfo]);
  const details = useMemo(() => currentPackageInfo?.details || [], [currentPackageInfo]);

  // Sort logs before pagination
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const dateComparison =
        new Date(a.transaction_date || a.created_at) - new Date(b.transaction_date || b.created_at);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      if (a.type === 'CONSUMPTION' && b.type !== 'CONSUMPTION') {
        return -1;
      }
      if (a.type !== 'CONSUMPTION' && b.type === 'CONSUMPTION') {
        return 1;
      }

      return b.transaction_amount - a.transaction_amount;
    });
  }, [logs]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedLogs.slice(startIndex, startIndex + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  const getServiceName = (detailId) => {
    const detail = details.find((d) => d.id === detailId);
    return detail ? detail.service_name : 'N/A';
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let consumptionCount = 0;
    let otherCount = 0;

    logs.forEach((log) => {
      if (log.type === 'CONSUMPTION') {
        consumptionCount++;
      } else {
        otherCount++;
      }
    });

    return { consumptionCount, otherCount, total: logs.length };
  }, [logs]);

  // Handle pagination navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <Card className='m-4 h-full flex flex-col shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <History className='h-5 w-5 text-primary' />
          <span>Transaction History</span>
        </CardTitle>
        <CardDescription>
          {logs.length > 0 ? `${logs.length} transactions recorded for this package.` : 'No transactions recorded yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-grow px-6 pb-0'>
        <ScrollArea className='h-[calc(100vh-32rem)]'>
          {isLoading && logs.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>Loading transaction logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>No transaction logs found for this package.</p>
              <p className='text-sm text-muted-foreground mt-2'>
                Transactions will appear here when services are consumed or when balance changes occur.
              </p>
            </div>
          ) : (
            <div className='border rounded-md overflow-hidden'>
              <Table>
                <TableHeader className='bg-muted/20'>
                  <TableRow>
                    <TableHead className='w-[18%]'>Date</TableHead>
                    <TableHead className='w-[18%]'>Type</TableHead>
                    <TableHead className='w-[28%]'>Service</TableHead>
                    <TableHead className='text-right w-[18%]'>Amount</TableHead>
                    <TableHead className='text-right w-[18%]'>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className='text-sm'>
                        {new Date(log.transaction_date || log.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.type === 'CONSUMPTION' ? 'secondary' : 'outline'}
                          className='whitespace-nowrap'
                        >
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='truncate max-w-[200px] font-medium'>
                          {getServiceName(log.member_care_package_details_id)}
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {typeof log.transaction_amount === 'number'
                          ? `$${log.transaction_amount.toFixed(2)}`
                          : log.transaction_amount}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end'>
                          {/* {log.amount_changed > 0 ? (
                            <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                          ) : (
                            <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                          )} */}
                          <span className={log.amount_changed > 0 ? 'text-green-700' : 'text-red-600'}>
                            {log.amount_changed > 0
                              ? `+$${Math.abs(log.amount_changed).toFixed(2)}`
                              : log.amount_changed < 0
                              ? `-$${Math.abs(log.amount_changed).toFixed(2)}`
                              : '$0.00'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>

        {/* Pagination Controls */}
        {logs.length > 10 && (
          <div className='flex items-center justify-between mt-4 pb-4'>
            <div className='flex items-center space-x-2'>
              <p className='text-sm text-muted-foreground'>Rows per page</p>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className='h-8 w-16'>
                  <SelectValue>{pageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='5'>5</SelectItem>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='20'>20</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className='h-8 w-8 p-0'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='text-sm'>
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className='h-8 w-8 p-0'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {logs.length > 0 && (
        <CardFooter className='border-t bg-muted/20 py-2 mt-4'>
          <div className='w-full flex justify-between text-sm'>
            <span className='text-muted-foreground'>Total: {stats.total} transactions</span>
            <div className='space-x-3'>
              <Badge variant='secondary' className='bg-secondary/20'>
                {stats.consumptionCount} Consumption
              </Badge>
              <Badge variant='outline'>{stats.otherCount} Other</Badge>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MemberCarePackageTransactionLogs;

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, Calendar, User, DollarSign } from 'lucide-react';
import useCommissionStore from '@/stores/useCommissionStore';
import useAuth from '@/hooks/useAuth';

export default function CommissionBreakdownPage() {
  const navigate = useNavigate();
  const { employeeId, date } = useParams();
  const { user } = useAuth();

  // Commission store state
  const {
    breakdownData,
    loading,
    error,
    loadCommissionBreakdown,
    clearErrors,
    reset
  } = useCommissionStore();

  // Initialize component
  useEffect(() => {
    if (employeeId && date) {
      console.log('Loading commission breakdown for:', { employeeId, date });
      loadCommissionBreakdown(parseInt(employeeId), date);
    } else {
      console.error('Missing employeeId or date parameters');
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [employeeId, date, loadCommissionBreakdown, reset]);

  // Handle back navigation
  const handleBackToMonthly = () => {
    navigate(`/cm/monthly-employee-commission?employeeId=${employeeId}`);
  };

  // Calculate summary data from breakdown records
  const summary = React.useMemo(() => {
    if (!breakdownData || breakdownData.length === 0) {
      return {
        totalRecords: 0,
        totalCommission: "0.00",
        totalPerformance: "0.00",
        byItemType: {}
      };
    }

    const byItemType = {};
    let totalCommission = 0;
    let totalPerformance = 0;

    breakdownData.forEach(record => {
      const itemType = record.item_type;
      const commission = parseFloat(record.commission_amount || 0);
      const performance = parseFloat(record.performance_amount || 0);

      // Update totals
      totalCommission += commission;
      totalPerformance += performance;

      // Group by item type
      if (!byItemType[itemType]) {
        byItemType[itemType] = {
          count: 0,
          commission: 0,
          performance: 0
        };
      }
      byItemType[itemType].count += 1;
      byItemType[itemType].commission += commission;
      byItemType[itemType].performance += performance;
    });

    // Format item type totals
    Object.keys(byItemType).forEach(itemType => {
      byItemType[itemType].commission = byItemType[itemType].commission.toFixed(2);
      byItemType[itemType].performance = byItemType[itemType].performance.toFixed(2);
    });

    return {
      totalRecords: breakdownData.length,
      totalCommission: totalCommission.toFixed(2),
      totalPerformance: totalPerformance.toFixed(2),
      byItemType
    };
  }, [breakdownData]);

  // Format item type for display
  const formatItemType = (itemType) => {
    const typeMap = {
      'services': 'Service',
      'products': 'Product',
      'member_vouchers': 'Member Voucher (Purchase)',
      'member_voucher_transaction_logs': 'Member Voucher (Consumption)',
      'member_care_packages': 'Care Package (Purchase)',
      'member_care_package_transaction_logs': 'Care Package (Consumption)'
    };
    return typeMap[itemType] || itemType;
  };

  // Get badge color for item type
  const getItemTypeBadgeColor = (itemType) => {
    const colorMap = {
      'services': 'bg-blue-100 text-blue-800',
      'products': 'bg-green-100 text-green-800',
      'member_vouchers': 'bg-purple-100 text-purple-800',
      'member_voucher_transaction_logs': 'bg-purple-100 text-purple-800',
      'member_care_packages': 'bg-orange-100 text-orange-800',
      'member_care_package_transaction_logs': 'bg-orange-100 text-orange-800'
    };
    return colorMap[itemType] || 'bg-gray-100 text-gray-800';
  };

  // Format date for display
  const formattedDate = date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : '';

  // Validation
  if (!employeeId || !date) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex flex-col gap-4 p-4'>
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Employee ID and date are required parameters.
                  </AlertDescription>
                </Alert>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4'>
              {/* Header Card */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        Daily Commission Breakdown
                      </CardTitle>
                      <div className='mt-2 text-sm text-muted-foreground'>
                        Detailed commission records for {formattedDate}
                      </div>
                    </div>
                    <Button 
                      variant='outline' 
                      onClick={handleBackToMonthly}
                      className='flex items-center gap-2'
                    >
                      <ArrowLeft className='h-4 w-4' />
                      Back to Monthly View
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  {/* Employee and Date Info */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-muted-foreground' />
                      <div>
                        <div className='text-xs text-muted-foreground'>Employee ID</div>
                        <div className='font-medium'>{employeeId}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <div>
                        <div className='text-xs text-muted-foreground'>Date</div>
                        <div className='font-medium'>{date}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <DollarSign className='h-4 w-4 text-muted-foreground' />
                      <div>
                        <div className='text-xs text-muted-foreground'>Total Commission</div>
                        <div className='font-medium'>${summary.totalCommission}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <DollarSign className='h-4 w-4 text-muted-foreground' />
                      <div>
                        <div className='text-xs text-muted-foreground'>Total Performance</div>
                        <div className='font-medium'>${summary.totalPerformance}</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary by Item Type */}
                  {Object.keys(summary.byItemType).length > 0 && (
                    <div>
                      <h3 className='text-sm font-medium mb-2'>Summary by Item Type</h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                        {Object.entries(summary.byItemType).map(([itemType, data]) => (
                          <div key={itemType} className='p-3 border rounded-lg'>
                            <Badge className={`mb-2 ${getItemTypeBadgeColor(itemType)}`}>
                              {formatItemType(itemType)}
                            </Badge>
                            <div className='space-y-1 text-xs'>
                              <div>Records: <span className='font-medium'>{data.count}</span></div>
                              <div>Commission: <span className='font-medium'>${data.commission}</span></div>
                              <div>Performance: <span className='font-medium'>${data.performance}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown Records Card */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Commission Records ({summary.totalRecords} records)
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Error Display */}
                  {error.breakdownData && (
                    <Alert variant='destructive' className='mb-4'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        {error.breakdownData}
                        <Button 
                          variant='outline' 
                          size='sm' 
                          className='ml-2'
                          onClick={() => {
                            clearErrors();
                            loadCommissionBreakdown(parseInt(employeeId), date);
                          }}
                        >
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Loading State */}
                  {loading.breakdownData ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='text-center'>
                        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2' />
                        <div className='text-muted-foreground'>Loading commission breakdown...</div>
                      </div>
                    </div>
                  ) : breakdownData.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Calendar className='h-12 w-12 mx-auto mb-2 opacity-50' />
                      <div>No commission records found for this date.</div>
                      <div className='text-xs mt-1'>The employee may not have earned any commissions on {formattedDate}.</div>
                    </div>
                  ) : (
                    /* Records Table */
                    <div className='border rounded-lg overflow-hidden'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-16'>#</TableHead>
                            <TableHead>Item Type</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead className='text-right'>Performance Rate</TableHead>
                            <TableHead className='text-right'>Performance Amount</TableHead>
                            <TableHead className='text-right'>Commission Rate</TableHead>
                            <TableHead className='text-right'>Commission Amount</TableHead>
                            <TableHead className='text-right'>Time</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdownData.map((record, index) => (
                            <TableRow key={record.id}>
                              <TableCell className='font-medium'>{index + 1}</TableCell>
                              <TableCell>
                                <Badge className={getItemTypeBadgeColor(record.item_type)}>
                                  {formatItemType(record.item_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className='max-w-[200px]'>
                                <div className='truncate' title={record.item_name}>
                                  {record.item_name || 'N/A'}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  ID: {record.item_id}
                                </div>
                              </TableCell>
                              <TableCell className='text-right'>{record.performance_rate}%</TableCell>
                              <TableCell className='text-right'>${record.performance_amount}</TableCell>
                              <TableCell className='text-right'>{record.commission_rate}%</TableCell>
                              <TableCell className='text-right font-medium'>${record.commission_amount}</TableCell>
                              <TableCell className='text-right text-xs'>
                                {format(new Date(record.created_at), 'HH:mm:ss')}
                              </TableCell>
                              <TableCell className='max-w-[150px]'>
                                <div className='truncate text-xs' title={record.remarks}>
                                  {record.remarks || '-'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Footer Info */}
                  {breakdownData.length > 0 && (
                    <div className='text-xs text-muted-foreground mt-4 space-y-1'>
                      <p>• Commission records are shown in chronological order</p>
                      <p>• Performance Rate: Employee's share of the transaction performance</p>
                      <p>• Commission Rate: Percentage applied to calculate final commission</p>
                      <p>• Times are displayed in Singapore timezone (SGT)</p>
                    </div>
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
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, AlertCircle } from 'lucide-react';
import MonthYearPicker from '@/components/employee-timetable/MonthYearPicker';
import useCommissionStore from '@/stores/useCommissionStore';
import useAuth from '@/hooks/useAuth';

export default function ViewMonthlyEmployeeCommission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Get employee ID from URL params
  const employeeId = searchParams.get('employeeId');
  
  // Commission store state
  const {
    commissionData,
    monthlyTotals,
    currentMonth,
    loading,
    error,
    setCurrentMonth,
    loadMonthlyCommissionData,
    hasCommissionDataForDate,
    clearErrors,
    reset
  } = useCommissionStore();

  // Initialize component
  useEffect(() => {
    if (employeeId) {
      console.log('Initializing commission view for employee:', employeeId);
      loadMonthlyCommissionData(parseInt(employeeId), currentMonth);
    } else {
      console.error('No employeeId provided in URL params');
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [employeeId, loadMonthlyCommissionData, reset]);

  // Handle month/year changes
  const handleMonthYearChange = async (selectedDate) => {
    if (selectedDate && employeeId) {
      console.log('Month/Year changed to:', selectedDate);
      setCurrentMonth(selectedDate);
      await loadMonthlyCommissionData(parseInt(employeeId), selectedDate);
    }
  };

  // Handle view breakdown navigation
  const handleViewBreakdown = (date) => {
    console.log('Navigating to breakdown for date:', date);
    navigate(`/cm/employee-commission-breakdown/${employeeId}/${date}`);
  };

  // Get employee name from search params or fallback
  const employeeName = searchParams.get('employeeName') || `Employee ${employeeId}`;

  // Validation
  if (!employeeId) {
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
                    Employee ID is required. Please select an employee from the manage employees page.
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
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg font-semibold'>
                    Monthly Employee Sales Performance / Commission Report
                  </CardTitle>
                  
                  {/* Month/Year Picker */}
                  <div className='mt-4 flex flex-wrap gap-4 items-center'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>Select Month:</span>
                      <MonthYearPicker
                        value={currentMonth}
                        onSelect={handleMonthYearChange}
                        disabled={loading.monthlyData}
                        placeholder="Select Month"
                      />
                    </div>
                    
                    {loading.monthlyData && (
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Loading commission data...
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className='space-y-4 text-sm'>
                  {/* Error Display */}
                  {error.monthlyData && (
                    <Alert variant='destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        {error.monthlyData}
                        <Button 
                          variant='outline' 
                          size='sm' 
                          className='ml-2'
                          onClick={() => {
                            clearErrors();
                            loadMonthlyCommissionData(parseInt(employeeId), currentMonth);
                          }}
                        >
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Employee Information */}
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    <div><strong>Employee ID:</strong> {employeeId}</div>
                    <div><strong>Employee Name:</strong> {employeeName}</div>
                    <div>
                      <strong>Month/Year:</strong> {currentMonth.toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* Monthly Totals */}
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-muted rounded-lg'>
                    <div><strong>Services:</strong> ${monthlyTotals.services}</div>
                    <div><strong>Products:</strong> ${monthlyTotals.products}</div>
                    <div><strong>Member Vouchers:</strong> ${monthlyTotals.member_vouchers}</div>
                    <div><strong>Care Packages:</strong> ${monthlyTotals.member_care_packages}</div>
                    <div><strong>Performance:</strong> ${monthlyTotals.performance_total}</div>
                    <div><strong>Commission:</strong> ${monthlyTotals.commission_total}</div>
                  </div>

                  {/* Commission Table */}
                  {loading.monthlyData ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='text-center'>
                        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2' />
                        <div className='text-muted-foreground'>Loading commission data...</div>
                      </div>
                    </div>
                  ) : commissionData.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      No commission data found for the selected month.
                    </div>
                  ) : (
                    <div className='border rounded-lg overflow-hidden'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-16'>Day</TableHead>
                            <TableHead className='text-right'>Services</TableHead>
                            <TableHead className='text-right'>Products</TableHead>
                            <TableHead className='text-right'>Member Vouchers</TableHead>
                            <TableHead className='text-right'>Care Packages</TableHead>
                            <TableHead className='text-right'>Performance Total</TableHead>
                            <TableHead className='text-right'>Commission Total</TableHead>
                            <TableHead className='w-24'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissionData.map((dayData) => {
                            const dayNumber = parseInt(dayData.date.split('-')[2], 10);
                            const hasData = hasCommissionDataForDate(dayData.date);
                            
                            return (
                              <TableRow 
                                key={dayData.date}
                                className={hasData ? 'bg-green-50 hover:bg-green-100' : ''}
                              >
                                <TableCell className='font-medium'>{dayNumber}</TableCell>
                                <TableCell className='text-right'>{dayData.services}</TableCell>
                                <TableCell className='text-right'>{dayData.products}</TableCell>
                                <TableCell className='text-right'>{dayData.member_vouchers}</TableCell>
                                <TableCell className='text-right'>{dayData.member_care_packages}</TableCell>
                                <TableCell className='text-right font-medium'>{dayData.performance_total}</TableCell>
                                <TableCell className='text-right font-medium'>{dayData.commission_total}</TableCell>
                                <TableCell>
                                  <Button 
                                    size='sm' 
                                    variant={hasData ? 'default' : 'outline'}
                                    disabled={!hasData}
                                    onClick={() => handleViewBreakdown(dayData.date)}
                                    className='text-xs h-7'
                                  >
                                    <Eye className='h-3 w-3 mr-1' />
                                    {hasData ? 'View' : 'No Data'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Summary Footer */}
                  {commissionData.length > 0 && (
                    <div className='text-xs text-muted-foreground mt-4'>
                      <p>
                        • Days with commission data are highlighted in green
                      </p>
                      <p>
                        • Member Vouchers includes both purchase and consumption commissions
                      </p>
                      <p>
                        • Care Packages includes both purchase and consumption commissions
                      </p>
                      <p>
                        • Click "View" to see detailed breakdown for each day
                      </p>
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
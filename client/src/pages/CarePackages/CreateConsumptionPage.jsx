import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsumptionStore } from '@/stores/useMcpConsumptionStore';
import useAuth from '@/hooks/useAuth';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Assuming you have an Alert component
import { Loader2 } from 'lucide-react'; // For loading spinner

export default function CreateConsumptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    formData,
    detailForm,
    currentPackageInfo,
    isLoading,
    error,
    fetchPackageData,
    selectServiceToConsume,
    updateDetailFormField,
    updateMainField,
    submitConsumption,
    resetMainForm,
  } = useConsumptionStore();

  useEffect(() => {
    if (id) {
      fetchPackageData(id);
    }
    if (user && user.id) {
      updateMainField('employee_id', user.id);
    }
    return () => {
      // resetMainForm();
    };
  }, [id, fetchPackageData, user, updateMainField]);

  const handleServiceChange = (serviceDetailId) => {
    if (serviceDetailId) {
      selectServiceToConsume(serviceDetailId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitConsumption();
  };

  if (isLoading && !currentPackageInfo) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2'>Loading package details...</span>
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
            <div className='container mx-auto p-4 lg:p-6 space-y-6'>
              <Button variant='outline' onClick={() => navigate(-1)} className='mb-4 print:hidden'>
                &larr; Back
              </Button>

              {isLoading && !currentPackageInfo && (
                <div className='flex justify-center items-center h-64'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                  <span className='ml-2'>Loading package details...</span>
                </div>
              )}

              {error &&
                !isLoading && ( // Display error prominently if it occurs before data load
                  <Alert variant='destructive' className='mb-4 max-w-3xl mx-auto'>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

              {!currentPackageInfo && !isLoading && !error && (
                <Card className='max-w-3xl mx-auto'>
                  <CardContent className='pt-6'>
                    <p>No package data found. Please ensure the package ID is correct or try again.</p>
                  </CardContent>
                </Card>
              )}

              {currentPackageInfo && (
                <>
                  {/* Main Service Consumption Card */}
                  <Card className='max-w-3xl mx-auto'>
                    <CardHeader>
                      <CardTitle>Consume Package Service</CardTitle>
                      {currentPackageInfo.package && (
                        <p className='text-sm text-muted-foreground'>
                          Select a service from "<strong>{currentPackageInfo.package.package_name}</strong>" to consume.
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <Alert variant='destructive' className='mb-4'>
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <form onSubmit={handleSubmit} className='space-y-6'>
                        <div>
                          <Label htmlFor='service'>Available Services</Label>
                          <Select
                            value={detailForm.mcpd_id}
                            onValueChange={handleServiceChange}
                            disabled={
                              isLoading ||
                              currentPackageInfo.details.filter((d) => d.remaining_quantity > 0).length === 0
                            }
                          >
                            <SelectTrigger id='service'>
                              <SelectValue placeholder='Select a service to consume' />
                            </SelectTrigger>
                            <SelectContent>
                              {currentPackageInfo.details.filter((d) => d.remaining_quantity > 0).length > 0 ? (
                                currentPackageInfo.details
                                  .filter((detail) => detail.remaining_quantity > 0)
                                  .map((detail) => (
                                    <SelectItem key={detail.id} value={detail.id}>
                                      {detail.service_name} (Price: ${detail.price?.toFixed(2)}/session, Remaining:{' '}
                                      {detail.remaining_quantity})
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value='' disabled>
                                  No consumable services available in this package.
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {detailForm.mcpd_id && (
                          <Card className='p-4 bg-slate-50 dark:bg-slate-800/30 shadow-sm'>
                            <CardHeader className='p-0 pb-3 mb-3 border-b'>
                              <CardTitle className='text-md'>
                                Consume: <span className='font-semibold text-primary'>{detailForm.service_name}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 space-y-4'>
                              <div>
                                <Label htmlFor='quantity'>Quantity to Consume</Label>
                                <Input
                                  id='quantity'
                                  type='number'
                                  value={detailForm.mcpd_quantity}
                                  onChange={(e) => updateDetailFormField('mcpd_quantity', e.target.value)}
                                  min='1'
                                  max={detailForm.max_quantity > 0 ? detailForm.max_quantity : undefined}
                                  disabled={isLoading || detailForm.max_quantity === 0}
                                  required
                                />
                                {detailForm.max_quantity > 0 && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    Available to consume: {detailForm.max_quantity} session(s).
                                    {currentPackageInfo.details.find((d) => d.id === detailForm.mcpd_id)?.price > 0 &&
                                      ` Each at $${currentPackageInfo.details
                                        .find((d) => d.id === detailForm.mcpd_id)
                                        ?.price.toFixed(2)}.`}
                                  </p>
                                )}
                                {detailForm.max_quantity === 0 && detailForm.mcpd_id && (
                                  <p className='text-xs text-destructive mt-1'>
                                    No remaining sessions for this service.
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor='consumptionDate'>Consumption Date</Label>
                                <Input
                                  id='consumptionDate'
                                  type='date' // If you need time, use 'datetime-local' and adjust store
                                  value={detailForm.mcpd_date}
                                  onChange={(e) => updateDetailFormField('mcpd_date', e.target.value)}
                                  disabled={isLoading}
                                  required
                                />
                              </div>

                              {(() => {
                                const service = currentPackageInfo.details.find((d) => d.id === detailForm.mcpd_id);
                                if (
                                  service &&
                                  detailForm.mcpd_quantity > 0 &&
                                  service.price > 0 &&
                                  !isNaN(parseInt(detailForm.mcpd_quantity, 10))
                                ) {
                                  return (
                                    <div className='text-sm p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md'>
                                      <strong>Total for this consumption: </strong>
                                      <span className='font-semibold text-blue-600 dark:text-blue-400'>
                                        ${(service.price * parseInt(detailForm.mcpd_quantity, 10)).toFixed(2)}
                                      </span>
                                      {` for ${detailForm.mcpd_quantity} session(s)`}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </CardContent>
                          </Card>
                        )}
                        <Input type='hidden' value={formData.employee_id || ''} readOnly />
                        <Button
                          type='submit'
                          className='w-full sm:w-auto'
                          disabled={
                            isLoading ||
                            !detailForm.mcpd_id ||
                            detailForm.max_quantity === 0 ||
                            parseInt(detailForm.mcpd_quantity, 10) <= 0
                          }
                        >
                          {isLoading /* && submitConsumptionState.pending */ ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          ) : null}
                          Process Selected Service
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Recent Consumption Logs */}
                  {currentPackageInfo.transactionLogs &&
                    currentPackageInfo.transactionLogs.filter((log) => log.type === 'CONSUMPTION').length > 0 && (
                      <Card className='mt-6 max-w-3xl mx-auto'>
                        <CardHeader>
                          <CardTitle className='text-lg'>Recent Consumption History</CardTitle>
                          <p className='text-sm text-muted-foreground'>Last 5 consumptions from this package.</p>
                        </CardHeader>
                        <CardContent>
                          <div className='max-h-72 overflow-y-auto text-sm'>
                            <ul className='space-y-2'>
                              {currentPackageInfo.transactionLogs
                                .filter((log) => log.type === 'CONSUMPTION')
                                .sort(
                                  (a, b) =>
                                    new Date(b.transaction_date || b.created_at || b.createdAt) -
                                    new Date(a.transaction_date || a.created_at || a.createdAt)
                                )
                                .slice(0, 5)
                                .map((log) => {
                                  const serviceDetail = currentPackageInfo.details.find(
                                    (d) => d.id === log.member_care_package_details_id
                                  );
                                  const serviceName = serviceDetail ? serviceDetail.service_name : 'Unknown Service';
                                  let quantityConsumed = 0;
                                  if (log.amount_changed !== undefined) {
                                    if (serviceDetail && serviceDetail.price > 0) {
                                      quantityConsumed = Math.abs(log.amount_changed / serviceDetail.price);
                                    } else {
                                      quantityConsumed = Math.abs(log.amount_changed);
                                    }
                                  } else if (log.quantity_change !== undefined) {
                                    quantityConsumed = Math.abs(log.quantity_change);
                                  }
                                  quantityConsumed = Math.round(quantityConsumed);
                                  const logDate = log.transaction_date || log.created_at || log.createdAt;

                                  return (
                                    <li
                                      key={log.id || log.transaction_id || logDate + serviceName}
                                      className='py-2 px-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center'
                                    >
                                      <div>
                                        Consumed {quantityConsumed} session(s) of <strong>{serviceName}</strong>
                                      </div>
                                      <div className='text-muted-foreground'>
                                        {logDate ? new Date(logDate).toLocaleDateString() : 'Date N/A'}
                                      </div>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

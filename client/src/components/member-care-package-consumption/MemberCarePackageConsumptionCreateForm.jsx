import React from 'react';
import { useConsumptionStore } from '@/stores/MemberCarePackage/useMcpConsumptionStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import EmployeeCommissionSelect from '@/components/ui/forms/EmployeeCommissionSelect';

const MemberCarePackageConsumptionCreateForm = () => {
  const {
    detailForm,
    currentPackageInfo,
    isLoading,
    isSubmitting,
    selectServiceToConsume,
    updateDetailFormField,
    confirmConsumption,
    getFormattedDate,
    updateDateField,
    selectedServiceId,
    selectedServiceFinalPrice,
    setEmployeeCommissionAssignments,
    employeeCommissionAssignments,
  } = useConsumptionStore();

  const consumableServices = currentPackageInfo?.details?.filter((d) => d.remaining_quantity > 0) || [];

  // Calculate effective max quantity based on remaining quantity and balance
  let effectiveMaxQuantity = 0;
  const selectedService = detailForm.mcpd_id && currentPackageInfo?.details?.find((d) => d.id === detailForm.mcpd_id);

  if (selectedService && currentPackageInfo?.package) {
    const sessionPrice = selectedService.price * selectedService.discount;
    const remainingQty = selectedService.remaining_quantity;
    const currentBalance = currentPackageInfo.package.balance;

    if (sessionPrice > 0) {
      const maxByBalance = Math.floor(currentBalance / sessionPrice);
      effectiveMaxQuantity = Math.min(remainingQty, maxByBalance);
    } else {
      // If service is free, only limit by remaining quantity
      effectiveMaxQuantity = remainingQty;
    }
  }

  const handleServiceChange = (serviceDetailId) => {
    if (serviceDetailId) {
      selectServiceToConsume(serviceDetailId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    confirmConsumption();
  };

  // Handle employee commission assignments with memoization to prevent loops
  const handleAssignmentsChange = React.useCallback(
    (itemId, assignments) => {
      if (Array.isArray(assignments)) {
        setEmployeeCommissionAssignments(itemId, assignments);
      }
    },
    [setEmployeeCommissionAssignments]
  );

  // Check if we have employee assignments for the selected service
  const hasEmployeeAssignments = selectedServiceId && employeeCommissionAssignments[selectedServiceId]?.length > 0;

  return (
    <Card className='m-4'>
      <CardHeader>
        <CardTitle>Consume Service</CardTitle>
        <CardDescription>Select a service and quantity to consume.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='service' className='text-sm font-medium text-gray-700'>
              Service
            </Label>
            <Select
              value={detailForm.mcpd_id}
              onValueChange={handleServiceChange}
              disabled={isLoading || isSubmitting || consumableServices.length === 0}
            >
              <SelectTrigger id='service'>
                <SelectValue placeholder='Select a service' />
              </SelectTrigger>
              <SelectContent>
                {consumableServices.length > 0 ? (
                  consumableServices.map((detail) => (
                    <SelectItem key={detail.id} value={detail.id}>
                      {detail.service_name} (Rem: {detail.remaining_quantity})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='no-services' disabled>
                    No consumable services
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {detailForm.mcpd_id && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='quantity' className='text-sm font-medium text-gray-700'>
                  Quantity
                </Label>
                <Input
                  id='quantity'
                  type='number'
                  value={detailForm.mcpd_quantity}
                  onChange={(e) => updateDetailFormField('mcpd_quantity', e.target.value)}
                  min={-effectiveMaxQuantity}
                  max={-1}
                  disabled={isLoading || isSubmitting || effectiveMaxQuantity === 0}
                  required
                />
                {selectedService && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    Max consumable based on balance and stock: {effectiveMaxQuantity}
                  </p>
                )}
                {effectiveMaxQuantity === 0 && detailForm.mcpd_id && (
                  <p className='text-xs text-destructive mt-1'>
                    Cannot consume. Check remaining quantity or package balance.
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='consumptionDate' className='text-sm font-medium text-gray-700'>
                  Consumption date & time *
                </Label>
                <Input
                  id='consumptionDate'
                  type='datetime-local'
                  value={getFormattedDate('mcpd_date')}
                  onChange={(e) => updateDateField('mcpd_date', e.target.value)}
                  disabled={isLoading || isSubmitting}
                  step='1'
                  className='rounded-md'
                  required
                />
              </div>
            </>
          )}

          {selectedServiceId && (
            <div>
              <EmployeeCommissionSelect
                itemId={selectedServiceId}
                itemType={'package'}
                totalPrice={selectedServiceFinalPrice}
                onAssignmentsChange={handleAssignmentsChange}
                formatCurrency={(value) => `$${value.toFixed(2)}`}
                disabled={isLoading || isSubmitting}
              />
              {/* Add helper text to guide users */}
              <p className='text-xs text-blue-600 mt-1'>
                Please assign at least one employee who performed this service.
              </p>
            </div>
          )}

          <Button
            type='submit'
            className='w-full'
            disabled={
              isLoading ||
              isSubmitting ||
              !detailForm.mcpd_id ||
              !hasEmployeeAssignments || // Check for employee assignments instead of employee_id
              effectiveMaxQuantity === 0 ||
              parseInt(detailForm.mcpd_quantity, 10) >= 0
            }
          >
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Process Consumption
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberCarePackageConsumptionCreateForm;

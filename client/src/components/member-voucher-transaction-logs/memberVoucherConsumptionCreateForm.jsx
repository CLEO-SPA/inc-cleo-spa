import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import EmployeeCommissionSelect from '@/components/ui/forms/EmployeeCommissionSelect';
import useEmployeeCommissionStore from '@/stores/useEmployeeCommissionStore'; 

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';

const MemberVoucherConsumptionForm = () => {
  const { user } = useAuth();
  const {
    createFormFieldData,
    loading,
    selectedServiceId, // Used for EmployeeCommissionSelect
    // selectedServiceFinalPrice, // Used for EmployeeCommissionSelect

    updateCreateFormField,
    clearCreateFormData,
    setStoreFormData,
    setIsCreating,
    setIsConfirming,
  } = useMemberVoucherTransactionStore();

  const getCommissionAssignments = useEmployeeCommissionStore((state) => state.getCommissionAssignments);

  const handleInputChange = (field, value) => {
    updateCreateFormField(field, value);
  };

  // const handleSubmit = () => {
  //   // Get commission data from commission store
  //   const itemId = selectedServiceId || 'mv-consumption';
  //   const rawCommissionData = getCommissionAssignments(itemId);
    
  //   // Clean and structure commission data for API
  //   const cleanCommissionData = rawCommissionData?.map(assignment => ({
  //     employeeId: assignment.employeeId,
  //     employeeName: assignment.employeeName,
  //     performanceRate: assignment.performanceRate,
  //     performanceAmount: assignment.performanceAmount,
  //     commissionRate: assignment.commissionRate,
  //     commissionAmount: assignment.commissionAmount,
  //     remarks: assignment.remarks || '',
  //     itemType: 'member-voucher' 
  //   })) || [];

  //   // Create form data with cleaned commission data
  //   const formDataWithCommission = {
  //     consumptionValue: createFormFieldData.consumptionValue,
  //     remarks: createFormFieldData.remarks,
  //     date: createFormFieldData.date,
  //     time: createFormFieldData.time,
  //     type: createFormFieldData.type,
  //     createdBy: createFormFieldData.createdBy,
  //     handledBy: createFormFieldData.handledBy,
  //     assignedEmployee: cleanCommissionData 
  //   };

  //   if (setStoreFormData(formDataWithCommission)) {
  //     setIsCreating(true);
  //     setIsConfirming(true);
  //   }
  // };

  const handleSubmit = () => {
    // Get and clean commission data
    const itemId = selectedServiceId || 'mv-consumption';
    const rawCommissionData = getCommissionAssignments(itemId);
    
    const assignedEmployee = rawCommissionData?.map(({ 
      employeeId, 
      employeeName, 
      performanceRate, 
      performanceAmount, 
      commissionRate, 
      commissionAmount, 
      remarks = '' 
    }) => ({
      employeeId,
      employeeName,
      performanceRate,
      performanceAmount,
      commissionRate,
      commissionAmount,
      remarks,
      itemType: 'member-voucher'
    })) || [];

    // Submit form data with commission
    const formData = {
      ...createFormFieldData,
      assignedEmployee
    };

    if (setStoreFormData(formData)) {
      setIsCreating(true);
      setIsConfirming(true);
    }
  };

  const handleClear = () => {
    clearCreateFormData();
  };

  const canAdd = user?.role === 'super_admin' || user?.role === 'data_admin';
  const consumptionValue = parseFloat(createFormFieldData.consumptionValue) || 0;

  return (
    <div className='max-h-130 overflow-y-auto bg-gray mr-5 my-2 rounded-lg'>
      <div className='space-y-4'>
        <div>
          <Label htmlFor='consumptionValue' className='block mb-2'>
            Consumption value
          </Label>
          <Input
            id='consumptionValue'
            type={'number'}
            value={createFormFieldData.consumptionValue}
            onChange={(e) => handleInputChange('consumptionValue', e.target.value)}
            placeholder='Enter consumption value'
          />
        </div>

        <div>
          <Label htmlFor='remarks' className='block mb-2'>
            Remarks
          </Label>
          <textarea
            id='remarks'
            className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none'
            value={createFormFieldData.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            placeholder='Enter remarks'
          />
          {consumptionValue > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              Commission will be calculated based on $${consumptionValue.toFixed(2)} consumption
            </div>
          )}
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Label htmlFor='date' className='block mb-2'>
              Date
            </Label>
            <Input
              id='date'
              type='date'
              value={createFormFieldData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='time' className='block mb-2'>
              Time
            </Label>
            <Input
              id='time'
              type='time'
              value={createFormFieldData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className='w-full'
            />
          </div>
        </div>

        <div>
          <Label htmlFor='type' className='block mb-2'>
            Type
          </Label>
          <Select value={createFormFieldData.type} onValueChange={(value) => handleInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder='Select type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='CONSUMPTION'>Consumption</SelectItem>
              <SelectItem value='FOC'>Free Of Charge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <EmployeeSelect
            label='Created By'
            value={createFormFieldData.createdBy}
            onChange={(value) => handleInputChange('createdBy', value)}
            disabled={loading}
          />
        </div>

        <div>
          <EmployeeSelect
            label='Handled By'
            value={createFormFieldData.handledBy}
            onChange={(value) => handleInputChange('handledBy', value)}
            disabled={loading}
          />
        </div>

        <EmployeeCommissionSelect
          itemId={selectedServiceId}
          itemType={'mvConsumption'}
          totalPrice={consumptionValue}
          formatCurrency={(value) => `$${value.toFixed(2)}`}
          disabled={consumptionValue <= 0}
        />

        {/* ✅ Show warning if no consumption value */}
        {consumptionValue <= 0 && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
            Please enter a consumption value to calculate employee commissions
          </div>
        )}

        <div className='flex gap-2 py-4'>
          <Button variant='outline' onClick={handleClear} className='flex-1'>
            Clear
          </Button>
          <Button onClick={handleSubmit} className='flex-1' disabled={!canAdd}>
            Submit
          </Button>
        </div>
        {!canAdd && (
          <p className='text-sm text-muted-foreground mt-2'>You don't have permission to create transactions</p>
        )}
      </div>
    </div>
  );
};

export default MemberVoucherConsumptionForm;

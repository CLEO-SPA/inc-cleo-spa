import { Controller, useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import { cn } from '@/lib/utils';

export function PaymentMethodSelect({
  name = 'payment_method_id',
  label = 'Payment Method *',
  disabled: customDisabled = false,
  className = '',
  // Optional props for standalone usage
  control: controlProp,
  onChange: onChangeProp,
  value: valueProp,
  errors: errorsProp,
}) {
  // Try to get form context, but handle gracefully if not available
  const formContext = useFormContext();

  // Use passed props or fall back to form context
  const control = controlProp || formContext?.control;
  const errors = errorsProp || formContext?.formState?.errors || {};

  const paymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
  const loading = usePaymentMethodStore((state) => state.loading);
  const error = usePaymentMethodStore((state) => state.error);
  const errorMessage = usePaymentMethodStore((state) => state.errorMessage);
  const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // Add flag to prevent infinite loops

  const filteredPaymentMethods = paymentMethods.filter(
    (pm) => pm?.payment_method_name && pm.payment_method_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (paymentMethods.length === 0 && !loading && !hasFetched) {
      setHasFetched(true);
      fetchDropdownPaymentMethods();
    }
  }, [paymentMethods.length, loading, hasFetched, fetchDropdownPaymentMethods]);

  // If no control available from either prop or context, show error
  if (!control && !onChangeProp) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label className='text-sm font-medium text-red-500'>
          PaymentMethodSelect Error: Must be used within a form context or provide control/onChange props
        </Label>
      </div>
    );
  }

  // Render with Controller if we have control (form context usage)
  if (control) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
          {label}
        </Label>

        <Controller
          name={name}
          control={control}
          rules={{ required: `${label} is required` }}
          render={({ field }) => (
            <div className='relative'>
              <Select
                disabled={loading || error || customDisabled}
                value={field.value?.toString() || ''}
                onValueChange={(val) => {
                  field.onChange(Number(val));
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                open={isOpen}
                onOpenChange={setIsOpen}
              >
                <SelectTrigger className={cn('w-full', errors[name] ? 'border-red-500' : '')}>
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Loading payment methods...'
                        : error
                        ? 'Error loading payment methods'
                        : 'Select payment method'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <div className='p-2 border-b'>
                    <Input
                      placeholder='Search payment methods...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='h-8'
                    />
                  </div>

                  <div className='max-h-48 overflow-y-auto'>
                    {filteredPaymentMethods.length > 0 ? (
                      filteredPaymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id.toString()}>
                          {pm.payment_method_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='p-2 text-sm text-gray-500'>No payment methods found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
        {error && <p className='text-red-500 text-xs'>Failed to load payment methods: {errorMessage}</p>}
      </div>
    );
  }

  // Render standalone version if onChange prop is provided
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
        {label}
      </Label>

      <div className='relative'>
        <Select
          disabled={loading || error || customDisabled}
          value={valueProp?.toString() || ''}
          onValueChange={(val) => {
            onChangeProp?.(Number(val));
            setIsOpen(false);
            setSearchTerm('');
          }}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger className={cn('w-full', errors[name] ? 'border-red-500' : '')}>
            <SelectValue
              placeholder={
                loading
                  ? 'Loading payment methods...'
                  : error
                  ? 'Error loading payment methods'
                  : 'Select payment method'
              }
            />
          </SelectTrigger>

          <SelectContent>
            <div className='p-2 border-b'>
              <Input
                placeholder='Search payment methods...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='h-8'
              />
            </div>

            <div className='max-h-48 overflow-y-auto'>
              {filteredPaymentMethods.length > 0 ? (
                filteredPaymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>
                    {pm.payment_method_name}
                  </SelectItem>
                ))
              ) : (
                <div className='p-2 text-sm text-gray-500'>No payment methods found</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
      {error && <p className='text-red-500 text-xs'>Failed to load payment methods: {errorMessage}</p>}
    </div>
  );
}

export default PaymentMethodSelect;

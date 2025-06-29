import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FormDateTimePicker({ label, name, date, onDateChange, optional = false }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const hasError = errors[name];

  // Format input value safely
  const formattedDate = date
    ? typeof date === 'string'
      ? format(parseISO(date), 'yyyy-MM-dd')
      : format(date, 'yyyy-MM-dd')
    : '';

  return (
    <div className='grid grid-cols-4 items-center gap-2'>
      <Label className='col-span-1'>{label}</Label>
      <div className='col-span-3'>
        <Controller
          name={name}
          control={control}
          rules={{ required: optional ? false : 'is required' }}
          render={({ field }) => (
            <Input
              type='date'
              className={`w-[180px] ${hasError ? 'border-red-500' : ''}`}
              value={formattedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const selected = new Date(val);
                  field.onChange(selected.toISOString());
                  onDateChange?.(selected);
                } else {
                  field.onChange('');
                  onDateChange?.(null);
                }
              }}
            />
          )}
        />
        {hasError && <p className='text-red-500 text-xs mt-1'>{errors[name]?.message}</p>}
      </div>
    </div>
  );
}

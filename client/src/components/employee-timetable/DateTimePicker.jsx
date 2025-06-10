import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/calendar';

export default function DateTimePicker({
  label,
  name,
  date,
  time,
  onDateChange,
  onTimeChange,
  optional = false,
}) {
  const { control, formState: { errors } } = useFormContext();
  const hasError = errors[name];

  return (
    <div className='grid grid-cols-4 items-center gap-2'>
      <Label className='col-span-1'>{label}</Label>
      <div className='col-span-3 flex gap-2 items-center'>
        <Controller
          name={name}
          control={control}
          rules={{ required: optional ? false : `is required` }}
          render={({ field }) => (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={`w-[180px] text-left ${hasError ? 'border-red-500' : ''}`}
                  >
                    {date ? format(date, 'yyyy-MM-dd') : <span>Select Date</span>}
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar mode='single' selected={date} onSelect={(selectedDate) => {
                    field.onChange(selectedDate); 
                    onDateChange(selectedDate);
                  }} />
                </PopoverContent>
              </Popover>

              {typeof time !== 'undefined' && onTimeChange && (
                <Input
                  type='time'
                  className={`w-[180px] ${hasError ? 'border-red-500' : ''}`}
                  value={time}
                  onChange={(e) => {
                    field.onChange(e.target.value); 
                    onTimeChange(e.target.value);
                  }}
                />
              )}
            </>
          )}
        />

        {hasError && (
          <p className="text-red-500 text-xs mt-1">{errors[name].message}</p> 
        )}
      </div>
    </div>
  );
}

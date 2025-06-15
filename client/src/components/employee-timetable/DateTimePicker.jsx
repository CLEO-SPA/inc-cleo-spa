import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/calendar';

export default function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  error,
  optional = false,
}) {
  return (
    <div className='grid grid-cols-4 items-center gap-2'>
      <Label className='col-span-1'>{label}</Label>
      <div className='col-span-3 flex gap-2 items-center'>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={`w-[180px] text-left ${error ? 'border-red-500' : ''}`}
            >
              {date ? format(new Date(date), 'yyyy-MM-dd') : <span>Select Date</span>}
              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={(selectedDate) => onDateChange(selectedDate)}
            />
          </PopoverContent>
        </Popover>

        {typeof time !== 'undefined' && onTimeChange && (
          <Input
            type='time'
            className={`w-[180px] ${error ? 'border-red-500' : ''}`}
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

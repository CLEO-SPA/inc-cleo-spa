import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RestDaySelect({ value, onChange }) {
  return (
    <div className='grid grid-cols-4 items-center gap-2'>
      <Label className='col-span-1'>New Rest Day*</Label>
      <div className='col-span-3'>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className='min-w-[180px]'>
            <SelectValue placeholder='Select Day' />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

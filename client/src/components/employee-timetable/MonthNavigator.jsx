// client/src/components/employee-timetable/MonthNavigator.jsx
import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DateTimePicker from '../employee-timetable/DateTimePicker';
import useTimetableStore from '../../stores/useTimetableStore';

export default function MonthNavigator() {
  const {
    currentMonth,
    setCurrentMonth,
    loadTimetableData,
    loading
  } = useTimetableStore();

  const handlePreviousMonth = async () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    await loadTimetableData(newMonth);
  };

  const handleNextMonth = async () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    await loadTimetableData(newMonth);
  };

  const handleDateChange = async (newDate) => {
    if (newDate) {
      // Set to first day of the selected month
      const monthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setCurrentMonth(monthStart);
      await loadTimetableData(monthStart);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Previous Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        disabled={loading.timetable}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Month Display with Date Picker */}
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold text-center min-w-[200px]">
          {format(currentMonth, 'MMMM yyyy').toUpperCase()}
        </div>
        
        {/* Date Picker for Month Selection */}
        <div className="ml-4">
          <DateTimePicker
            label=""
            date={currentMonth}
            onDateChange={handleDateChange}
            // No time picker needed
            time={undefined}
            onTimeChange={undefined}
          />
        </div>
      </div>

      {/* Next Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        disabled={loading.timetable}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
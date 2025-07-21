// client/src/components/employee-timetable/MonthNavigator.jsx
import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthYearPicker from './MonthYearPicker';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';

export default function MonthNavigator() {
  const {
    currentMonth,
    setCurrentMonth,
    loadTimetableData,
    loading
  } = useEmployeeTimetableStore();

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

  const handleMonthYearChange = async (selectedDate) => {
    if (selectedDate) {
      // selectedDate is already set to first day of the selected month
      setCurrentMonth(selectedDate);
      await loadTimetableData(selectedDate);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Previous Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        disabled={loading.timetable}
        className="flex items-center gap-1 px-3"
      >
        <ChevronLeft className="h-3 w-3" />
        Previous
      </Button>

      {/* Month Display */}
      <div className="text-base font-semibold text-center min-w-[140px] px-2">
        {format(currentMonth, 'MMMM yyyy').toUpperCase()}
      </div>

      {/* Month/Year Picker */}
      <div className="flex-shrink-0">
        <MonthYearPicker
          value={currentMonth}
          onSelect={handleMonthYearChange}
          disabled={loading.timetable}
          placeholder="Select Month"
        />
      </div>

      {/* Next Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        disabled={loading.timetable}
        className="flex items-center gap-1 px-3"
      >
        Next
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
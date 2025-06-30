import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthYearPicker({
  value, // Current selected date
  onSelect, // Callback when month/year is selected
  disabled = false,
  placeholder = "Select Month",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Handle year navigation
  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  // Handle month selection
  const handleMonthSelect = (monthIndex) => {
    // Create date object for first day of selected month/year
    const selectedDate = new Date(selectedYear, monthIndex, 1);
    onSelect(selectedDate);
    setIsOpen(false);
  };

  // Check if a month is the currently selected one
  const isSelectedMonth = (monthIndex) => {
    if (!value) return false;
    return value.getFullYear() === selectedYear && value.getMonth() === monthIndex;
  };

  // Check if a month is the current month (today)
  const isCurrentMonth = (monthIndex) => {
    return currentYear === selectedYear && currentMonth === monthIndex;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[180px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousYear}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-medium">
              {selectedYear}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextYear}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => (
              <Button
                key={month}
                variant="ghost"
                size="sm"
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  "h-9 text-xs font-normal justify-center",
                  isSelectedMonth(index) && 
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isCurrentMonth(index) && !isSelectedMonth(index) && 
                    "bg-accent text-accent-foreground"
                )}
              >
                {month.substring(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
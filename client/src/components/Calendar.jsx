import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Calendar = ({
  selectedDate,
  onDateSelect,
  className = '',
  placeholder = 'Pick a date'
}) => {
  const today = new Date();
  const [displayedMonth, setDisplayedMonth] = useState(today.getMonth());
  const [displayedYear, setDisplayedYear] = useState(today.getFullYear());
  const [isOpen, setIsOpen] = useState(false);

  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayedYear, displayedMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    if (displayedMonth === 0) {
      setDisplayedMonth(11);
      setDisplayedYear(displayedYear - 1);
    } else {
      setDisplayedMonth(displayedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayedMonth === 11) {
      setDisplayedMonth(0);
      setDisplayedYear(displayedYear + 1);
    } else {
      setDisplayedMonth(displayedMonth + 1);
    }
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    return (
      date === selectedDate.getDate() &&
      displayedMonth === selectedDate.getMonth() &&
      displayedYear === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    if (!date) return;
    const newDate = new Date(displayedYear, displayedMonth, date);
    onDateSelect(newDate);
    setIsOpen(false);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-start rounded-md border border-gray-600 bg-[#333333] px-3 py-2 text-left text-sm font-normal hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-blue-500',
            !selectedDate ? 'text-gray-400' : 'text-white',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : placeholder}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-auto rounded-md border border-gray-600 bg-[#333333] p-0 shadow-md outline-none"
          align="start"
          sideOffset={4}
        >
          <div className="w-full max-w-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[#404040] rounded-md text-gray-300 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {months[displayedMonth]} {displayedYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[#404040] rounded-md text-gray-300 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={!day}
                  className={`
                    p-2 text-sm rounded-md transition-colors
                    ${!day ? 'invisible' : ''}
                    ${isSelectedDate(day)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-300 hover:bg-[#404040]'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default Calendar;
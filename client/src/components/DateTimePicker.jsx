import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const DateTimePicker = ({
  selectedDateTime,
  onDateTimeSelect,
  className = '',
  placeholder = 'Pick a date and time'
}) => {
  const today = new Date();
  const [displayedMonth, setDisplayedMonth] = useState(today.getMonth());
  const [displayedYear, setDisplayedYear] = useState(today.getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(selectedDateTime ? selectedDateTime.getHours() : 0);
  const [minutes, setMinutes] = useState(selectedDateTime ? selectedDateTime.getMinutes() : 0);

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
    if (!date || !selectedDateTime) return false;
    return (
      date === selectedDateTime.getDate() &&
      displayedMonth === selectedDateTime.getMonth() &&
      displayedYear === selectedDateTime.getFullYear()
    );
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date === today.getDate() &&
      displayedMonth === today.getMonth() &&
      displayedYear === today.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    if (!date) return;
    const newDate = new Date(displayedYear, displayedMonth, date, hours, minutes);
    onDateTimeSelect(newDate);
  };

  const handleTimeChange = (newHours, newMinutes) => {
    const updatedHours = Math.max(0, Math.min(23, newHours));
    const updatedMinutes = Math.max(0, Math.min(59, newMinutes));
    
    setHours(updatedHours);
    setMinutes(updatedMinutes);

    if (selectedDateTime) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(updatedHours);
      newDateTime.setMinutes(updatedMinutes);
      onDateTimeSelect(newDateTime);
    }
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
            'flex w-full items-center justify-start rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
            !selectedDateTime ? 'text-gray-500' : 'text-gray-900',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          {selectedDateTime 
            ? format(selectedDateTime, 'MMMM dd, yyyy HH:mm') 
            : placeholder}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-lg border border-gray-200 bg-white p-0 shadow-lg outline-none"
          align="start"
          sideOffset={4}
        >
          <div className="flex">
            {/* Left Column - Calendar */}
            <div className="w-72 p-5 border-r border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-base font-semibold text-gray-900">
                  {months[displayedMonth]} {displayedYear}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-2"
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
                    className={cn(
                      'h-9 text-sm rounded-lg transition-colors disabled:opacity-0',
                      isSelectedDate(day) && 'bg-blue-600 text-white hover:bg-blue-700',
                      isToday(day) && !isSelectedDate(day) && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                      !isSelectedDate(day) && !isToday(day) && day && 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Time Selection */}
            <div className="w-52 p-5">
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  Time
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={hours}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseInt(value);
                          if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 23)) {
                            handleTimeChange(value === '' ? 0 : numValue, minutes);
                          }
                        }}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center text-xl font-medium text-gray-400 pb-2.5">:</div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseInt(value);
                          if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 59)) {
                            handleTimeChange(hours, value === '' ? 0 : numValue);
                          }
                        }}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {selectedDateTime && (
                  <div className="pt-2 text-sm text-gray-500 flex items-center justify-center border-t border-gray-100">
                    Selected: {format(selectedDateTime, 'HH:mm')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default DateTimePicker;
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/calendar'; // Your custom calendar
import { format, addMonths, startOfMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

export default function DateRangePicker({
  className,
  value, // Expects { from: Date | undefined, to: Date | undefined }
  onValueChange,
  minDate,
  maxDate,
  disabledMatcher,
  // numberOfMonths prop is no longer used here, as we render two single calendars
  isLoading = false,
  popoverOpen,
  onPopoverOpenChange,
  footerContent,
  triggerClassName,
}) {
  const initialMonth1 = React.useMemo(() => startOfMonth(value?.from || minDate || new Date()), [value?.from, minDate]);

  const initialMonth2 = React.useMemo(() => {
    let month2Start = startOfMonth(value?.to || addMonths(initialMonth1, 1));
    // Ensure month2 is not the same as month1 if derived from addMonths
    if (
      value?.to &&
      value.to.getFullYear() === initialMonth1.getFullYear() &&
      value.to.getMonth() === initialMonth1.getMonth()
    ) {
      month2Start = startOfMonth(addMonths(initialMonth1, 1));
    } else if (!value?.to && month2Start.getTime() === initialMonth1.getTime()) {
      month2Start = startOfMonth(addMonths(initialMonth1, 1));
    }
    // Clamp month2 with maxDate
    if (maxDate && month2Start > maxDate) {
      month2Start = startOfMonth(maxDate);
      // If clamping makes it same or before month1, adjust month1
      if (month2Start <= initialMonth1) {
        // This scenario is complex, ideally minDate/maxDate prevent impossible ranges
        // For now, let it be, or adjust month1 further back if possible
      }
    }
    return month2Start;
  }, [value?.to, initialMonth1, maxDate]);

  const [month1, setMonth1] = React.useState(initialMonth1);
  const [month2, setMonth2] = React.useState(initialMonth2);

  // Effect to reset months when popover opens or global value changes significantly
  React.useEffect(() => {
    if (popoverOpen) {
      const newInitialMonth1 = startOfMonth(value?.from || minDate || new Date());
      setMonth1(newInitialMonth1);

      let newInitialMonth2 = startOfMonth(value?.to || addMonths(newInitialMonth1, 1));
      if (
        value?.to &&
        value.to.getFullYear() === newInitialMonth1.getFullYear() &&
        value.to.getMonth() === newInitialMonth1.getMonth()
      ) {
        newInitialMonth2 = startOfMonth(addMonths(newInitialMonth1, 1));
      } else if (!value?.to && newInitialMonth2.getTime() === newInitialMonth1.getTime()) {
        newInitialMonth2 = startOfMonth(addMonths(newInitialMonth1, 1));
      }
      if (maxDate && newInitialMonth2 > maxDate) newInitialMonth2 = startOfMonth(maxDate);
      // Basic guard: if month2 ends up before or same as month1, try to adjust it one month after month1
      if (newInitialMonth2 <= newInitialMonth1) {
        newInitialMonth2 = startOfMonth(addMonths(newInitialMonth1, 1));
        if (maxDate && newInitialMonth2 > maxDate) newInitialMonth2 = startOfMonth(maxDate); // Re-clamp
      }
      setMonth2(newInitialMonth2);
    }
  }, [popoverOpen, value, minDate, maxDate]);

  const handleSelect = (selectedDateRange) => {
    if (onValueChange) {
      onValueChange(selectedDateRange);
    }
  };

  const displayFrom = value?.from;
  const displayTo = value?.to;

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant='outline'
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value?.from && 'text-muted-foreground',
              triggerClassName
            )}
            disabled={isLoading}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {isLoading ? (
              <span>Loading dates...</span>
            ) : displayFrom ? (
              displayTo && displayFrom.getTime() !== displayTo.getTime() ? (
                <>
                  {format(displayFrom, 'LLL dd, y')} - {format(displayTo, 'LLL dd, y')}
                </>
              ) : (
                format(displayFrom, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='flex flex-col sm:flex-row'>
            {' '}
            {/* Arrange calendars side-by-side */}
            <Calendar
              mode='range'
              selected={value}
              onSelect={handleSelect}
              externalMonth={month1} // Control this calendar's month
              externalOnMonthChange={setMonth1} // Update month1 when this calendar navigates
              externalDefaultMonth={initialMonth1} // Initial hint
              fromDate={minDate}
              toDate={maxDate}
              disabled={disabledMatcher}
              initialNumberOfMonths={1} // Explicitly 1
              // To prevent month2 from being before month1 via navigation,
              // you could adjust maxDate for calendar1 based on month2,
              // and minDate for calendar2 based on month1.
              // For example, for Calendar 1: toDate={maxDate < month2 ? maxDate : month2}
              // This adds complexity and might fight with user's free navigation.
              // For now, we allow them to be independent as per the request.
            />
            <Calendar
              mode='range'
              selected={value}
              onSelect={handleSelect}
              externalMonth={month2} // Control this calendar's month
              externalOnMonthChange={setMonth2} // Update month2 when this calendar navigates
              externalDefaultMonth={initialMonth2} // Initial hint
              fromDate={minDate}
              toDate={maxDate}
              disabled={disabledMatcher}
              initialNumberOfMonths={1} // Explicitly 1
            />
          </div>
          {footerContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}

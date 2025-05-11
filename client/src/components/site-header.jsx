import { SidebarIcon, Calendar as CalendarIcon } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useDateRange } from '@/context/DateRangeContext';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { dateRange, setDateRange, isLoading: isDateRangeLoading } = useDateRange();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localCalendarRange, setLocalCalendarRange] = useState(dateRange);

  useEffect(() => {
    setLocalCalendarRange(dateRange);
  }, [dateRange]);

  const handleApplyDateRange = () => {
    let { from, to } = localCalendarRange;

    if (from) {
      if (!to) {
        to = new Date();
      }

      if (from > to) {
        alert('Start date cannot be after end date. Please correct the selection.');
        return;
      }

      console.log(`Applying date range: From: ${from.toISOString()}, To: ${to.toISOString()}`);
      setDateRange({ from, to });
      setIsPopoverOpen(false);
    } else {
      alert('Please select a start date.');
    }
  };

  if (isDateRangeLoading) {
    // Optional: Show a loading state for the date picker button
  }

  return (
    <header className='bg-background sticky top-0 z-50 flex w-full items-center border-b'>
      <div className='flex h-(--header-height) w-full items-center gap-2 px-4'>
        <Button className='h-8 w-8' variant='ghost' size='icon' onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb className='hidden sm:block'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='#'>Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className='ml-auto flex items-center gap-3'>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id='date'
                variant={'outline'}
                className={`w-[260px] justify-start text-left font-normal ${
                  !localCalendarRange.from && 'text-muted-foreground'
                }`}
                disabled={isDateRangeLoading}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {isDateRangeLoading ? (
                  <span>Loading dates...</span>
                ) : localCalendarRange.from ? (
                  localCalendarRange.to ? (
                    <>
                      {format(localCalendarRange.from, 'LLL dd, y')} - {format(localCalendarRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(localCalendarRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='end'>
              <Calendar
                initialFocus
                mode='range'
                defaultMonth={localCalendarRange.from || new Date()}
                selected={localCalendarRange}
                onSelect={(selected) => {
                  if (selected) {
                    setLocalCalendarRange(selected);
                  } else {
                    setLocalCalendarRange({ from: undefined, to: undefined });
                  }
                }}
                numberOfMonths={2}
              />
              <div className='p-3 border-t border-border'>
                <Button onClick={handleApplyDateRange} size='sm' className='w-full'>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}

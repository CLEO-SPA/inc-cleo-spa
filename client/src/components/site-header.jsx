import { SidebarIcon, Calendar as CalendarIcon } from 'lucide-react'; // CalendarIcon is still used by DateRangePicker trigger
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/date-range-picker';
import { useDateRange } from '@/context/DateRangeContext';
import { useSimulationStore } from '@/stores/useSimulationStore';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { dateRange, setDateRange, isLoading: isDateRangeLoading } = useDateRange();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localCalendarRange, setLocalCalendarRange] = useState(dateRange);

  // Get simulation state and actions from Zustand store
  const { isSimulationActive, simulationStartDate, simulationEndDate, isLoadingSimulation, fetchSimulationConfig } =
    useSimulationStore();

  useEffect(() => {
    const storeState = useSimulationStore.getState();
    if (!storeState.isLoadingSimulation && !storeState.simulationStartDate && !storeState.isSimulationActive) {
      fetchSimulationConfig();
    }
  }, [fetchSimulationConfig]); // Dependency array ensures this runs once on mount or if fetchSimulationConfig changes

  useEffect(() => {
    // When the popover opens, or the global dateRange changes, reset localCalendarRange
    if (isPopoverOpen) {
      setLocalCalendarRange(dateRange);
    }
  }, [dateRange, isPopoverOpen]);

  const handleClearDateRangeInParent = () => {
    setLocalCalendarRange({ from: undefined, to: undefined });
  };

  const handleApplyDateRangeInParent = () => {
    let { from, to } = localCalendarRange;

    // If 'from' is undefined, it means the user intends to clear the date range.
    if (!from) {
      console.log('Applying cleared date range.');
      // Ensure 'to' is also undefined if 'from' is undefined.
      // localCalendarRange should be { from: undefined, to: undefined }
      // if set correctly by the onSelect handler when clearing.
      setDateRange({ from: undefined, to: undefined });
      setIsPopoverOpen(false);
      return;
    }

    // Proceed with existing logic if 'from' is defined
    if (!to) {
      to = from; // Default 'to' if only 'from' is selected
    }

    if (from > to) {
      alert('Start date cannot be after end date. Please correct the selection.');
      return;
    }

    if (isSimulationActive && simulationStartDate && simulationEndDate) {
      if (from < simulationStartDate || (to && to > simulationEndDate)) {
        alert('Selected date range is outside the allowed simulation period.');
        return;
      }
    }

    if (!isSimulationActive) {
      const today = new Date();
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      if (to && to > endOfToday) {
        console.warn('Attempted to apply a future end date when not in simulation mode. Clamping to today.');
        to = endOfToday;
      }
      if (from > endOfToday) {
        alert('Start date cannot be in the future when not in simulation mode.');
        return;
      }
    }

    console.log(`Applying date range: From: ${from.toISOString()}, To: ${to.toISOString()}`);
    setDateRange({ from, to });
    setIsPopoverOpen(false);
  };

  // Determine calendar restrictions based on simulation mode
  let calendarFromDate = undefined;
  let calendarToDate = undefined;
  // eslint-disable-next-line no-unused-vars
  let disabledDateMatcher = (date) => false; // Default: no dates disabled

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!isSimulationActive) {
    // Scenario 1: Simulation OFF - Cannot select future dates
    calendarToDate = startOfToday; // Users can select up to and including today
    disabledDateMatcher = (date) => {
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return day > startOfToday;
    };
  } else {
    // Simulation is ON
    if (simulationStartDate && simulationEndDate) {
      // Scenario 3: Simulation ON with a defined range
      calendarFromDate = simulationStartDate;
      calendarToDate = simulationEndDate;
      disabledDateMatcher = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        // Ensure comparison is against the start of the simulationStartDate
        // and potentially the end of simulationEndDate if time precision matters.
        // For day-level disabling, comparing dates directly is usually fine.
        return (
          day <
            new Date(
              simulationStartDate.getFullYear(),
              simulationStartDate.getMonth(),
              simulationStartDate.getDate()
            ) ||
          day > new Date(simulationEndDate.getFullYear(), simulationEndDate.getMonth(), simulationEndDate.getDate())
        );
      };
    } else {
      // Scenario 2: Simulation ON, no specific range defined for simulation
      // No additional restrictions beyond default calendar behavior
    }
  }

  const overallIsLoading = isDateRangeLoading || isLoadingSimulation;

  const pickerFooterContent = (
    <div className='p-3 border-t border-border space-y-2'>
      <Button
        onClick={handleClearDateRangeInParent}
        size='sm'
        variant='ghost'
        className='w-full'
        disabled={overallIsLoading || (!localCalendarRange.from && !localCalendarRange.to)}
      >
        Clear
      </Button>
      <Button onClick={handleApplyDateRangeInParent} size='sm' className='w-full' disabled={overallIsLoading}>
        Apply
      </Button>
    </div>
  );

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
          <DateRangePicker
            value={localCalendarRange}
            onValueChange={setLocalCalendarRange}
            minDate={calendarFromDate}
            maxDate={calendarToDate}
            disabledMatcher={disabledDateMatcher}
            isLoading={overallIsLoading}
            popoverOpen={isPopoverOpen}
            onPopoverOpenChange={setIsPopoverOpen}
            footerContent={pickerFooterContent}
            triggerClassName='w-[260px]' // Maintain original trigger width from SiteHeader
            // numberOfMonths={2} // Default is 2 in the new component
          />
        </div>
      </div>
    </header>
  );
}

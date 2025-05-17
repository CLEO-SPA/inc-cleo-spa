import { SidebarIcon, Calendar as CalendarIcon, Wand2, AlertTriangle } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/date-range-picker';
import { useDateRange } from '@/context/DateRangeContext';
import { useSimulationStore } from '@/stores/useSimulationStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useAuth from '@/hooks/useAuth';
import { format } from 'date-fns';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const {
    dateRange: globalDateRange,
    setDateRange: setGlobalDateRange,
    isLoading: isDateRangeLoading,
  } = useDateRange();
  const [isGlobalDatePickerPopoverOpen, setIsGlobalDatePickerPopoverOpen] = useState(false);
  const [localCalendarRange, setLocalCalendarRange] = useState(globalDateRange);

  const { user } = useAuth();

  const {
    isSimulationActive,
    simulationStartDate,
    simulationEndDate,
    isLoadingSimulation,
    fetchSimulationConfig,
    toggleSimulationStatus,
    initialLoadDone,
  } = useSimulationStore();

  const [isSimPopoverOpen, setIsSimPopoverOpen] = useState(false);
  const [simDateRange, setSimDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    // Fetch initial simulation config only if not already loading and not done before
    if (!isLoadingSimulation && !initialLoadDone) {
      fetchSimulationConfig();
    }
  }, [fetchSimulationConfig, isLoadingSimulation, initialLoadDone]);

  useEffect(() => {
    if (isGlobalDatePickerPopoverOpen) {
      setLocalCalendarRange(globalDateRange);
    }
  }, [globalDateRange, isGlobalDatePickerPopoverOpen]);

  // Update local sim date range when global simulation state changes or popover opens
  useEffect(() => {
    if (isSimPopoverOpen || !isSimPopoverOpen) {
      // Sync always if popover closed, or on open
      setSimDateRange({
        from: simulationStartDate || undefined,
        to: simulationEndDate || undefined,
      });
    }
  }, [simulationStartDate, simulationEndDate, isSimPopoverOpen]);

  const handleGlobalDateSelect = (range) => {
    setLocalCalendarRange(range);
  };

  const handleClearDateRangeInParent = () => {
    setLocalCalendarRange({ from: undefined, to: undefined });
  };

  const handleApplyDateRangeInParent = () => {
    let { from, to } = localCalendarRange;
    if (!from) {
      setGlobalDateRange({ from: undefined, to: undefined });
      setIsGlobalDatePickerPopoverOpen(false);
      return;
    }
    if (!to) to = from;
    if (from > to) {
      alert('Start date cannot be after end date. Please correct the selection.');
      return;
    }
    // Add existing validation logic for global date picker if any
    setGlobalDateRange({ from, to });
    setIsGlobalDatePickerPopoverOpen(false);
  };

  const handleSimDateSelect = (range) => {
    setSimDateRange(range);
  };

  const handleActivateOrUpdateSimulation = async () => {
    if (!simDateRange.from || !simDateRange.to) {
      alert('Please select both a start and end date for simulation.');
      return;
    }
    if (simDateRange.from > simDateRange.to) {
      alert('Simulation start date cannot be after end date.');
      return;
    }
    await toggleSimulationStatus(true, simDateRange.from, simDateRange.to);
    setIsSimPopoverOpen(false);
  };

  const handleDeactivateSimulation = async () => {
    await toggleSimulationStatus(false, null, null);
    setIsSimPopoverOpen(false);
  };

  const canManageSimulation = user && (user.role === 'super_admin' || user.role === 'data_admin');

  let calendarFromDateForGlobalPicker = undefined;
  let calendarToDateForGlobalPicker = undefined;
  // eslint-disable-next-line no-unused-vars
  let disabledDateMatcherForGlobalPicker = (date) => false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!isSimulationActive) {
    calendarToDateForGlobalPicker = startOfToday;
    disabledDateMatcherForGlobalPicker = (date) => {
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return day > startOfToday;
    };
  } else {
    if (simulationStartDate && simulationEndDate) {
      calendarFromDateForGlobalPicker = simulationStartDate;
      calendarToDateForGlobalPicker = simulationEndDate;
      disabledDateMatcherForGlobalPicker = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const simStartDay = new Date(
          simulationStartDate.getFullYear(),
          simulationStartDate.getMonth(),
          simulationStartDate.getDate()
        );
        const simEndDay = new Date(
          simulationEndDate.getFullYear(),
          simulationEndDate.getMonth(),
          simulationEndDate.getDate()
        );
        return day < simStartDay || day > simEndDay;
      };
    }
  }
  const overallIsLoading = isDateRangeLoading || isLoadingSimulation;

  const globalPickerFooterContent = (
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

  const SimulationAnnouncementBar = () => {
    if (!isSimulationActive) return null;
    return (
      <div className='bg-yellow-400 border-b border-yellow-500 text-yellow-900 p-2 text-center text-xs sm:text-sm flex items-center justify-center sticky top-0 z-[60]'>
        <AlertTriangle className='h-4 w-4 mr-1 sm:mr-2 shrink-0' />
        <span>
          System is in Simulation Mode. Date Range from{' '}
          <strong>{simulationStartDate ? format(simulationStartDate, 'PPP') : 'N/A'}</strong> to{' '}
          <strong>{simulationEndDate ? format(simulationEndDate, 'PPP') : 'N/A'}</strong>.
        </span>
      </div>
    );
  };

  return (
    <>
      <SimulationAnnouncementBar />
      <header
        className={`bg-background sticky z-50 flex w-full items-center border-b ${
          isSimulationActive ? 'top-[36px]' : 'top-0'
        }`}
      >
        {' '}
        {/* Adjust 36px if announcement bar height changes */}
        <div className='flex h-[var(--header-height)] w-full items-center gap-2 px-4'>
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
          <div className='ml-auto flex items-center gap-2'>
            <DateRangePicker
              value={localCalendarRange}
              onValueChange={handleGlobalDateSelect}
              minDate={calendarFromDateForGlobalPicker}
              maxDate={calendarToDateForGlobalPicker}
              disabledMatcher={disabledDateMatcherForGlobalPicker}
              isLoading={overallIsLoading}
              footerContent={globalPickerFooterContent}
            />

            {canManageSimulation && (
              <Popover open={isSimPopoverOpen} onOpenChange={setIsSimPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant={isSimulationActive ? 'destructive' : 'outline'} size='sm' className='h-9'>
                    <Wand2 className='mr-1 sm:mr-2 h-4 w-4' />
                    <span className='hidden sm:inline'>Simulation</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-4' align='end'>
                  <div className='grid gap-4'>
                    <div className='space-y-2'>
                      <h4 className='font-medium leading-none'>
                        {isSimulationActive ? 'Manage Simulation' : 'Activate Simulation Mode'}
                      </h4>
                      <p className='text-sm text-muted-foreground'>
                        {isSimulationActive
                          ? `Update the active simulation period or deactivate.`
                          : 'Select a date range to activate simulation mode.'}
                      </p>
                    </div>
                    <DateRangePicker
                      value={simDateRange}
                      onValueChange={handleSimDateSelect}
                      // No specific min/max for setting up simulation, unless business rules dictate
                    />
                    <div className='flex flex-col space-y-2 pt-2'>
                      {isSimulationActive ? (
                        <>
                          <Button
                            onClick={handleActivateOrUpdateSimulation}
                            disabled={isLoadingSimulation || !simDateRange.from || !simDateRange.to}
                          >
                            {isLoadingSimulation ? 'Updating...' : 'Update Simulation Dates'}
                          </Button>
                          <Button variant='outline' onClick={handleDeactivateSimulation} disabled={isLoadingSimulation}>
                            {isLoadingSimulation ? 'Deactivating...' : 'Deactivate Simulation'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleActivateOrUpdateSimulation}
                          disabled={isLoadingSimulation || !simDateRange.from || !simDateRange.to}
                        >
                          {isLoadingSimulation ? 'Activating...' : 'Activate Simulation'}
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

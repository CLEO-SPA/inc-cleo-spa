import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker, labelNext, labelPrevious, useDayPicker } from 'react-day-picker';

/**
 * A custom calendar component built on top of react-day-picker.
 * @param props The props for the calendar.
 * @default yearRange 12
 * @returns
 */
function Calendar({
  className,
  showOutsideDays = true,
  showYearSwitcher = true,
  yearRange = 12,
  numberOfMonths: initialNumberOfMonths = 1, // Renamed to avoid conflict, default to 1
  components,
  month: externalMonth, // Prop to control month externally
  defaultMonth: externalDefaultMonth, // Prop for initial default month
  onMonthChange: externalOnMonthChange, // Prop to notify parent of month changes
  ...props
}) {
  const [navView, setNavView] = React.useState('days');
  const [displayYears, setDisplayYears] = React.useState(
    React.useMemo(() => {
      const currentYear = new Date().getFullYear();
      return {
        from: currentYear - Math.floor(yearRange / 2 - 1),
        to: currentYear + Math.ceil(yearRange / 2),
      };
    }, [yearRange])
  );

  // State to control the displayed month for DayPicker
  const [currentDisplayedMonth, setCurrentDisplayedMonth] = React.useState(
    externalMonth || externalDefaultMonth || new Date()
  );

  // Effect to sync with external month/defaultMonth prop changes
  React.useEffect(() => {
    const newInitialMonth = externalMonth || externalDefaultMonth;
    if (newInitialMonth && newInitialMonth.getTime() !== currentDisplayedMonth.getTime()) {
      setCurrentDisplayedMonth(newInitialMonth);
    } else if (!externalMonth && !externalDefaultMonth && currentDisplayedMonth.getTime() !== new Date().getTime()) {
      // Fallback if props become undefined, though less likely with current setup
      // setCurrentDisplayedMonth(new Date()); // Optional: reset to current date if all external sources are gone
    }
  }, [externalMonth, externalDefaultMonth]); // currentDisplayedMonth removed from deps

  const { onNextClick, onPrevClick, startMonth, endMonth } = props;

  const columnsDisplayed = navView === 'years' ? 1 : initialNumberOfMonths; // Use initialNumberOfMonths here

  const handleMonthChangeInternal = (newMonth) => {
    setCurrentDisplayedMonth(newMonth);
    if (externalOnMonthChange) {
      externalOnMonthChange(newMonth);
    }
  };

  const handleYearSelectedInGrid = (year) => {
    // Preserve the current month of the *first* displayed calendar
    // Or use the month from the selected range if available and preferred
    const currentSelectedDate = props.selected?.from || props.selected; // props.selected is the range {from, to}
    const monthToKeep =
      currentSelectedDate instanceof Date ? currentSelectedDate.getMonth() : currentDisplayedMonth.getMonth();

    setCurrentDisplayedMonth(new Date(year, monthToKeep));
    setNavView('days');
    // Notify external onMonthChange if needed, though setCurrentDisplayedMonth will trigger re-render with new month
    if (externalOnMonthChange) {
      externalOnMonthChange(new Date(year, monthToKeep));
    }
  };
  const _monthsClassName = cn('relative flex', props.monthsClassName);
  const _monthCaptionClassName = cn('relative mx-10 flex h-7 items-center justify-center', props.monthCaptionClassName);
  const _weekdaysClassName = cn('flex flex-row', props.weekdaysClassName);
  const _weekdayClassName = cn('w-8 text-sm font-normal text-muted-foreground', props.weekdayClassName);
  const _monthClassName = cn('w-full', props.monthClassName);
  const _captionClassName = cn('relative flex items-center justify-center pt-1', props.captionClassName);
  const _captionLabelClassName = cn('truncate text-sm font-medium', props.captionLabelClassName);
  const buttonNavClassName = buttonVariants({
    variant: 'outline',
    className: 'absolute h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
  });
  const _buttonNextClassName = cn(buttonNavClassName, 'right-0', props.buttonNextClassName);
  const _buttonPreviousClassName = cn(buttonNavClassName, 'left-0', props.buttonPreviousClassName);
  const _navClassName = cn('flex items-start', props.navClassName);
  const _monthGridClassName = cn('mx-auto mt-4', props.monthGridClassName);
  const _weekClassName = cn('mt-2 flex w-max items-start', props.weekClassName);
  const _dayClassName = cn('flex size-8 flex-1 items-center justify-center p-0 text-sm', props.dayClassName);
  const _dayButtonClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    'size-8 rounded-md p-0 font-normal transition-none aria-selected:opacity-100',
    props.dayButtonClassName
  );
  const buttonRangeClassName =
    'bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground';
  const _rangeStartClassName = cn(buttonRangeClassName, 'day-range-start rounded-s-md', props.rangeStartClassName);
  const _rangeEndClassName = cn(buttonRangeClassName, 'day-range-end rounded-e-md', props.rangeEndClassName);
  const _rangeMiddleClassName = cn(
    'bg-accent !text-foreground [&>button]:bg-transparent [&>button]:!text-foreground [&>button]:hover:bg-transparent [&>button]:hover:!text-foreground',
    props.rangeMiddleClassName
  );
  const _selectedClassName = cn(
    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
    props.selectedClassName
  );
  const _todayClassName = cn('[&>button]:bg-accent [&>button]:text-accent-foreground', props.todayClassName);
  const _outsideClassName = cn(
    'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
    props.outsideClassName
  );
  const _disabledClassName = cn('text-muted-foreground opacity-50', props.disabledClassName);
  const _hiddenClassName = cn('invisible flex-1', props.hiddenClassName);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      style={{
        width: 248.8 * (columnsDisplayed ?? 1) + 'px',
      }}
      classNames={{
        months: _monthsClassName,
        month_caption: _monthCaptionClassName,
        weekdays: _weekdaysClassName,
        weekday: _weekdayClassName,
        month: _monthClassName,
        caption: _captionClassName,
        caption_label: _captionLabelClassName,
        button_next: _buttonNextClassName,
        button_previous: _buttonPreviousClassName,
        nav: _navClassName,
        month_grid: _monthGridClassName,
        week: _weekClassName,
        day: _dayClassName,
        day_button: _dayButtonClassName,
        range_start: _rangeStartClassName,
        range_middle: _rangeMiddleClassName,
        range_end: _rangeEndClassName,
        selected: _selectedClassName,
        today: _todayClassName,
        outside: _outsideClassName,
        disabled: _disabledClassName,
        hidden: _hiddenClassName,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className='h-4 w-4' />;
        },
        Nav: (
          { className: navCompClassName } // Renamed className to avoid conflict
        ) => (
          <Nav
            className={navCompClassName}
            displayYears={displayYears}
            navView={navView}
            setDisplayYears={setDisplayYears}
            startMonth={startMonth}
            endMonth={endMonth}
            onPrevClick={onPrevClick} // These are external handlers if provided
            onNextClick={onNextClick} // These are external handlers if provided
          />
        ),
        CaptionLabel: (
          captionProps // captionProps includes displayMonth
        ) => (
          <CaptionLabel
            showYearSwitcher={showYearSwitcher}
            navView={navView}
            setNavView={setNavView}
            displayYears={displayYears}
            {...captionProps} // Pass all props from DayPicker to your custom CaptionLabel
          />
        ),
        MonthGrid: (
          { className: gridClassName, children: gridChildren, ...monthGridRestProps } // Destructure to avoid conflict
        ) => (
          <MonthGrid
            className={gridClassName}
            displayYears={displayYears}
            startMonth={startMonth}
            endMonth={endMonth}
            navView={navView}
            setNavView={setNavView} // Already passed
            onYearSelect={handleYearSelectedInGrid} // Pass the handler
            {...monthGridRestProps} // Pass rest of the props
          >
            {gridChildren}
          </MonthGrid>
        ),
        ...components,
      }}
      month={currentDisplayedMonth} // Control the displayed month
      onMonthChange={handleMonthChangeInternal} // Handle internal/external month changes
      numberOfMonths={columnsDisplayed}
      {...props} // Spread the rest of the props (ensure defaultMonth is not spread if month is controlled)
    />
  );
}
Calendar.displayName = 'Calendar';

// ... Nav component remains largely the same, but ensure it uses DayPicker's goToMonth for day view
// and calls setDisplayYears for year view. The onPrevClick/onNextClick from props are for external notification.

function Nav({
  className,
  navView,
  startMonth, // from DayPicker props (min date)
  endMonth, // from DayPicker props (max date)
  displayYears,
  setDisplayYears,
  // onPrevClick, // External handler from Calendar props
  // onNextClick  // External handler from Calendar props
}) {
  const { nextMonth, previousMonth, goToMonth, currentMonth } = useDayPicker(); // currentMonth is the first month of the current view

  const isPreviousDisabled = React.useMemo(() => {
    if (navView === 'years') {
      const prevYearRangeStart = new Date(displayYears.from - 1, 11, 31); // End of prev year in range
      return startMonth && prevYearRangeStart < startMonth;
    }
    return !previousMonth;
  }, [navView, previousMonth, displayYears.from, startMonth]);

  const isNextDisabled = React.useMemo(() => {
    if (navView === 'years') {
      const nextYearRangeEnd = new Date(displayYears.to + 1, 0, 1); // Start of next year in range
      return endMonth && nextYearRangeEnd > endMonth;
    }
    return !nextMonth;
  }, [navView, nextMonth, displayYears.to, endMonth]);

  const handlePreviousClick = React.useCallback(() => {
    if (navView === 'years') {
      const yearDiff = displayYears.to - displayYears.from + 1;
      setDisplayYears((prev) => ({
        from: prev.from - yearDiff,
        to: prev.to - yearDiff,
      }));
      // Optional: Call external onPrevClick if needed, but DayPicker's onMonthChange will handle month update
    } else if (previousMonth) {
      goToMonth(previousMonth);
    }
  }, [navView, previousMonth, goToMonth, displayYears, setDisplayYears]);

  const handleNextClick = React.useCallback(() => {
    if (navView === 'years') {
      const yearDiff = displayYears.to - displayYears.from + 1;
      setDisplayYears((prev) => ({
        from: prev.from + yearDiff,
        to: prev.to + yearDiff,
      }));
      // Optional: Call external onNextClick
    } else if (nextMonth) {
      goToMonth(nextMonth);
    }
  }, [navView, nextMonth, goToMonth, displayYears, setDisplayYears]);

  return (
    <nav className={cn('flex items-center', className)}>
      <Button
        variant='outline'
        className='absolute left-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100'
        type='button'
        disabled={isPreviousDisabled}
        aria-label={
          navView === 'years'
            ? `Go to previous ${displayYears.to - displayYears.from + 1} years`
            : labelPrevious(previousMonth)
        }
        onClick={handlePreviousClick}
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>
      <Button
        variant='outline'
        className='absolute right-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100'
        type='button'
        disabled={isNextDisabled}
        aria-label={
          navView === 'years' ? `Go to next ${displayYears.to - displayYears.from + 1} years` : labelNext(nextMonth)
        }
        onClick={handleNextClick}
      >
        <ChevronRight className='h-4 w-4' />
      </Button>
    </nav>
  );
}

function CaptionLabel({
  children,
  showYearSwitcher,
  navView,
  setNavView,
  displayYears,
  // displayMonth prop is implicitly passed via {...props} by DayPicker
  ...props
}) {
  if (!showYearSwitcher) return <span {...props}>{children}</span>;
  return (
    <Button
      className='h-7 w-full truncate text-sm font-medium'
      variant='ghost'
      size='sm'
      onClick={() => setNavView((prev) => (prev === 'days' ? 'years' : 'days'))}
    >
      {navView === 'days'
        ? children // This `children` is the formatted string from DayPicker based on controlled `month`
        : displayYears.from + ' - ' + displayYears.to}
    </Button>
  );
}

// Modify MonthGrid to accept and pass onYearSelect
function MonthGrid({
  className,
  children,
  displayYears,
  startMonth,
  endMonth,
  navView,
  setNavView,
  onYearSelect, // Added prop
  ...props
}) {
  if (navView === 'years') {
    return (
      <YearGrid
        displayYears={displayYears}
        startMonth={startMonth}
        endMonth={endMonth}
        setNavView={setNavView} // setNavView is now handled by onYearSelect callback
        navView={navView}
        onYearSelect={onYearSelect} // Pass down
        className={className}
        {...props}
      />
    );
  }
  return (
    <table className={className} {...props}>
      {children}
    </table>
  );
}

// Modify YearGrid to use onYearSelect
function YearGrid({
  className,
  displayYears,
  startMonth,
  endMonth,
  // setNavView, // No longer directly needed here, handled by onYearSelect
  navView,
  onYearSelect, // Added prop
  ...props
}) {
  // const { goToMonth, selected } = useDayPicker(); // goToMonth is no longer called directly

  return (
    <div className={cn('grid grid-cols-4 gap-y-2', className)} {...props}>
      {Array.from({ length: displayYears.to - displayYears.from + 1 }, (_, i) => {
        const year = displayYears.from + i;
        const isBefore = startMonth && year < startMonth.getFullYear();
        const isAfter = endMonth && year > endMonth.getFullYear();
        const isDisabled = isBefore || isAfter;

        return (
          <Button
            key={i}
            className={cn(
              'h-7 w-full text-sm font-normal text-foreground',
              year === new Date().getFullYear() && 'bg-accent font-medium text-accent-foreground'
            )}
            variant='ghost'
            onClick={() => {
              if (onYearSelect && !isDisabled) {
                onYearSelect(year); // Call the handler passed from Calendar
              }
            }}
            disabled={isDisabled} // Simplified disabled logic
          >
            {year}
          </Button>
        );
      })}
    </div>
  );
}

export { Calendar };

// src/components/AppointmentDateTimeSelect.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import useAppointmentDateTimeStore from '@/stores/useAppointmentDateTimeStore';

export function AppointmentDateTimeSelect({
  label = 'Start Time *',
  employeeId,
  appointmentDate,
  value,
  onChange,
  placeholder = 'Select time',
  // New props for cross-validation
  isStartTime = true, // true for start time, false for end time
  otherTimeValue = null, // the value of the other time field (end time if this is start, start time if this is end)
  appointmentIndex = 0, // Add unique identifier for each appointment
}) {
  const {
    timeslots,
    endTimeSlots,
    isFetching,
    error,
    errorMessage,
    warning,
    fetchTimeslots,
    reset,
  } = useAppointmentDateTimeStore();

  // Local state to track the last fetched data for this specific appointment
  const [localTimeslots, setLocalTimeslots] = useState([]);
  const [localEndTimeSlots, setLocalEndTimeSlots] = useState([]);
  const [lastFetchKey, setLastFetchKey] = useState('');

  // Use appropriate timeslots based on whether this is start time or end time
  const availableSlots = isStartTime ? localTimeslots : localEndTimeSlots;

  // Check if we have a valid appointment date and employee
  const hasValidDate = appointmentDate && appointmentDate.trim() !== '';
  const hasValidEmployee = employeeId && employeeId.trim() !== '';

  // Create a unique key for this appointment's fetch
  const currentFetchKey = `${employeeId}-${appointmentDate}`;

  // Re-fetch whenever date or employee changes
  useEffect(() => {
    if (hasValidDate && hasValidEmployee && currentFetchKey !== lastFetchKey) {
      console.log('Fetching timeslots for appointment', appointmentIndex, ':', { employeeId, appointmentDate });
      fetchTimeslots({ employeeId, appointmentDate });
    } else if (!hasValidDate || !hasValidEmployee) {
      console.log('Resetting timeslots for appointment', appointmentIndex, '- invalid date or employee');
      setLocalTimeslots([]);
      setLocalEndTimeSlots([]);
      setLastFetchKey('');
    }
  }, [appointmentDate, employeeId, fetchTimeslots, hasValidDate, hasValidEmployee, currentFetchKey, lastFetchKey, appointmentIndex]);

  // Update local timeslots when global store updates and it matches our fetch key
  useEffect(() => {
    if (hasValidDate && hasValidEmployee && currentFetchKey === `${employeeId}-${appointmentDate}` && !isFetching && !error) {
      setLocalTimeslots(timeslots);
      setLocalEndTimeSlots(endTimeSlots);
      setLastFetchKey(currentFetchKey);
    }
  }, [timeslots, endTimeSlots, isFetching, error, employeeId, appointmentDate, hasValidDate, hasValidEmployee, currentFetchKey]);

  // Clear local state when employee changes but store hasn't been reset yet
  useEffect(() => {
    // If we have a new employee but the timeslots are for a different employee/date combination
    if (hasValidEmployee && hasValidDate && lastFetchKey && !lastFetchKey.startsWith(`${employeeId}-`)) {
      console.log('Employee changed, clearing local timeslots for appointment', appointmentIndex);
      setLocalTimeslots([]);
      setLocalEndTimeSlots([]);
      setLastFetchKey('');
    }
  }, [employeeId, appointmentDate, lastFetchKey, hasValidEmployee, hasValidDate, appointmentIndex]);

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Filter available timeslots based on the other time field
  const filteredTimeslots = useMemo(() => {
    if (!availableSlots.length || !otherTimeValue) {
      return availableSlots;
    }

    const otherTimeMinutes = timeToMinutes(otherTimeValue);
    if (otherTimeMinutes === null) return availableSlots;

    return availableSlots.filter(timeSlot => {
      const currentTimeMinutes = timeToMinutes(timeSlot);
      if (currentTimeMinutes === null) return true;

      if (isStartTime) {
        // For start time: show only times before the end time
        return currentTimeMinutes < otherTimeMinutes;
      } else {
        // For end time: show only times after the start time
        return currentTimeMinutes > otherTimeMinutes;
      }
    });
  }, [availableSlots, otherTimeValue, isStartTime]);

  // Check if the current value is still valid in the filtered timeslots
  const isCurrentValueValid = useMemo(() => {
    if (!value || !filteredTimeslots.length) return true;
    return filteredTimeslots.includes(value);
  }, [value, filteredTimeslots]);

  // Clear the value if it's no longer valid
  useEffect(() => {
    if (value && !isCurrentValueValid) {
      console.log('Clearing invalid time value for appointment', appointmentIndex, ':', value);
      onChange('');
    }
  }, [value, isCurrentValueValid, onChange, appointmentIndex]);

  // Determine if Select should be disabled
  const isDisabled = !hasValidDate || !hasValidEmployee || isFetching || error;

  // Check if this appointment's data is currently being fetched
  const isCurrentlyFetching = isFetching && currentFetchKey === `${employeeId}-${appointmentDate}`;

  console.log('Select state for appointment', appointmentIndex, ':', {
    appointmentDate,
    employeeId,
    hasValidDate,
    hasValidEmployee,
    isDisabled,
    isFetching: isCurrentlyFetching,
    error,
    warning,
    availableSlotsCount: availableSlots.length,
    filteredCount: filteredTimeslots.length,
    isStartTime,
    otherTimeValue,
    currentValue: value,
    isCurrentValueValid,
    currentFetchKey,
    lastFetchKey
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        disabled={isDisabled}
        value={value || ''}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-12">
          <SelectValue
            placeholder={
              !hasValidDate
                ? 'Select date first'
                : !hasValidEmployee
                  ? 'Select employee first'
                  : isCurrentlyFetching
                    ? 'Loading…'
                    : error
                      ? `Error: ${errorMessage || 'Failed to load'}`
                      : filteredTimeslots.length === 0
                        ? otherTimeValue
                          ? `No ${isStartTime ? 'earlier' : 'later'} times available`
                          : 'No times available'
                        : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {hasValidDate &&
            hasValidEmployee &&
            !error &&
            !isCurrentlyFetching &&
            filteredTimeslots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">
          {errorMessage}
        </p>
      )}
      {/* Only show warning for start time of the first appointment to avoid duplication */}
      {warning && isStartTime && appointmentIndex === 0 && (
        <p className="text-red-500 text-xs mt-1">
          {warning}
        </p>
      )}
    </div>
  );
}

export default AppointmentDateTimeSelect;
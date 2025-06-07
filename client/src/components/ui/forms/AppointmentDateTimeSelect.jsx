// src/components/AppointmentDateTimeSelect.jsx
import { useEffect, useMemo } from 'react';
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
}) {
  const {
    timeslots,
    endTimeSlots,
    isFetching,
    error,
    errorMessage,
    fetchTimeslots,
    reset,
  } = useAppointmentDateTimeStore();

  // Use appropriate timeslots based on whether this is start time or end time
  const availableSlots = isStartTime ? timeslots : endTimeSlots;

  // Check if we have a valid appointment date
  const hasValidDate = appointmentDate && appointmentDate.trim() !== '';

  // Re-fetch whenever date or employee changes
  useEffect(() => {
    if (hasValidDate) {
      console.log('Fetching timeslots for:', { employeeId, appointmentDate });
      fetchTimeslots({ employeeId, appointmentDate });
    } else {
      console.log('Resetting timeslots - no valid date');
      reset();
    }
  }, [appointmentDate, employeeId, fetchTimeslots, reset, hasValidDate]);

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

  // Determine if Select should be disabled
  const isDisabled = !hasValidDate || isFetching || error;

  console.log('Select state:', {
    appointmentDate,
    hasValidDate,
    isDisabled,
    isFetching,
    error,
    availableSlotsCount: availableSlots.length,
    filteredCount: filteredTimeslots.length,
    isStartTime,
    otherTimeValue
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
                : isFetching
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
            !error &&
            !isFetching &&
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
    </div>
  );
}

export default AppointmentDateTimeSelect;
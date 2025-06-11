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
  isStartTime = true,
  otherTimeValue = null,
  appointmentIndex = 0,
}) {
  const {
    timeslots,
    endTimeSlots,
    timeslotsByAppointment,
    endTimeSlotsByAppointment,
    isFetching,
    error,
    errorMessage,
    warning,
    fetchTimeslots,
    reset,
  } = useAppointmentDateTimeStore();

  // Local state to track the last fetched data for this specific appointment
  const [lastFetchKey, setLastFetchKey] = useState('');

  // Use indexed timeslots for this specific appointment, fallback to global if not available
  const appointmentTimeslots = timeslotsByAppointment[appointmentIndex] || timeslots || [];
  const appointmentEndTimeSlots = endTimeSlotsByAppointment[appointmentIndex] || endTimeSlots || [];

  // Use appropriate timeslots based on whether this is start time or end time
  const baseAvailableSlots = isStartTime ? appointmentTimeslots : appointmentEndTimeSlots;

  // Check if we have a valid appointment date and employee
  const hasValidDate = appointmentDate && appointmentDate.trim() !== '';
  const hasValidEmployee = employeeId && employeeId.trim() !== '';

  // Create a unique key for this appointment's fetch
  const currentFetchKey = `${employeeId}-${appointmentDate}`;

  // Re-fetch whenever date or employee changes
  useEffect(() => {
    if (hasValidDate && hasValidEmployee && currentFetchKey !== lastFetchKey) {
      console.log('Fetching timeslots for appointment', appointmentIndex, ':', { employeeId, appointmentDate });
      fetchTimeslots({ employeeId, appointmentDate, appointmentIndex });
      setLastFetchKey(currentFetchKey);
    } else if (!hasValidDate || !hasValidEmployee) {
      console.log('Resetting timeslots for appointment', appointmentIndex, '- invalid date or employee');
      setLastFetchKey('');
    }
  }, [appointmentDate, employeeId, fetchTimeslots, hasValidDate, hasValidEmployee, currentFetchKey, lastFetchKey, appointmentIndex]);

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Filter available timeslots based on the other time field with cross-validation
  const filteredTimeslots = useMemo(() => {
    if (!baseAvailableSlots.length) {
      return baseAvailableSlots;
    }

    // If no other time value is selected, return all base slots
    if (!otherTimeValue) {
      return baseAvailableSlots;
    }

    const otherTimeMinutes = timeToMinutes(otherTimeValue);
    if (otherTimeMinutes === null) return baseAvailableSlots;

    return baseAvailableSlots.filter(timeSlot => {
      const currentTimeMinutes = timeToMinutes(timeSlot);
      if (currentTimeMinutes === null) return true;

      if (isStartTime) {
        // For start time: show only times that are at least 30 minutes before the end time
        // If end time is 2:00 PM (14:00), only show start times up to 1:30 PM (13:30)
        return currentTimeMinutes < otherTimeMinutes;
      } else {
        // For end time: show only times that are at least 30 minutes after the start time
        // If start time is 12:00 PM (12:00), only show end times from 12:30 PM (12:30) onwards
        return currentTimeMinutes > otherTimeMinutes;
      }
    });
  }, [baseAvailableSlots, otherTimeValue, isStartTime]);

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

  // Enhanced placeholder logic
  const getPlaceholder = () => {
    if (!hasValidDate) return 'Select date first';
    if (!hasValidEmployee) return 'Select employee first';
    if (isCurrentlyFetching) return 'Loading…';
    if (error) return `Error: ${errorMessage || 'Failed to load'}`;
    
    if (filteredTimeslots.length === 0) {
      if (otherTimeValue) {
        if (isStartTime) {
          return 'No earlier times available';
        } else {
          return 'No later times available';
        }
      }
      return 'No times available';
    }
    
    return placeholder;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        disabled={isDisabled}
        value={value || ''}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder={getPlaceholder()} />
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
    </div>
  );
}

export default AppointmentDateTimeSelect;
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
  otherTimeValue = null,    // for start select: otherTimeValue is selected end; for end select: otherTimeValue is selected start
  appointmentIndex = 0,
  excludeAppointmentId = null, // Proposed to exclude a specific appointment from the fetch (e.g. when editing an existing appointment)
}) {
  const {
    // renamed in store:
    startTimeSlots,
    endTimeSlots,
    timeslotsByAppointment,
    endTimeSlotsByAppointment,
    isFetching,
    error,
    errorMessage,
    fetchTimeslots,
    fetchEndTimesForStartTime,
  } = useAppointmentDateTimeStore();

  // Local state to avoid refetch flood
  const [lastFetchKey, setLastFetchKey] = useState('');

  // Determine the slots for this appointment index, falling back to global
  const appointmentStartTimeSlots = timeslotsByAppointment[appointmentIndex] || startTimeSlots || [];
  const appointmentEndTimeSlots = endTimeSlotsByAppointment[appointmentIndex] || endTimeSlots || [];

  // Base slots for dropdown:
  const baseAvailableSlots = isStartTime ? appointmentStartTimeSlots : appointmentEndTimeSlots;

  // Validate inputs
  const hasValidDate = appointmentDate && appointmentDate.trim() !== '';
  const hasValidEmployee = employeeId && employeeId.toString().trim() !== '';

  // Unique key per fetch
  const currentFetchKey = `${employeeId}-${appointmentDate}`;

  // Fetch start-time slots when date or employee changes
  useEffect(() => {
    if (isStartTime) {
      if (hasValidDate && hasValidEmployee && currentFetchKey !== lastFetchKey) {
        fetchTimeslots({ employeeId, appointmentDate, appointmentIndex, excludeAppointmentId });
        setLastFetchKey(currentFetchKey);
      } else if (!hasValidDate || !hasValidEmployee) {
        // reset key so future valid changes trigger fetch
        setLastFetchKey('');
      }
    }
    // For end-time select, we do not fetch here; we wait for start selection
  }, [
    isStartTime,
    appointmentDate,
    employeeId,
    fetchTimeslots,
    hasValidDate,
    hasValidEmployee,
    currentFetchKey,
    lastFetchKey,
    appointmentIndex,
    excludeAppointmentId,
  ]);

  // When this is the end-time select, and the start time (`otherTimeValue`) changes,
  // fetch the available end times for that start.
  useEffect(() => {
    if (!isStartTime) {
      const selectedStartTime = otherTimeValue;
      // Clear previous end times if start changed
      // (store will overwrite on fetch)
      if (selectedStartTime && hasValidDate && hasValidEmployee) {
        fetchEndTimesForStartTime({
          employeeId,
          appointmentDate,
          startTime: selectedStartTime,
          appointmentIndex,
          excludeAppointmentId,
        });
      } else {
        // Clear endTimeSlots for this appointment
        useAppointmentDateTimeStore.setState((state) => {
          const updated = { ...state.endTimeSlotsByAppointment };
          delete updated[appointmentIndex];
          return {
            endTimeSlotsByAppointment: updated,
            endTimeSlots: [],
          };
        });
      }
    }
  }, [
    isStartTime,
    otherTimeValue,
    employeeId,
    appointmentDate,
    hasValidDate,
    hasValidEmployee,
    fetchEndTimesForStartTime,
    appointmentIndex,
    excludeAppointmentId
  ]);

  // Helper to convert "HH:MM" to minutes
  const timeToMinutes = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Filter slots based on otherTimeValue (cross-validation)
  const filteredTimeslots = useMemo(() => {
    if (!baseAvailableSlots.length) return baseAvailableSlots;

    // Only filter when this is the end-time select; do not filter start-time slots
    if (isStartTime) {
      return baseAvailableSlots;
    }
    // For end-time: if no start selected yet, allow all (disable handled elsewhere)
    if (!otherTimeValue) return baseAvailableSlots;
    const otherMins = timeToMinutes(otherTimeValue);
    if (otherMins === null) return baseAvailableSlots;
    return baseAvailableSlots.filter(slot => {
      const slotMins = timeToMinutes(slot);
      if (slotMins === null) return true;
      // end must be > start
      return slotMins > otherMins;
    });
  }, [baseAvailableSlots, otherTimeValue, isStartTime]);

  // If current value is no longer in filteredSlots, clear it
  const isCurrentValueValid = useMemo(() => {
    if (!value) return true;
    // If slots not yet loaded (no baseAvailableSlots), skip clearing
    if (!baseAvailableSlots.length) return true;
    return filteredTimeslots.includes(value);
  }, [value, filteredTimeslots, baseAvailableSlots]);

  useEffect(() => {
    if (value && !isCurrentValueValid) {
      onChange('');
    }
  }, [value, isCurrentValueValid, onChange, appointmentIndex]);

  // Disabled if missing inputs or fetching or error, and also disable end-time if no start selected
  const isDisabled =
    !hasValidDate
    || !hasValidEmployee
    || isFetching
    || error
    || (!isStartTime && !otherTimeValue);

  // Detect if fetching corresponds to this appointment’s fetch
  const isCurrentlyFetching = isFetching && isStartTime && currentFetchKey === `${employeeId}-${appointmentDate}`;

  // Placeholder logic
  const getPlaceholder = () => {
    if (!hasValidDate) return 'Select date first';
    if (!hasValidEmployee) return 'Select employee first';
    if (isCurrentlyFetching) return 'Loading…';
    if (error) return `Error: ${errorMessage || 'Failed to load'}`;

    // If this is end-time dropdown and no start time selected:
    if (!isStartTime && !otherTimeValue) {
      return 'Select start time first';
    }

    if (filteredTimeslots.length === 0) {
      if (otherTimeValue) {
        return isStartTime ? 'No earlier times' : 'No later times';
      }
      return 'No times available';
    }
    return placeholder;
  };

  const getDisplayLabel = (time) => {
    if (isStartTime) {
      return time;
    }
    if (otherTimeValue) {
      const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const startMins = toMinutes(otherTimeValue);
      const slotMins = toMinutes(time);
      const diff = slotMins - startMins;
      if (diff > 0) {
        if (diff < 60) {
          // under an hour: show minutes
          return `${time} (${diff} mins)`;
        } else {
          const hrs = Math.floor(diff / 60);
          const mins = diff % 60;
          if (mins === 0) {
            return `${time} (${hrs} hr${hrs > 1 ? 's' : ''})`;
          } else {
            return `${time} (${hrs} hr${hrs > 1 ? 's' : ''} ${mins} mins)`;
          }
        }
      }
    }
    return time;
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
          <div className="max-h-48 overflow-y-auto">
            {hasValidDate &&
              hasValidEmployee &&
              !error &&
              !isCurrentlyFetching &&
              filteredTimeslots.map((time) => (
                <SelectItem key={time} value={time}>
                  {getDisplayLabel(time)}
                </SelectItem>
              ))
            }
          </div>
        </SelectContent>
      </Select>
      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export default AppointmentDateTimeSelect;

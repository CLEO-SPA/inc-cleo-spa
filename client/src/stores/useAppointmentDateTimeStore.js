// src/stores/useAppointmentDateTimeStore.js
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  startTimeSlots: [],           // start times from /max-durations
  endTimeSlots: [],             // end times for currently selected start
  isFetching: false,
  error: false,
  errorMessage: null,
  warning: null,                // warning from backend if any
  warningAppointmentIndex: undefined,
  appointmentWarnings: {},      // per-appointment warnings
  timeslotsByAppointment: {},   // start times per appointment index
  endTimeSlotsByAppointment: {},// end times per appointment index
});

const useAppointmentDateTimeStore = create((set, get) => ({
  ...getInitialState(),

  clearWarningForAppointment: (appointmentIndex) => {
    const currentWarnings = get().appointmentWarnings;
    const updatedWarnings = { ...currentWarnings };
    delete updatedWarnings[appointmentIndex];

    set({
      appointmentWarnings: updatedWarnings,
      warning: get().warningAppointmentIndex === appointmentIndex ? null : get().warning,
      warningAppointmentIndex: get().warningAppointmentIndex === appointmentIndex ? undefined : get().warningAppointmentIndex,
    });
  },

  shiftAppointmentWarnings: (removedIndex) => {
    const currentWarnings = get().appointmentWarnings;
    const updatedWarnings = {};

    Object.keys(currentWarnings).forEach(key => {
      const index = parseInt(key, 10);
      if (index < removedIndex) {
        updatedWarnings[index] = currentWarnings[key];
      } else if (index > removedIndex) {
        updatedWarnings[index - 1] = currentWarnings[key];
      }
      // skip equal
    });

    set({
      appointmentWarnings: updatedWarnings,
      warningAppointmentIndex: get().warningAppointmentIndex === removedIndex
        ? undefined
        : get().warningAppointmentIndex > removedIndex
          ? get().warningAppointmentIndex - 1
          : get().warningAppointmentIndex
    });
  },

  clearTimeslots: (appointmentIndex) => {
    const currentTimeslotsByAppointment = get().timeslotsByAppointment;
    const currentEndTimeSlotsByAppointment = get().endTimeSlotsByAppointment;
    const updatedTimeslots = { ...currentTimeslotsByAppointment };
    const updatedEndTimeSlots = { ...currentEndTimeSlotsByAppointment };
    delete updatedTimeslots[appointmentIndex];
    delete updatedEndTimeSlots[appointmentIndex];

    set({
      timeslotsByAppointment: updatedTimeslots,
      endTimeSlotsByAppointment: updatedEndTimeSlots,
      // Also clear global if needed
      startTimeSlots: [],
      endTimeSlots: [],
      isFetching: false,
      error: false,
      errorMessage: null,
    });
  },

 getRestDayConflictMessage: (appointmentCount, isUpdate = false) => {
    const { appointmentWarnings } = get();
    const warningCount = Object.keys(appointmentWarnings).length;
    if (appointmentCount === 1 && warningCount > 0) {
      if (isUpdate) {
        return 'Cannot update appointment due to a rest day conflict. Please select a different date or employee.';
      } else {
        return 'Cannot create appointment due to a rest day conflict. Please select a different date or employee.\nNote: when creating two or more appointments, this warning will be ignored';
      }
    }
    return null;
  },

  // Fetch start times (max-durations) for a given employee & date
  fetchTimeslots: async ({ employeeId = null, appointmentDate, appointmentIndex = 0, excludeAppointmentId = null  }) => {
    set({ isFetching: true, error: false, errorMessage: null });
    try {
     // Build URL with exclude parameter if provided
      let url = `/ab/timeslots?employeeId=${employeeId || 'null'}&date=${appointmentDate}`;
      if (excludeAppointmentId) {
        url += `&excludeAppointmentId=${excludeAppointmentId}`;
      }

      const response = await api.get(url);

      // Expect response.data.maxDurations = [{ startTime, maxEndTime, maxDurationMinutes }, ...]
      const maxDurations = Array.isArray(response.data.maxDurations) ? response.data.maxDurations : [];

      // Derive startTimeSlots from maxDurations
      const startTimeSlots = maxDurations.map(item => item.startTime);

      // Warning if provided by backend
      const warning = response.data.warning || null;
      const currentAppointmentWarnings = get().appointmentWarnings;
      let updatedWarnings = { ...currentAppointmentWarnings };
      if (warning) {
        updatedWarnings[appointmentIndex] = warning;
      } else {
        delete updatedWarnings[appointmentIndex];
      }

      // Update store for this appointment index
      const currentTimeslotsByAppointment = get().timeslotsByAppointment;
      set({
        timeslotsByAppointment: {
          ...currentTimeslotsByAppointment,
          [appointmentIndex]: startTimeSlots
        },
        startTimeSlots,
        // Clear any previous end times until user selects a start time
        endTimeSlots: [],
        warning,
        warningAppointmentIndex: warning ? appointmentIndex : undefined,
        appointmentWarnings: updatedWarnings,
        isFetching: false,
      });
      return startTimeSlots;
    } catch (err) {
      console.error('Failed to fetch start time slots:', err);
      set({
        startTimeSlots: [],
        endTimeSlots: [],
        isFetching: false,
        error: true,
        errorMessage: err.response?.data?.message || err.message || 'Failed to fetch start times',
      });
      return [];
    }
  },

  // Fetch end times for a given selected start time using the new endpoint
  fetchEndTimesForStartTime: async ({
    employeeId = null,
    appointmentDate,
    startTime,        // e.g. "18:00"
    appointmentIndex = 0,
    excludeAppointmentId = null
  }) => {
    try {
      // Build URL with exclude parameter if provided
      let url = `/ab/timeslots/end-times?employeeId=${employeeId || 'null'}&date=${appointmentDate}&startTime=${startTime}`;
      if (excludeAppointmentId) {
        url += `&excludeAppointmentId=${excludeAppointmentId}`;
      }

      const response = await api.get(url);

      // Expect response.data.availableEndTimes = ["18:30", ...]
      const availableEndTimes = Array.isArray(response.data.availableEndTimes)
        ? response.data.availableEndTimes
        : [];

      // Update store for this appointment index
      const currentEndTimeSlotsByAppointment = get().endTimeSlotsByAppointment;
      set({
        endTimeSlotsByAppointment: {
          ...currentEndTimeSlotsByAppointment,
          [appointmentIndex]: availableEndTimes
        },
        endTimeSlots: availableEndTimes
      });

      return availableEndTimes;
    } catch (err) {
      console.error('Failed to fetch end times for start time:', err);
      // On error, clear endTimeSlots for this appointment
      const currentEndTimeSlotsByAppointment = get().endTimeSlotsByAppointment;
      const updated = { ...currentEndTimeSlotsByAppointment };
      delete updated[appointmentIndex];
      set({
        endTimeSlotsByAppointment: updated,
        endTimeSlots: [],
      });
      return [];
    }
  },

  reset: () => set(getInitialState()),
}));

export default useAppointmentDateTimeStore;

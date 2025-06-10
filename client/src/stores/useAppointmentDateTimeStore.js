// src/stores/appointmentDateTimeStore.js
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  timeslots: [],
  endTimeSlots: [], // Separate array for end times with extended hours
  isFetching: false,
  error: false,
  errorMessage: null,
  warning: null, // Keep for backward compatibility
  warningAppointmentIndex: undefined, // Track which appointment the warning is for
  appointmentWarnings: {}, // Store warnings per appointment index
  timeslotsByAppointment: {}, // Store timeslots per appointment index
  endTimeSlotsByAppointment: {}, // Store end time slots per appointment index
});

// Generate evening time slots (5:30pm to 9:00pm)
const generateEveningSlots = () => {
  const slots = [];
  const start = new Date();
  start.setHours(17, 30, 0, 0); // 5:30 PM
  const end = new Date();
  end.setHours(21, 0, 0, 0); // 9:00 PM

  while (start <= end) {
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    start.setMinutes(start.getMinutes() + 30);
  }
  return slots;
};

const useAppointmentDateTimeStore = create((set, get) => ({
  ...getInitialState(),

  // Updated fetchTimeslots to store per appointment index
  fetchTimeslots: async ({ employeeId = null, appointmentDate, appointmentIndex = 0 }) => {
    set({ isFetching: true, error: false, errorMessage: null });
    try {
      const url = `/ab/employee/${employeeId || 'null'}/date/${appointmentDate}`;
      const response = await api.get(url);

      const baseTimeslots = response.data.availableTimeslots.map((t) => t.timeslot);
      const eveningSlots = generateEveningSlots();

      // Remove duplicates and sort
      const allEndTimeSlots = [...new Set([...baseTimeslots, ...eveningSlots])].sort();

      // Handle warning for specific appointment
      const warning = response.data.warning || null;
      const currentAppointmentWarnings = get().appointmentWarnings;

      let updatedWarnings = { ...currentAppointmentWarnings };
      if (warning) {
        updatedWarnings[appointmentIndex] = warning;
      } else {
        // Remove warning for this appointment if no warning
        delete updatedWarnings[appointmentIndex];
      }

      // Store timeslots per appointment index
      const currentTimeslotsByAppointment = get().timeslotsByAppointment;
      const currentEndTimeSlotsByAppointment = get().endTimeSlotsByAppointment;

      set({
        // Store in indexed format
        timeslotsByAppointment: {
          ...currentTimeslotsByAppointment,
          [appointmentIndex]: baseTimeslots
        },
        endTimeSlotsByAppointment: {
          ...currentEndTimeSlotsByAppointment,
          [appointmentIndex]: allEndTimeSlots
        },
        // Also update global state for backward compatibility
        timeslots: baseTimeslots,
        endTimeSlots: allEndTimeSlots,
        warning: warning,
        warningAppointmentIndex: warning ? appointmentIndex : undefined,
        appointmentWarnings: updatedWarnings,
        isFetching: false,
      });
    } catch (err) {
      set({
        timeslots: [],
        endTimeSlots: [],
        isFetching: false,
        error: true,
        errorMessage: err.response?.data?.message || err.message || 'Failed to fetch timeslots',
      });
    }
  },

  // Clear warning for specific appointment
  clearWarningForAppointment: (appointmentIndex) => {
    const currentWarnings = get().appointmentWarnings;
    const updatedWarnings = { ...currentWarnings };
    delete updatedWarnings[appointmentIndex];

    set({
      appointmentWarnings: updatedWarnings,
      // Clear global warning if it was for this appointment
      warning: get().warningAppointmentIndex === appointmentIndex ? null : get().warning,
      warningAppointmentIndex: get().warningAppointmentIndex === appointmentIndex ? undefined : get().warningAppointmentIndex,
    });
  },
  // Shift appointment warnings when appointments are removed/reordered
  shiftAppointmentWarnings: (removedIndex) => {
    const currentWarnings = get().appointmentWarnings;
    const updatedWarnings = {};

    Object.keys(currentWarnings).forEach(key => {
      const index = parseInt(key);
      if (index < removedIndex) {
        // Keep warnings for appointments before the removed one
        updatedWarnings[index] = currentWarnings[key];
      } else if (index > removedIndex) {
        // Shift down warnings for appointments after the removed one
        updatedWarnings[index - 1] = currentWarnings[key];
      }
      // Skip the removed appointment (index === removedIndex)
    });

    set({
      appointmentWarnings: updatedWarnings,
      // Update global warning index if needed
      warningAppointmentIndex: get().warningAppointmentIndex === removedIndex
        ? undefined
        : get().warningAppointmentIndex > removedIndex
          ? get().warningAppointmentIndex - 1
          : get().warningAppointmentIndex
    });
  },

  // Method to clear timeslots for a specific appointment
  clearTimeslots: (appointmentIndex) => {
    const currentTimeslots = get().timeslotsByAppointment;
    const currentEndTimeSlots = get().endTimeSlotsByAppointment;

    // Create new objects without the specified appointment index
    const updatedTimeslots = { ...currentTimeslots };
    const updatedEndTimeSlots = { ...currentEndTimeSlots };

    delete updatedTimeslots[appointmentIndex];
    delete updatedEndTimeSlots[appointmentIndex];

    set({
      timeslotsByAppointment: updatedTimeslots,
      endTimeSlotsByAppointment: updatedEndTimeSlots,
      // Also clear global timeslots if they were for this appointment
      timeslots: [],
      endTimeSlots: [],
      isFetching: false,
      error: false,
      errorMessage: null,
      // Keep warnings intact - don't reset them
    });
  },


  // Check if there are rest day conflicts and if creation should be blocked
  shouldBlockAppointmentCreation: (appointmentCount) => {
    const { appointmentWarnings } = get();
    const warningCount = Object.keys(appointmentWarnings).length;
    
    // Block creation only if:
    // 1. There is exactly 1 appointment AND
    // 2. That appointment has a rest day conflict warning
    return appointmentCount === 1 && warningCount > 0;
  },

  // Get rest day conflict validation message
  getRestDayConflictMessage: (appointmentCount) => {
    const { appointmentWarnings } = get();
    const warningCount = Object.keys(appointmentWarnings).length;
    
    if (appointmentCount === 1 && warningCount > 0) {
      return 'Cannot create appointment due to 1 rest day conflict. Please select a different date or employee.';
    }
    
    return null;
  },

  reset: () => set(getInitialState()),
}));

export default useAppointmentDateTimeStore;
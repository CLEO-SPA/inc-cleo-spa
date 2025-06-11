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

// Helper function to generate timeslots in 30-minute intervals
const generateTimeslots = (startTime, endTime) => {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  while (current <= end) {
    const timeString = current.toTimeString().slice(0, 5);
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + 30);
  }
  
  return slots;
};

// Helper function to filter start time slots (10:00 AM - 6:30 PM)
const filterStartTimeSlots = (allSlots) => {
  const startTimeLimit = '18:30'; // 6:30 PM
  return allSlots.filter(slot => slot <= startTimeLimit);
};

// Helper function to process end time slots with dynamic population
const processEndTimeSlots = (availableSlots) => {
  // Immediately check if 6:30 PM is available
  const has630PM = availableSlots.includes('18:30');
  
  // If 6:30 PM is not available, exclude 7:00 PM to 9:00 PM slots
  if (!has630PM) {
    // Standard end time range: 10:30 AM - 6:30 PM (excluding 7:00 PM - 9:00 PM)
    const restrictedEndSlots = generateTimeslots('10:30', '18:30');
    const filteredSlots = restrictedEndSlots.filter(slot => availableSlots.includes(slot));
    // Always append 6:30 PM option even if not in available slots
    if (!filteredSlots.includes('18:30')) {
      filteredSlots.push('18:30');
    }
    return filteredSlots;
  }
  
  // Standard end time range: 10:30 AM - 9:00 PM (full range when 6:30 PM is available)
  const standardEndSlots = generateTimeslots('10:30', '21:00');
 
  // Find the last available start time slot (should be <= 18:30)
  const startTimeSlots = filterStartTimeSlots(availableSlots);
  const lastStartTime = startTimeSlots[startTimeSlots.length - 1];
 
  if (!lastStartTime) return standardEndSlots;
 
  if (lastStartTime === '18:00') {
    // If we have 6:00 PM as the last start time and 6:30 PM is available,
    // dynamically add 6:30 PM to the end time slots
    const endSlotsSet = new Set([...availableSlots, '18:30']);
    // Filter to only include end time range (10:30 AM - 9:00 PM)
    return standardEndSlots.filter(slot => endSlotsSet.has(slot) || slot === '18:30');
  }
 
  // Return intersection of available slots and standard end time range
  return standardEndSlots.filter(slot => availableSlots.includes(slot));
};


const useAppointmentDateTimeStore = create((set, get) => ({
  ...getInitialState(),

  // Updated fetchTimeslots to store per appointment index
  fetchTimeslots: async ({ employeeId = null, appointmentDate, appointmentIndex = 0 }) => {
    set({ isFetching: true, error: false, errorMessage: null });
    try {
      const url = `/ab/employee/${employeeId || 'null'}/date/${appointmentDate}`;
      const response = await api.get(url);

     const availableSlots = Array.isArray(response.data.availableTimeslots)
  ? response.data.availableTimeslots
  : [];

  const bookedSlots = Array.isArray(response.data.bookedTimeslots)
  ? response.data.bookedTimeslots
  : [];


      
      // Process start time slots (10:00 AM - 6:30 PM only)
      const startTimeSlots = filterStartTimeSlots(availableSlots);
      
      // Process end time slots with dynamic population logic
      const endTimeSlots = processEndTimeSlots(availableSlots);

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
          [appointmentIndex]: startTimeSlots
        },
        endTimeSlotsByAppointment: {
          ...currentEndTimeSlotsByAppointment,
          [appointmentIndex]: endTimeSlots
        },
        // Also update global state for backward compatibility
        timeslots: startTimeSlots,
        endTimeSlots: endTimeSlots,
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
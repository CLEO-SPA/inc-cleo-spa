// src/stores/appointmentDateTimeStore.js
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  timeslots: [],
  endTimeSlots: [], // Separate array for end times with extended hours
  isFetching: false,
  error: false,
  errorMessage: null,
  warning: null, // Add warning field
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

const useAppointmentDateTimeStore = create((set) => ({
  ...getInitialState(),
  fetchTimeslots: async ({ employeeId = null, appointmentDate }) => {
    set({ isFetching: true, error: false, errorMessage: null });
    try {
      const url = `/ab/employee/${employeeId || 'null'}/date/${appointmentDate}`;
      const response = await api.get(url);
      
      const baseTimeslots = response.data.availableTimeslots.map((t) => t.timeslot);
      const eveningSlots = generateEveningSlots();
      
      // Remove duplicates and sort
      const allEndTimeSlots = [...new Set([...baseTimeslots, ...eveningSlots])].sort();
      
      set({
        timeslots: baseTimeslots, // Original slots for start time
        endTimeSlots: allEndTimeSlots, // Extended slots for end time
          warning: response.data.warning || null, // Store warning from API response
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
  reset: () => set(getInitialState()),
}));

export default useAppointmentDateTimeStore;
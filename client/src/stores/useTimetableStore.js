// src/stores/useTimetableStore.js
import { create } from 'zustand';
import api from '@/services/api';
import { format } from 'date-fns';

const useTimetableStore = create((set) => ({
  // Timetable view state
  timetables: {
    current_timetables: [],
    upcoming_timetables: [],
  },
  isLoading: false,
  error: null,

  // Timetable creation state
  isSubmitting: false,
  submitError: null,

  // === Create Timetable ===
  createTimetable: async (payload) => {
    set({ isSubmitting: true, submitError: null });
    try {
      const response = await api.post('/employee-timetable/create', payload);
      set({ isSubmitting: false });
      return response.data;
    } catch (error) {
      set({
        isSubmitting: false,
        submitError: error.response?.data?.message || error.message || 'Failed to create timetable',
      });
      throw error;
    }
  },

  resetSubmitStatus: () => set({ isSubmitting: false, submitError: null }),

  // === Fetch Timetables ===
  fetchTimetablesByEmployee: async (employeeId, currentDate = new Date()) => {
    set({ isLoading: true, error: null });

    try {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const response = await api.get(`/et/current-and-upcoming/${employeeId}?currentDate=${formattedDate}`);
      set({
        timetables: response.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        timetables: {
          current_timetables: [],
          upcoming_timetables: [],
        },
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Failed to fetch timetables',
      });
    }
  },

  clearTimetables: () =>
    set({
      timetables: {
        current_timetables: [],
        upcoming_timetables: [],
      },
    }),
}));

export default useTimetableStore;

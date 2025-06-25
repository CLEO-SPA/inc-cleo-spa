// src/stores/useTimetableStore.js
import { create } from 'zustand';
import api from '@/services/api';
import { format } from 'date-fns';

const useTimetableStore = create((set) => ({
  timetables: {
    current_timetables: [],
    upcoming_timetables: [],
  },
  isLoading: false,
  error: null,

  isSubmitting: false,
  submitError: null,

  // Create Timetable
  createTimetable: async (payload) => {
    set({ isSubmitting: true, submitError: null });

    try {
      const response = await api.post('/et/create-employee-timetable', payload);
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

  // Fetch Current and Upcoming Timetables by Employee ID
  fetchCurrentAndUpcomingTimetablesByEmployeeId: async (employeeId, currentDate) => {
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

  // Inside the useTimetableStore store
  fetchTimetableById: async (timetableId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/et/${timetableId}`);
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Failed to fetch timetable',
      });
      throw err;
    }
  },

  // Update Timetable
  updateTimetable: async (payload) => {
    set({ isSubmitting: true, submitError: null });

    try {
      const response = await api.put(`/et/update-employee-timetable/${payload.timetable_id}`, payload);
      set({ isSubmitting: false });
      return response.data;
    } catch (error) {
      set({
        isSubmitting: false,
        submitError: error.response?.data?.message || error.message || 'Failed to update timetable',
      });
      throw error;
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

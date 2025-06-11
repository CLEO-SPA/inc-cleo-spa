// src/stores/useTimetableStore.js
import { create } from 'zustand';
import api from '@/services/api';
import { format } from 'date-fns';
import { useSimulationStore } from '@/stores/useSimulationStore';

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
  fetchCurrentAndUpcomingTimetablesByEmployeeId: async (employeeId) => {
    set({ isLoading: true, error: null });

    try {
      const { isSimulationActive, simulationStartDate } = useSimulationStore.getState();

      const currentDate = isSimulationActive && simulationStartDate
        ? new Date(simulationStartDate)
        : new Date();

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

  // Reset the timetables db table to its defined pre-condition
  resetCreateTimetablePre: async () => {
    try {
      await api.post('/et/reset-create-timetables-pre');
      console.log('Create timetable database pre-condition reset successfully');
    } catch (error) {
      console.error('Failed to reset create timetable DB pre-condition:', error);
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

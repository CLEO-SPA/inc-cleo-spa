// src/stores/employeeStore.js
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  employees: [],
  isFetching: false,
  error: false,
  errorMessage: null,
});

const useEmployeeStore = create((set) => ({
  ...getInitialState(),

  fetchDropdownEmployees: async () => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/employee/dropdown');
      set({
        employees: response.data,
        isFetching: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        employees: [],
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch employees',
      });
    }
  },

  reset: () => set(getInitialState()),
}));

export default useEmployeeStore;
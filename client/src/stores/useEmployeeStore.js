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

  // Get Employee Lists for Dropdown Functionality
  fetchDropdownEmployees: async () => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/em/dropdown');
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

  // Get Employee Name by Employee ID
  fetchEmployeeNameById: async (employeeId) => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get(`/em/employeeName/${employeeId}`);  

      set({
        employee: response.data,  
        isFetching: false,
        error: false,
        errorMessage: null,
      });

      return response.data;  

    } catch (error) {
      set({
        employee: null,  
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch employee',
      });

      console.error('Error fetching employee:', error);

      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch employee');
    }
  },

  reset: () => set(getInitialState()),
}));

export default useEmployeeStore;
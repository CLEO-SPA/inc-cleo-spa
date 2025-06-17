// src/stores/useAppointmentStore.js
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  // You can add list data, pagination, filters, etc. here if needed
  // CRUD states
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: false,
  errorMessage: null,
  // For edit page:
  selectedAppointment: null, // will hold the fetched appointment object
});

function emptyStringToNull(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) =>
      value === '' ? [key, null] : [key, value]
    )
  );
}

const useAppointmentStore = create((set, get) => ({
  ...getInitialState(),

  // Fetch a single appointment by ID
  fetchAppointment: async (id) => {
    set({ isFetching: true, error: false, errorMessage: null });
    try {
      const response = await api.get(`/ab/id/${id}`);
      // Assuming response.data is the appointment object:
      // { id, member_id, servicing_employee_id, appointment_date, start_time, end_time, remarks, ... }
      set({ selectedAppointment: response.data, isFetching: false });
      return { success: true, data: response.data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        `Failed to fetch appointment ${id}`;
      set({ isFetching: false, error: true, errorMessage: message });
      return { success: false, error: message };
    }
  },


  // Create bulk appointments
  createAppointment: async (payload) => {
    set({ isCreating: true, error: false, errorMessage: null });
    try {
      // Clean empty strings to null
      const cleaned = emptyStringToNull(payload);
      const response = await api.post('/ab/create', cleaned);
      // Optionally: refetch appointment list or other data here
      set({ isCreating: false });
      return { success: true, data: response.data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to create appointment(s)';
      set({ isCreating: false, error: true, errorMessage: message });
      return { success: false, error: message };
    }
  },

  // Update single appointment
  updateAppointment: async (payload) => {
    set({ isUpdating: true, error: false, errorMessage: null });
    try {
      const cleaned = emptyStringToNull(payload);
      const response = await api.put('/ab/update', cleaned);
      // Optionally refetch or update local list
      set({ isUpdating: false });
      return { success: true, data: response.data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update appointment';
      set({ isUpdating: false, error: true, errorMessage: message });
      return { success: false, error: message };
    }
  },

  reset: () => set(getInitialState()),
}));

export default useAppointmentStore;

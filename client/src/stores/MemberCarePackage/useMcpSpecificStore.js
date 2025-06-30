import { create } from 'zustand';
import api from '@/services/api';

export const useMcpSpecificStore = create((set, get) => ({
  // state
  currentPackage: null,
  isLoading: false,
  error: null,

  // actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  clearCurrentPackage: () => set({ currentPackage: null }),

  // fetch single member care package by ID
  fetchPackageById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/mcp/pkg/${id}`);

      set({
        currentPackage: response.data,
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to fetch member care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch member care package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // create new member care package
  createPackage: async (packageData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/mcp/create', packageData);

      set({
        currentPackage: response.data,
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to create member care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create member care package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // enable/disable member care package and its services
  enablePackage: async (id, services) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/mcp/enable', {
        id,
        services,
      });

      set({
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to enable/disable member care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update package status';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // create consumption (use services from the package)
  createConsumption: async (consumptionData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/mcp/consume', consumptionData);

      set({
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to create consumption:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create consumption';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // soft delete (remove) member care package
  removePackage: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/mcp/${id}/rm`);

      // clear current package if it's the one being removed
      set((state) => ({
        currentPackage: state.currentPackage?.package?.id === id ? null : state.currentPackage,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      console.error('Failed to remove member care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove member care package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // hard delete member care package (permanent)
  deletePackage: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/mcp/${id}/del`);

      // clear current package if it's the one being deleted
      set((state) => ({
        currentPackage: state.currentPackage?.package?.id === id ? null : state.currentPackage,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      console.error('Failed to delete member care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete member care package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },
}));
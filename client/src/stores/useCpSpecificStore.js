import { create } from 'zustand';
import api from '@/services/api';

export const useCpSpecificStore = create((set, get) => ({
  // state
  currentPackage: null,
  isLoading: false,
  error: null,

  // actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  clearCurrentPackage: () => set({ currentPackage: null }),

  // fetch single package by ID
  fetchPackageById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/cp/pkg/${id}`);

      set({
        currentPackage: response.data,
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to fetch care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // update existing package
  updatePackage: async (id, packageData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put(`/cp/pkg/u`, packageData);

      // update current package with the response data
      set({
        currentPackage: response.data,
        isLoading: false,
        error: null,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to update care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // delete package
  deletePackage: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/cp/${id}/del`);

      // clear current package if it's the one being deleted
      set((state) => ({
        currentPackage: state.currentPackage?.id === id ? null : state.currentPackage,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      console.error('Failed to delete care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete package';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },
}));

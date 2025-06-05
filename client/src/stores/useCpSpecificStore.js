import { create } from 'zustand';
import api from '@/services/api';

const useCpSpecificStore = create((set, get) => ({
  // State
  currentPackage: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  clearCurrentPackage: () => set({ currentPackage: null }),

  // Fetch single package by ID
  fetchPackageById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get(`/cp/pkg/${id}`);
      
      set({ 
        currentPackage: response.data, 
        isLoading: false,
        error: null 
      });
      
      return response.data;
    } catch (err) {
      console.error('Failed to fetch care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch package';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw err;
    }
  },

  // Update existing package
  updatePackage: async (id, packageData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.put(`/cp/pkg/${id}`, packageData);
      
      // Update current package with the response data
      set({ 
        currentPackage: response.data, 
        isLoading: false,
        error: null 
      });
      
      return response.data;
    } catch (err) {
      console.error('Failed to update care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update package';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw err;
    }
  },

  // Delete package
  deletePackage: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await api.delete(`/cp/pkg/${id}`);
      
      // Clear current package if it's the one being deleted
      set((state) => ({
        currentPackage: state.currentPackage?.id === id ? null : state.currentPackage,
        isLoading: false,
        error: null
      }));
      
      return true;
    } catch (err) {
      console.error('Failed to delete care package:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete package';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw err;
    }
  }
}));

export default useCpSpecificStore;
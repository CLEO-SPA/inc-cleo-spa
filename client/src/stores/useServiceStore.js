import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useServiceStore = create(
  devtools((set, get) => ({
    // Dropdown services (id and name only)
    services: [],
    loading: false,
    error: null,

    // Individual service details cache
    serviceDetails: {},
    detailsLoading: {},
    detailsError: null,

    // Fetch services for dropdown (id and name only)
    fetchDropdownServices: async () => {
      set({ loading: true, error: null }, false, 'fetchDropdownServices/pending');
      try {
        const response = await api('/service/dropdown');
        set({ 
          services: response.data || [], 
          loading: false 
        }, false, 'fetchDropdownServices/fulfilled');
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load services';
        set({ 
          error: msg, 
          loading: false 
        }, false, 'fetchDropdownServices/rejected');
      }
    },

    // Fetch individual service details by ID
    fetchServiceDetails: async (serviceId) => {
      const state = get();
      
      // Return cached data if available
      if (state.serviceDetails[serviceId]) {
        return state.serviceDetails[serviceId];
      }

      // Set loading state for this specific service
      set({ 
        detailsLoading: { ...state.detailsLoading, [serviceId]: true },
        detailsError: null 
      }, false, `fetchServiceDetails/${serviceId}/pending`);

      try {
        const response = await api(`/service/enabled-id/${serviceId}`);
        const serviceData = response.data;
        
        set({ 
          serviceDetails: { 
            ...state.serviceDetails, 
            [serviceId]: serviceData 
          },
          detailsLoading: { 
            ...state.detailsLoading, 
            [serviceId]: false 
          }
        }, false, `fetchServiceDetails/${serviceId}/fulfilled`);

        return serviceData;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load service details';
        set({ 
          detailsLoading: { 
            ...state.detailsLoading, 
            [serviceId]: false 
          },
          detailsError: msg 
        }, false, `fetchServiceDetails/${serviceId}/rejected`);
        
        throw err;
      }
    },

    // Clear service details cache
    clearServiceDetails: () => {
      set({ 
        serviceDetails: {}, 
        detailsLoading: {},
        detailsError: null 
      }, false, 'clearServiceDetails');
    },

    // Get service details from cache
    getServiceDetails: (serviceId) => {
      return get().serviceDetails[serviceId] || null;
    },

    // Check if service details are loading
    isServiceDetailsLoading: (serviceId) => {
      return get().detailsLoading[serviceId] || false;
    },
  }))
);

export default useServiceStore;
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useCpSelectionStore = create(
  devtools((set, get) => ({
    carePackages: [],
    loading: false,
    error: null,
    carePackageDetails: {},
    detailsLoading: {},
    detailsError: null,

    // fetch care packages for dropdown (id and name only)
    fetchDropdownCarePackages: async () => {
      set({ loading: true, error: null }, false, 'fetchDropdownCarePackages/pending');
      try {
        const response = await api('/cp/dropdown');
        set({
          carePackages: response.data || [],
          loading: false,
        }, false, 'fetchDropdownCarePackages/fulfilled');
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load care packages';
        set({
          error: msg,
          loading: false,
        }, false, 'fetchDropdownCarePackages/rejected');
      }
    },

    // fetch individual care package details by ID
    fetchCarePackageDetails: async (packageId) => {
      const state = get();

      // validate packageId
      if (!packageId || packageId === 'undefined' || packageId === 'null') {
        const error = new Error(`Invalid package ID: ${packageId}`);
        console.error('fetchCarePackageDetails: Invalid package ID', packageId);
        set({ detailsError: 'Invalid package ID' }, false, 'fetchCarePackageDetails/invalidId');
        throw error;
      }

      // return cached data if available
      if (state.carePackageDetails[packageId]) {
        console.log('fetchCarePackageDetails: Returning cached data for', packageId);
        return state.carePackageDetails[packageId];
      }
      set({
        detailsLoading: { ...state.detailsLoading, [packageId]: true },
        detailsError: null,
      }, false, `fetchCarePackageDetails/${packageId}/pending`);

      try {
        const response = await api(`/cp/pkg/${packageId}`);
        const data = response.data;
        set({
          carePackageDetails: {
            ...state.carePackageDetails,
            [packageId]: data,
          },
          detailsLoading: {
            ...state.detailsLoading,
            [packageId]: false,
          },
        }, false, `fetchCarePackageDetails/${packageId}/fulfilled`);

        return data;
      } catch (err) {
        console.error('fetchCarePackageDetails: Error for', packageId, err);
        const msg = err.response?.data?.message || err.message || 'Failed to load care package details';
        set({
          detailsLoading: {
            ...state.detailsLoading,
            [packageId]: false,
          },
          detailsError: msg,
        }, false, `fetchCarePackageDetails/${packageId}/rejected`);
        throw err;
      }
    },

    // clear care package details cache
    clearCarePackageDetails: () => {
      set({
        carePackageDetails: {},
        detailsLoading: {},
        detailsError: null,
      }, false, 'clearCarePackageDetails');
    },

    // get care package details from cache
    getCarePackageDetails: (packageId) => {
      return get().carePackageDetails[packageId] || null;
    },

    // check if care package details are loading
    isCarePackageDetailsLoading: (packageId) => {
      return get().detailsLoading[packageId] || false;
    },
  }))
);

export default useCpSelectionStore;
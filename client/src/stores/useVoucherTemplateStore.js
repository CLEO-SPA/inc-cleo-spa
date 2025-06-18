import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useVoucherTemplateStore = create(
  devtools((set, get) => ({
    // Dropdown voucher templates (id and name only)
    voucherTemplates: [],
    loading: false,
    error: null,

    // Individual voucher template details cache
    voucherTemplateDetails: {},
    detailsLoading: {},
    detailsError: null,

    // Fetch voucher templates for dropdown (id and name only)
    fetchDropdownVoucherTemplates: async () => {
      set({ loading: true, error: null }, false, 'fetchDropdownVoucherTemplates/pending');
      try {
        const response = await api('/voucher-template/dropdown');
        set({
          voucherTemplates: response.data || [],
          loading: false,
        }, false, 'fetchDropdownVoucherTemplates/fulfilled');
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load voucher templates';
        set({
          error: msg,
          loading: false,
        }, false, 'fetchDropdownVoucherTemplates/rejected');
      }
    },

    // Fetch individual voucher template details by ID
    fetchVoucherTemplateDetails: async (templateId) => {
      const state = get();

      // Return cached data if available
      if (state.voucherTemplateDetails[templateId]) {
        return state.voucherTemplateDetails[templateId];
      }

      set({
        detailsLoading: { ...state.detailsLoading, [templateId]: true },
        detailsError: null,
      }, false, `fetchVoucherTemplateDetails/${templateId}/pending`);

      try {
        const response = await api(`/voucher-template/${templateId}`);
        const data = response.data;

        set({
          voucherTemplateDetails: {
            ...state.voucherTemplateDetails,
            [templateId]: data,
          },
          detailsLoading: {
            ...state.detailsLoading,
            [templateId]: false,
          },
        }, false, `fetchVoucherTemplateDetails/${templateId}/fulfilled`);

        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load voucher template details';
        set({
          detailsLoading: {
            ...state.detailsLoading,
            [templateId]: false,
          },
          detailsError: msg,
        }, false, `fetchVoucherTemplateDetails/${templateId}/rejected`);
        throw err;
      }
    },

    // Clear voucher template details cache
    clearVoucherTemplateDetails: () => {
      set({
        voucherTemplateDetails: {},
        detailsLoading: {},
        detailsError: null,
      }, false, 'clearVoucherTemplateDetails');
    },

    // Get voucher template details from cache
    getVoucherTemplateDetails: (templateId) => {
      return get().voucherTemplateDetails[templateId] || null;
    },

    // Check if voucher template details are loading
    isVoucherTemplateDetailsLoading: (templateId) => {
      return get().detailsLoading[templateId] || false;
    },
  }))
);

export default useVoucherTemplateStore;

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const getInitialState = () => ({
  // Pagination states
  voucherTemplates: [],
  currentPage: 1,
  currentLimit: 10,
  totalPages: 0,
  totalCount: 0,
  // Filters
  searchTerm: '',
  startDate_utc: null,
  endDate_utc: null,
  createdBy: '',
  status: '',
  // UI states
  loading: false,
  isFetching: false,
  isFetchingSingle: false,
  isDeleting: false,
  error: false,
  errorMessage: null,
  selectedVoucherTemplateId: null,
  selectedVoucherTemplate: null,
});

function emptyStringToNull(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) =>
      value === "" ? [key, null] : [key, value]
    )
  );
}

export const useVoucherTemplateListStore = create(
  devtools((set, get) => ({
    ...getInitialState(),

    // Core Pagination Fetch - now accepts parameters
    fetchVoucherTemplates: async (params = {}) => {
      set({ isFetching: true, error: false, errorMessage: null });

      const state = get();
      const queryParams = {
        page: params.page || state.currentPage,
        limit: params.limit || state.currentLimit,
        search: params.search ?? state.searchTerm,
        createdBy: params.createdBy ?? state.createdBy,
        startDate_utc: params.startDate_utc ?? state.startDate_utc,
        endDate_utc: params.endDate_utc ?? state.endDate_utc,
        status: params.status ?? state.status,
      };

      // Update state with new parameters
      if (params.page) set({ currentPage: params.page });
      if (params.limit) set({ currentLimit: params.limit });
      if (params.search !== undefined) set({ searchTerm: params.search });
      if (params.createdBy !== undefined) set({ createdBy: params.createdBy });
      if (params.startDate_utc !== undefined) set({ startDate_utc: params.startDate_utc });
      if (params.endDate_utc !== undefined) set({ endDate_utc: params.endDate_utc });
      if (params.status !== undefined) set({ status: params.status });

      try {
        const response = await api.get('/voucher-template', { params: queryParams });
        
        // Handle the structured response from your updated controller
        const { data, pageInfo } = response.data;

        set({
          voucherTemplates: data,
          totalCount: pageInfo.totalCount,
          totalPages: pageInfo.totalPages,
          isFetching: false,
          error: false,
          errorMessage: null,
        });
      } catch (error) {
        console.error('Error fetching voucher templates:', error);
        set({
          voucherTemplates: [],
          totalCount: 0,
          totalPages: 0,
          isFetching: false,
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to fetch voucher templates',
        });
      }
    },

    // Pagination controls
    goToPage: (pageNumber) => {
      const { currentLimit, searchTerm } = get();
      get().fetchVoucherTemplates({
        page: pageNumber,
        limit: currentLimit,
        search: searchTerm,
      });
    },

    goToNextPage: () => {
      const { currentPage, totalPages } = get();
      if (currentPage < totalPages) {
        get().goToPage(currentPage + 1);
      }
    },

    goToPreviousPage: () => {
      const { currentPage } = get();
      if (currentPage > 1) {
        get().goToPage(currentPage - 1);
      }
    },

    // Filter actions
    setSearchTerm: (term) => {
      const { currentLimit, startDate_utc, endDate_utc, createdBy, status } = get();
      get().fetchVoucherTemplates({
        page: 1,
        limit: currentLimit,
        search: term,
        startDate_utc,
        endDate_utc,
        createdBy,
        status,
      });
    },

    setDateRange: (startDate, endDate) => {
      const { currentLimit, searchTerm, createdBy, status } = get();
      get().fetchVoucherTemplates({
        page: 1,
        limit: currentLimit,
        search: searchTerm,
        startDate_utc: startDate,
        endDate_utc: endDate,
        createdBy,
        status,
      });
    },

    setCreatedBy: (creatorName) => {
      const { currentLimit, searchTerm, startDate_utc, endDate_utc, status } = get();
      get().fetchVoucherTemplates({
        page: 1,
        limit: currentLimit,
        search: searchTerm,
        startDate_utc,
        endDate_utc,
        createdBy: creatorName,
        status,
      });
    },

    setStatus: (statusValue) => {
      const { currentLimit, searchTerm, startDate_utc, endDate_utc, createdBy } = get();
      get().fetchVoucherTemplates({
        page: 1,
        limit: currentLimit,
        search: searchTerm,
        startDate_utc,
        endDate_utc,
        createdBy,
        status: statusValue,
      });
    },

    setLimit: (newLimit) => {
      const { searchTerm, startDate_utc, endDate_utc, createdBy, status } = get();
      get().fetchVoucherTemplates({
        page: 1,
        limit: newLimit,
        search: searchTerm,
        startDate_utc,
        endDate_utc,
        createdBy,
        status,
      });
    },

    // Single voucher template fetch
    getVoucherTemplateById: async (id) => {
      set({ isFetchingSingle: true, error: false, errorMessage: null });

      try {
        const response = await api.get(`/voucher-template/${id}`);
        set({
          selectedVoucherTemplate: response.data,
          selectedVoucherTemplateId: id,
          isFetchingSingle: false,
        });
        return { success: true };
      } catch (error) {
        console.error('Error fetching voucher template by ID:', error);
        set({
          selectedVoucherTemplate: null,
          isFetchingSingle: false,
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to fetch voucher template',
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // Delete voucher template
    deleteVoucherTemplate: async (id) => {
      set({ isDeleting: true, error: false, errorMessage: null });

      try {
        await api.delete(`/voucher-template/${id}`);
        const { currentPage, currentLimit, searchTerm, voucherTemplates } = get();

        // If this was the last item on the current page and we're not on page 1,
        // go back one page
        const newPage = voucherTemplates.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

        await get().fetchVoucherTemplates({ page: newPage, limit: currentLimit, search: searchTerm });
        set({ isDeleting: false });
        return { success: true };
      } catch (error) {
        set({
          isDeleting: false,
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to delete voucher template'
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // Utility actions
    setSelectedVoucherTemplateId: (id) => set({ selectedVoucherTemplateId: id }),

    // Refresh list after CRUD operations (to be called from form store)
    refreshList: async () => {
      const { currentPage, currentLimit, searchTerm } = get();
      await get().fetchVoucherTemplates({ page: currentPage, limit: currentLimit, search: searchTerm });
    },

    reset: () => set(getInitialState()),
  }))
);
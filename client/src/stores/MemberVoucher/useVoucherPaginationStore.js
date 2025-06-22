import { create } from 'zustand';
import api from '@/services/api';
import { handleApiError } from '@/utils/errorHandlingUtils';

const getInitialState = () => ({
  // Loading and error states
  loading: false,
  success: false,
  error: false,
  errorMessage: null,

  // Pagination states
  currentPage: 1,
  currentLimit: 10,
  startCursor: null,
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  searchTerm: '',
  vouchers: [],
  totalCount: null,
  isOffsetMode: false,
  lastAction: null,
});

export const useVoucherPaginationStore = create((set, get) => ({
  ...getInitialState(),

  // Initialize pagination with optional parameters
  initializePagination: async (initialLimit = 10, initialSearchTerm = '') => {
    set({
      ...getInitialState(),
      currentLimit: initialLimit,
      searchTerm: initialSearchTerm,
    });
    
    // Fetch initial data after state is reset
    await get().fetchVouchers();
  },

  // Main fetch function
  fetchVouchers: async () => {
    if (get().loading) {
      set({ success: false, error: true, errorMessage: "Another process is running." });
      return;
    }

    set({ loading: true, success: false, error: false, errorMessage: null });

    try {
      const state = get();
      const { currentPage, currentLimit, startCursor, endCursor, searchTerm, isOffsetMode, lastAction } = state;

      const queryParams = {
        limit: currentLimit,
        searchTerm: searchTerm || undefined,
      };

      // Determine pagination strategy
      if (isOffsetMode) {
        queryParams.page = currentPage;
      } else {
        // Cursor-based logic
        if (lastAction === 'next' && endCursor) {
          queryParams.after = endCursor;
        } else if (lastAction === 'prev' && startCursor) {
          queryParams.before = startCursor;
        }
      }

      const response = await api.get('/mv/v', { params: queryParams });

      const data = response.data.data;

      // Update state with fetched data
      set({
        loading: false,
        success: true,
        error: false,
        errorMessage: null,
        vouchers: data.data,
        startCursor: data.pageInfo.startCursor,
        endCursor: data.pageInfo.endCursor,
        hasNextPage: data.pageInfo.hasNextPage,
        hasPreviousPage: data.pageInfo.hasPreviousPage,
        totalCount: data.pageInfo.totalCount !== undefined 
          ? data.pageInfo.totalCount 
          : state.totalCount,
      });

      console.log('State after fetchVouchers:', get());
      get().setSuccessWithTimeout();

    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
      const errorMessage = handleApiError(error);
      set({ 
        loading: false,
        error: true, 
        errorMessage: errorMessage,
        success: false 
      });
    }
  },

  // Navigation actions
  goToNextPage: () => {
    const state = get();
    if (!state.hasNextPage || state.loading) return;

    set((state) => ({
      currentPage: state.currentPage + 1,
      isOffsetMode: false,
      lastAction: 'next',
    }));
    get().fetchVouchers();
  },

  goToPreviousPage: () => {
    const state = get();
    if (!state.hasPreviousPage || state.loading) return;

    set((state) => ({
      currentPage: state.currentPage - 1,
      isOffsetMode: false,
      lastAction: 'prev',
    }));
    get().fetchVouchers();
  },

  goToPage: (pageNumber) => {
    if (pageNumber < 1 || get().loading) return;

    set({
      currentPage: pageNumber,
      isOffsetMode: true,
      startCursor: null,
      endCursor: null,
      lastAction: 'jump',
    });
    get().fetchVouchers();
  },

  // Filter and limit actions
  setSearchTerm: (term) => {
    set({
      searchTerm: term,
      currentPage: 1,
      startCursor: null,
      endCursor: null,
      totalCount: null,
      isOffsetMode: false,
      lastAction: 'search',
    });
    get().fetchVouchers();
  },

  setLimit: (newLimit) => {
    if (newLimit < 1 || get().loading) return;

    set({
      currentLimit: newLimit,
      currentPage: 1,
      startCursor: null,
      endCursor: null,
      totalCount: null,
      isOffsetMode: false,
      lastAction: 'limit',
    });
    get().fetchVouchers();
  },

  // Utility functions
  setSuccessWithTimeout: () => {
    set({ success: true, error: false, errorMessage: null });

    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      set((state) => ({
        ...state,
        success: false
      }));
    }, 3000);
  },

  clearError: () => {
    set({ error: false, errorMessage: null });
  },

  setError: (errorMessage) => {
    set({ error: true, errorMessage: errorMessage });
  },

  // Reset store to initial state
  reset: () => set(getInitialState()),

  // Refresh current page
  refresh: () => {
    get().fetchVouchers();
  },

  // Get current voucher by ID
  getVoucherById: (id) => {
    const state = get();
    return state.vouchers.find(voucher => voucher.id === id);
  },

  // Check if there are any vouchers
  hasVouchers: () => {
    const state = get();
    return state.vouchers && state.vouchers.length > 0;
  },

  // Get pagination info
  getPaginationInfo: () => {
    const state = get();
    return {
      currentPage: state.currentPage,
      totalCount: state.totalCount,
      hasNextPage: state.hasNextPage,
      hasPreviousPage: state.hasPreviousPage,
      currentLimit: state.currentLimit,
      isOffsetMode: state.isOffsetMode,
    };
  },
}));
import { create } from 'zustand';
import api from '@/services/api';

export const useCpPaginationStore = create((set, get) => ({
  // States
  currentPage: 1,
  currentLimit: 10,
  startCursor: null,
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  searchTerm: '',
  carePackages: [],
  totalCount: null,
  isOffsetMode: false,
  isLoading: false,
  error: null,
  lastAction: null,
  purchaseCountData: [],
  isPurchaseCountLoading: false,
  purchaseCountError: null,

  // Actions
  initializePagination: (initialLimit = 10, initialSearchTerm = '') => {
    set({
      currentPage: 1,
      currentLimit: initialLimit,
      startCursor: null,
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      searchTerm: initialSearchTerm,
      carePackages: [],
      totalCount: null,
      isOffsetMode: false,
      isLoading: false,
      error: null,
      lastAction: null,
      purchaseCountData: [],
      isPurchaseCountLoading: false,
      purchaseCountError: null,
    });
    // Fetch initial data after state is set
    get().fetchCarePackages();
  },

  setPaginationData: (data, pageInfo, searchTerm) =>
    set((state) => {
      const newState = {
        carePackages: data,
        startCursor: pageInfo.startCursor,
        endCursor: pageInfo.endCursor,
        hasNextPage: pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.hasPreviousPage,
        totalCount: pageInfo.totalCount !== undefined ? pageInfo.totalCount : state.totalCount,
        searchTerm: searchTerm !== undefined ? searchTerm : state.searchTerm,
        isLoading: false, // Turn off loading after data is set
        error: null, // Clear any previous error
      };
      console.log('State after setPaginationData:', { ...state, ...newState });
      return newState;
    }),

  fetchCarePackages: async () => {
    set({ isLoading: true, error: null }); // Set loading true, clear previous error

    const state = get(); // Get the current state
    const { currentPage, currentLimit, startCursor, endCursor, searchTerm, isOffsetMode, lastAction } = state;

    const queryParams = {
      limit: currentLimit,
      searchTerm: searchTerm || undefined, // Only include if not empty
    };

    // Determine pagination strategy
    if (isOffsetMode) {
      queryParams.page = currentPage;
    } else {
      // Cursor-based logic:
      // If going next, use endCursor of previous page as 'after'
      if (lastAction === 'next' && endCursor) {
        queryParams.after = endCursor;
      }
      // If going previous, use startCursor of previous page as 'before'
      else if (lastAction === 'prev' && startCursor) {
        queryParams.before = startCursor;
      }
      // For initial load or new search/filter (where cursors might be null),
      // no 'after' or 'before' is sent, so it fetches the first page.
    }

    try {
      // Use your imported API service
      const response = await api.get('/cp/pkg', { params: queryParams });

      console.log(response);

      // Update state with fetched data
      get().setPaginationData(response.data.data, response.data.pageInfo, searchTerm);
    } catch (err) {
      console.error('Failed to fetch care packages:', err);
      set({ error: err.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  // Action to navigate to the next page (cursor-based)
  goToNextPage: () => {
    set((state) => ({
      currentPage: state.currentPage + 1,
      isOffsetMode: false,
      lastAction: 'next', // Track the action for `WorkspaceCarePackages`
    }));
    get().fetchCarePackages(); // Trigger fetch
  },

  // Action to navigate to the previous page (cursor-based)
  goToPreviousPage: () => {
    set((state) => ({
      currentPage: state.currentPage - 1,
      isOffsetMode: false,
      lastAction: 'prev', // Track the action for `WorkspaceCarePackages`
    }));
    get().fetchCarePackages(); // Trigger fetch
  },

  // Action for direct jump to page (offset-based)
  goToPage: (pageNumber) => {
    set((state) => ({
      currentPage: pageNumber,
      isOffsetMode: true, // Switch to offset mode
      startCursor: null, // Clear cursors when jumping by page number
      endCursor: null,
      lastAction: 'jump', // Track action
    }));
    get().fetchCarePackages(); // Trigger fetch
  },

  // Actions that should reset to the first page and potentially switch mode
  setSearchTerm: (term) => {
    set((state) => ({
      searchTerm: term,
      currentPage: 1,
      startCursor: null,
      endCursor: null,
      totalCount: null,
      isOffsetMode: false, // Reset to cursor mode for new search
      lastAction: 'search', // Track action
    }));
    get().fetchCarePackages(); // Trigger fetch
  },

  setLimit: (newLimit) => {
    set((state) => ({
      currentLimit: newLimit,
      currentPage: 1,
      startCursor: null,
      endCursor: null,
      totalCount: null,
      isOffsetMode: false, // Reset to cursor mode for new limit
      lastAction: 'limit', // Track action
    }));
    get().fetchCarePackages(); // Trigger fetch
  },

  // used to fetch purchase count data
  fetchPurchaseCount: async () => {
    set({ isPurchaseCountLoading: true, purchaseCountError: null });

    try {
      const response = await api.get('/cp/pkgpc');

      const purchaseCountArray = Object.entries(response.data).map(([packageId, data]) => ({
        packageId: packageId,
        purchase_count: data.purchase_count,
        is_purchased: data.is_purchased,
      }));

      set({
        purchaseCountData: response.data, 
        purchaseCountArray: purchaseCountArray,
        isPurchaseCountLoading: false,
        purchaseCountError: null,
      });
    } catch (err) {
      console.error('Failed to fetch purchase count data:', err);
      set({
        purchaseCountError: err.message || 'Failed to fetch purchase count data',
        isPurchaseCountLoading: false,
      });
    }
  },
}));

// src/stores/paymentMethodStore.ts
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  paymentMethods: [],
  dropdownPaymentMethods: [], // Separate array for dropdown data
  currentPage: 1,
  currentLimit: 10,
  totalPages: 0,
  totalCount: 0,
  searchTerm: '',
  loading: false, // Add this for dropdown component compatibility
  isFetching: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: false,
  errorMessage: null,
  selectedPaymentMethodId: null,
});

const usePaymentMethodStore = create((set, get) => ({
  ...getInitialState(),

  fetchPaymentMethods: async (params = {}) => {
    set({ isFetching: true, error: false, errorMessage: null });

    const state = get();
    const queryParams = {
      page: params.page || state.currentPage,
      limit: params.limit || state.currentLimit,
      search: params.search ?? state.searchTerm,
    };

    if (params.page) set({ currentPage: params.page });
    if (params.limit) set({ currentLimit: params.limit });
    if (params.search !== undefined) set({ searchTerm: params.search });

    try {
      const response = await api.get('/payment-method', { params: queryParams });
      const { data, pageInfo } = response.data;

      set({
        paymentMethods: data,
        totalCount: pageInfo.totalCount,
        totalPages: pageInfo.totalPages,
        isFetching: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        paymentMethods: [],
        totalCount: 0,
        totalPages: 0,
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch payment methods',
      });
    }
  },

  // Pagination controls
  goToPage: (pageNumber) => {
    const { currentLimit, searchTerm } = get();
    get().fetchPaymentMethods({ page: pageNumber, limit: currentLimit, search: searchTerm });
  },

  goToNextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) get().goToPage(currentPage + 1);
  },

  goToPreviousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) get().goToPage(currentPage - 1);
  },

  setSearchTerm: (term) => {
    const { currentLimit } = get();
    get().fetchPaymentMethods({ page: 1, limit: currentLimit, search: term });
  },

  setLimit: (newLimit) => {
    const { searchTerm } = get();
    get().fetchPaymentMethods({ page: 1, limit: newLimit, search: searchTerm });
  },

  // Improved dropdown-specific method
  fetchDropdownPaymentMethods: async () => {
    set({ loading: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/payment-method/visible');
      set({
        dropdownPaymentMethods: response.data, // Use separate array for dropdown
        loading: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        dropdownPaymentMethods: [],
        loading: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch visible payment methods',
      });
    }
  },


  // CRUD Actions
  fetchPaymentMethodById: async (id) => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get(`/payment-method/${id}`);
      set({
        selectedPaymentMethodId: id,
        selectedPaymentMethod: response.data,
        isFetching: false,
      });
      return { success: true, data: response.data };
    } catch (error) {
      set({
        selectedPaymentMethodId: null,
        selectedPaymentMethod: null,
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch payment method',
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  createPaymentMethod: async (data) => {
    set({ isCreating: true, error: false, errorMessage: null });

    try {
      console.log(data)
      await api.post('/payment-method', data);
      const { currentPage, currentLimit, searchTerm } = get();
      await get().fetchPaymentMethods({ page: currentPage, limit: currentLimit, search: searchTerm });
      set({ isCreating: false });
      return { success: true };
    } catch (error) {
      set({
        isCreating: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to create payment method',
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  updatePaymentMethod: async (id, data) => {
    set({ isUpdating: true, error: false, errorMessage: null });

    try {
      const response = await api.put(`/payment-method/${id}`, data); // <-- capture response here
      const { currentPage, currentLimit, searchTerm } = get();
      await get().fetchPaymentMethods({ page: currentPage, limit: currentLimit, search: searchTerm });
      set({ isUpdating: false });
      return { 
        success: true,
        data: response.data  // Return the updated response data
     };
    } catch (error) {
      set({
        isUpdating: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to update payment method',
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  deletePaymentMethod: async (id) => {
    set({ isDeleting: true, error: false, errorMessage: null });

    try {
      await api.delete(`/payment-method/${id}`);
      const { currentPage, currentLimit, searchTerm, paymentMethods } = get();

      const newPage = paymentMethods.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      await get().fetchPaymentMethods({ page: newPage, limit: currentLimit, search: searchTerm });
      set({ isDeleting: false });
      return { success: true };
    } catch (error) {
      set({
        isDeleting: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to delete payment method',
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  setSelectedPaymentMethodId: (id) => set({ selectedPaymentMethodId: id }),

  reset: () => set(getInitialState()),
}));

export default usePaymentMethodStore;
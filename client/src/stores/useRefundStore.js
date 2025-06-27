import { create } from 'zustand';
import api from '@/services/api';

const useRefundStore = create((set) => ({
  serviceTransactions: [],
  isLoading: false,
  error: null,

  fetchServiceTransactions: async ({ memberId, receiptNo, limit = 5, offset = 0 }) => {
    //console.log('Fetching service transactions with:', { memberId, receiptNo });
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (memberId !== undefined) params.member_id = memberId;
      if (receiptNo) params.receipt_no = receiptNo;
      params.limit = limit;
      params.offset = offset;

      const response = await api.get('/refund/service-transactions', { params });

      set({
        serviceTransactions: response.data.transactions,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch service transactions',
        isLoading: false,
      });
    }
  },

  clear: () => set({ serviceTransactions: [], error: null, isLoading: false }),
}));

export default useRefundStore;


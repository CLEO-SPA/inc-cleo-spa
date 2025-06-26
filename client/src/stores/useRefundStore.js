import { create } from 'zustand';
import api from '@/services/api';

const useRefundStore = create((set) => ({
  serviceTransactions: [],
  isLoading: false,
  error: null,

  fetchServiceTransactions: async (memberId) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get('/refund/service-transactions', {
        params: { member_id: memberId }
      });

      set({ serviceTransactions: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch service transactions',
        isLoading: false
      });
    }
  },

  clear: () => set({ serviceTransactions: [], error: null, isLoading: false }),
}));

export default useRefundStore;


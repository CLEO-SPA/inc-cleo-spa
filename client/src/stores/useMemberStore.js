// src/stores/memberStore.ts
import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  members: [],
  isFetching: false,
  error: false,
  errorMessage: null,
});

const useMemberStore = create((set) => ({
  ...getInitialState(),

  fetchDropdownMembers: async () => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/member/dropdown');
      set({
        members: response.data,
        isFetching: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        members: [],
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch members',
      });
    }
  },

  reset: () => set(getInitialState()),
}));

export default useMemberStore;

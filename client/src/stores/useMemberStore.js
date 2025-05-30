import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  members: [],
  totalPages: 0,

  loading: false,
  error: false,
  errorMessage: null,

  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isFetching: false,

  selectedMemberId: null,
});

const useMemberStore = create((set, get) => ({
  ...getInitialState(),

  fetchMembers: async (params = {}) => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/member', { params });
      const { members, totalPages } = response.data;

      set({
        members,
        totalPages,
        isFetching: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        isFetching: false,
        error: true,
        errorMessage: error.message || 'Failed to fetch members',
      });
    }
  },

  createMember: async (data) => {
    set({ isCreating: true, error: false, errorMessage: null });

    try {
      await api.post('/member', data);
      await get().fetchMembers(); // refresh list
      set({ isCreating: false });
      return { success: true };
    } catch (error) {
      set({ isCreating: false, error: true, errorMessage: error.message });
      return { success: false, error: error.message };
    }
  },

  updateMember: async (id, data) => {
    set({ isUpdating: true, error: false, errorMessage: null });

    try {
      await api.put(`/member/${id}`, data);
      await get().fetchMembers(); // refresh list
      set({ isUpdating: false });
      return { success: true };
    } catch (error) {
      set({ isUpdating: false, error: true, errorMessage: error.message });
      return { success: false, error: error.message };
    }
  },

  deleteMember: async (id) => {
    set({ isDeleting: true, error: false, errorMessage: null });

    try {
      await api.delete(`/member/${id}`);
      await get().fetchMembers(); // refresh list
      set({ isDeleting: false });
      return { success: true };
    } catch (error) {
      set({ isDeleting: false, error: true, errorMessage: error.message });
      return { success: false, error: error.message };
    }
  },

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  reset: () => set(getInitialState()),
}));

export default useMemberStore;

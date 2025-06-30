import { create } from 'zustand';
import api from '@/services/api';

const useRoleStore = create((set) => ({
  roles: [],
  loading: false,
  error: null,
  fetchRoles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/auth/roles');
      set({ roles: response.data, loading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
    }
  },
}));

export default useRoleStore;

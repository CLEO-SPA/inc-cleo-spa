import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useUsersStore = create(
  devtools((set, get) => ({
    // State
    users: [],
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    currentLimit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    searchTerm: '',
    isLoading: false,
    error: null,
    actioningUsers: new Set(),
    inviteDialogOpen: false,
    selectedUser: null,
    invitationLink: '',
    isGeneratingLink: false,

    // Initialize pagination
    initializePagination: async (limit = 10, search = '') => {
      set({ isLoading: true, currentLimit: limit, searchTerm: search });
      try {
        const response = await api.get('/auth/users', {
          params: { page: 1, limit, search },
        });

        set({
          users: response.data.users,
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
          hasNextPage: response.data.hasNextPage,
          hasPreviousPage: response.data.hasPreviousPage,
          error: null,
        });
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to fetch users' });
      } finally {
        set({ isLoading: false });
      }
    },

    // Fetch users with pagination
    fetchUsers: async () => {
      const { currentPage, currentLimit, searchTerm } = get();
      set({ isLoading: true });

      try {
        const response = await api.get('/auth/users', {
          params: { page: currentPage, limit: currentLimit, search: searchTerm },
        });

        set({
          users: response.data.users,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
          hasNextPage: response.data.hasNextPage,
          hasPreviousPage: response.data.hasPreviousPage,
          error: null,
        });
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to fetch users' });
      } finally {
        set({ isLoading: false });
      }
    },

    // Pagination controls
    goToNextPage: () => {
      const { currentPage, hasNextPage, fetchUsers } = get();
      if (hasNextPage) {
        set({ currentPage: currentPage + 1 });
        fetchUsers();
      }
    },

    goToPreviousPage: () => {
      const { currentPage, hasPreviousPage, fetchUsers } = get();
      if (hasPreviousPage) {
        set({ currentPage: currentPage - 1 });
        fetchUsers();
      }
    },

    goToPage: (page) => {
      set({ currentPage: page });
      get().fetchUsers();
    },

    setLimit: (limit) => {
      set({ currentLimit: limit, currentPage: 1 });
      get().fetchUsers();
    },

    setSearchTerm: (term) => {
      set({ searchTerm: term, currentPage: 1 });
      get().fetchUsers();
    },

    // User management functions
    createUser: async (userData) => {
      set({ isLoading: true });
      try {
        const response = await api.post('/auth/create', userData);
        await get().fetchUsers();
        return response.data;
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to create user' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    updateUser: async (userId, userData) => {
      set((state) => ({ actioningUsers: new Set(state.actioningUsers).add(userId) }));
      try {
        await api.put(`/auth/users/${userId}`, userData);
        await get().fetchUsers();
        return true;
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to update user' });
        throw error;
      } finally {
        set((state) => {
          const newSet = new Set(state.actioningUsers);
          newSet.delete(userId);
          return { actioningUsers: newSet };
        });
      }
    },

    deleteUser: async (userId) => {
      set((state) => ({ actioningUsers: new Set(state.actioningUsers).add(userId) }));
      try {
        await api.delete(`/auth/users/${userId}`);
        await get().fetchUsers();
        return true;
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to delete user' });
        throw error;
      } finally {
        set((state) => {
          const newSet = new Set(state.actioningUsers);
          newSet.delete(userId);
          return { actioningUsers: newSet };
        });
      }
    },

    // Invitation link regeneration
    openInviteDialog: (user) => {
      set({ inviteDialogOpen: true, selectedUser: user, invitationLink: '' });
    },

    closeInviteDialog: () => {
      set({ inviteDialogOpen: false, selectedUser: null, invitationLink: '' });
    },

    regenerateInvitationLink: async (email) => {
      set({ isGeneratingLink: true });
      try {
        const response = await api.post('/auth/regenerate-uri', { email });
        set({ invitationLink: response.data.inviteUrl });
        return response.data.inviteUrl;
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to regenerate invitation link' });
        throw error;
      } finally {
        set({ isGeneratingLink: false });
      }
    },

    // Clear error
    clearError: () => set({ error: null }),
  }))
);

export default useUsersStore;

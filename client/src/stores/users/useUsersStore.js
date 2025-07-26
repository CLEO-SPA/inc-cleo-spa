import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useUsersStore = create(
  devtools((set, get) => ({
    // Pagination
    users: [],
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    currentLimit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    searchTerm: '',

    actioningUsers: new Set(),
    inviteDialogOpen: false,
    selectedUser: null,
    invitationLink: '',
    isGeneratingLink: false,
    lastAction: null,

    isLoading: false,
    error: null,

    // Set pagination data
    setPaginationData: (data, pageInfo, searchTerm) =>
      set((state) => ({
        users: data,
        currentPage: pageInfo.page || state.currentPage,
        totalPages: pageInfo.totalPages || 0,
        totalCount: pageInfo.totalCount || 0,
        hasNextPage: pageInfo.hasNextPage || false,
        hasPreviousPage: pageInfo.hasPreviousPage || false,
        searchTerm: searchTerm !== undefined ? searchTerm : state.searchTerm,
        isLoading: false,
        error: null,
      })),

    // Initialize pagination
    initializePagination: async (limit = 10, search = '') => {
      set({
        isLoading: true,
        currentLimit: limit,
        searchTerm: search,
        currentPage: 1,
        lastAction: 'initialize',
      });

      try {
        const response = await api.get('/auth/users', {
          params: { page: 1, limit, search },
        });

        console.log(response);

        // Extract users and page info from response
        const users = response.data.data || [];
        const pageInfo = {
          page: 1,
          totalPages: Math.ceil((response.data.pageInfo?.totalCount || 0) / limit),
          totalCount: response.data.pageInfo?.totalCount || 0,
          hasNextPage: response.data.pageInfo?.hasNextPage || false,
          hasPreviousPage: response.data.pageInfo?.hasPreviousPage || false,
        };

        // Use the standardized method to set pagination data
        get().setPaginationData(users, pageInfo, search);
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to fetch users', isLoading: false });
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

        // Extract users and page info from response
        const users = response.data.data || [];
        const pageInfo = {
          page: currentPage,
          totalPages: Math.ceil((response.data.pageInfo?.totalCount || 0) / currentLimit),
          totalCount: response.data.pageInfo?.totalCount || 0,
          hasNextPage: response.data.pageInfo?.hasNextPage || false,
          hasPreviousPage: response.data.pageInfo?.hasPreviousPage || false,
        };

        // Use the standardized method to set pagination data
        get().setPaginationData(users, pageInfo, searchTerm);
      } catch (error) {
        set({ error: error.response?.data?.message || 'Failed to fetch users', isLoading: false });
      }
    },

    // Pagination controls
    goToNextPage: () => {
      const { currentPage, hasNextPage } = get();
      if (hasNextPage) {
        set({ currentPage: currentPage + 1, lastAction: 'next' });
        get().fetchUsers();
      }
    },

    goToPreviousPage: () => {
      const { currentPage, hasPreviousPage } = get();
      if (hasPreviousPage) {
        set({ currentPage: currentPage - 1, lastAction: 'prev' });
        get().fetchUsers();
      }
    },

    goToPage: (page) => {
      set({ currentPage: page, lastAction: 'jump' });
      get().fetchUsers();
    },

    setLimit: (limit) => {
      set({ currentLimit: limit, currentPage: 1, lastAction: 'limit' });
      get().fetchUsers();
    },

    setSearchTerm: (term) => {
      set({ searchTerm: term, currentPage: 1, lastAction: 'search' });
      get().fetchUsers();
    },

    // User management functions
    createUser: async (userData) => {
      set({ isCreating: true, error: '', success: false });

      try {
        const response = await api.post('/auth/create', userData);

        const inviteUrl = response.data.inviteLink;
        set({
          success: response.message || 'User created successfully',
          invitationLink: inviteUrl,
        });

        return { inviteUrl };
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to create user. Please try again.';
        set({ error: message });
        throw new Error(message);
      } finally {
        set({ isCreating: false });
      }
    },

    updateUser: async (userId, userData) => {
      set((state) => ({ actioningUsers: new Set(state.actioningUsers).add(userId) }));
      try {
        const response = await api.put(`/auth/users/${userId}`, userData);

        // If invite URL is returned (due to email change), store it
        if (response.data.inviteUrl) {
          set({ invitationLink: response.data.inviteUrl });
        }

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

        // Updated key is `callbackUrl` instead of `inviteUrl`
        set({ invitationLink: response.data.callbackUrl });

        return response.data.callbackUrl;
      } catch (error) {
        set({
          error: error.response?.data?.message || 'Failed to regenerate invitation link',
        });
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

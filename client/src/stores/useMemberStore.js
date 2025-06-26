import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  // Pagination states
  members: [],
  currentPage: 1,
  currentLimit: 10,
  totalPages: 0,
  totalCount: 0,
  // Filters
  searchTerm: '',
  startDate_utc: null,
  endDate_utc: null,
  createdBy: '',  
  // UI & CRUD states
  loading: false,
  isFetching: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: false,
  errorMessage: null,
  selectedMemberId: null,
});

function emptyStringToNull(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Check if value is a string
      if (typeof value === 'string') {
        // Trim whitespace from both ends
        const trimmedValue = value.trim();
        // Convert empty string to null after trimming
        return trimmedValue === "" ? [key, null] : [key, trimmedValue];
      }
      // Return non-string values as-is
      return [key, value];
    })
  );
}

const useMemberStore = create((set, get) => ({
  ...getInitialState(),

  // Core Pagination Fetch - now accepts parameters
 fetchMembers: async (params = {}) => {
  set({ isFetching: true, error: false, errorMessage: null });

  const state = get();
  const queryParams = {
  page: params.page || state.currentPage,
  limit: params.limit || state.currentLimit,
  search: params.search ?? state.searchTerm,
  createdBy: params.createdBy ?? state.createdBy,
  startDate_utc: params.startDate_utc ?? state.startDate_utc,
  endDate_utc: params.endDate_utc ?? state.endDate_utc,
};

// Update state with new parameters
if (params.page) set({ currentPage: params.page });
if (params.limit) set({ currentLimit: params.limit });
if (params.search !== undefined) set({ searchTerm: params.search });
if (params.createdBy !== undefined) set({ createdBy: params.createdBy });
if (params.startDate_utc !== undefined) set({ startDate_utc: params.startDate_utc });
if (params.endDate_utc !== undefined) set({ endDate_utc: params.endDate_utc });

  try {
    const response = await api.get('/member', { params: queryParams });
    
    // Handle the structured response from your updated controller
    const { data, pageInfo } = response.data;

    set({
      members: data,
      totalCount: pageInfo.totalCount,
      totalPages: pageInfo.totalPages,
      isFetching: false,
      error: false,
      errorMessage: null,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    set({
      members: [],
      totalCount: 0,
      totalPages: 0,
      isFetching: false,
      error: true,
      errorMessage: error.response?.data?.message || error.message || 'Failed to fetch members',
    });
  }
},
  // Pagination controls
  goToPage: (pageNumber) => {
    const { currentLimit, searchTerm } = get();
    get().fetchMembers({
      page: pageNumber,
      limit: currentLimit,
      search: searchTerm,
    });
  },

  goToNextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      get().goToPage(currentPage + 1);
    }
  },

  goToPreviousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      get().goToPage(currentPage - 1);
    }
  },

    setSearchTerm: (term) => {
    const { currentLimit, startDate_utc, endDate_utc, createdBy } = get();
    get().fetchMembers({
      page: 1,
      limit: currentLimit,
      search: term,
      startDate_utc,
      endDate_utc,
      createdBy,
    });
  },
  setDateRange: (startDate, endDate) => {
    const { currentLimit, searchTerm, createdBy } = get();
    get().fetchMembers({
      page: 1,
      limit: currentLimit,
      search: searchTerm,
      startDate_utc: startDate,
      endDate_utc: endDate,
      createdBy,
    });
  },

  setCreatedBy: (creatorName) => {
    const { currentLimit, searchTerm, startDate_utc, endDate_utc } = get();
    get().fetchMembers({
      page: 1,
      limit: currentLimit,
      search: searchTerm,
      startDate_utc,
      endDate_utc,
      createdBy: creatorName,
    });
  },
  setLimit: (newLimit) => {
    const { searchTerm, startDate_utc, endDate_utc, createdBy } = get();
    get().fetchMembers({
      page: 1,
      limit: newLimit,
      search: searchTerm,
      startDate_utc,
      endDate_utc,
      createdBy,
    });
  },

  // CRUD actions
  createMember: async (data) => {
    set({ isCreating: true, error: false, errorMessage: null });

    try {
      const cleanedData = emptyStringToNull(data); 

      await api.post('/member', cleanedData);
      const { currentPage, currentLimit, searchTerm } = get();
      await get().fetchMembers({ page: currentPage, limit: currentLimit, search: searchTerm });
      set({ isCreating: false });
      return { success: true };
    } catch (error) {
      set({ 
        isCreating: false, 
        error: true, 
        errorMessage: error.response?.data?.message || error.message || 'Failed to create member'
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  getMemberById: async (id) => {
    set({ isFetchingSingle: true, error: false, errorMessage: null });

    try {
      const response = await api.get(`/member/${id}`);
      set({
        selectedMember: response.data,
        selectedMemberId: id,
        isFetchingSingle: false,
      });
      return { success: true };
    } catch (error) {
      console.error('Error fetching member by ID:', error);
      set({
        selectedMember: null,
        isFetchingSingle: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch member',
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },
  
  updateMember: async (id, data) => {
    set({ isUpdating: true, error: false, errorMessage: null });

    try {
      const cleanedData = emptyStringToNull(data); 
      await api.put(`/member/${id}`, cleanedData);
      const { currentPage, currentLimit, searchTerm } = get();
      await get().fetchMembers({ page: currentPage, limit: currentLimit, search: searchTerm });
      set({ isUpdating: false });
      return { success: true };
    } catch (error) {
      set({ 
        isUpdating: false, 
        error: true, 
        errorMessage: error.response?.data?.message || error.message || 'Failed to update member'
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  deleteMember: async (id) => {
    set({ isDeleting: true, error: false, errorMessage: null });

    try {
      await api.delete(`/member/${id}`);
      const { currentPage, currentLimit, searchTerm, members } = get();
      
      // If this was the last item on the current page and we're not on page 1,
      // go back one page
      const newPage = members.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      
      await get().fetchMembers({ page: newPage, limit: currentLimit, search: searchTerm });
      set({ isDeleting: false });
      return { success: true };
    } catch (error) {
      set({ 
        isDeleting: false, 
        error: true, 
        errorMessage: error.response?.data?.message || error.message || 'Failed to delete member'
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

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

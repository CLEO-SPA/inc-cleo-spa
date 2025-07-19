import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const getInitialState = () => ({
  // MEMBER STATE
  currentMember: null,
  memberSearchLoading: false,

  // PACKAGES PAGINATION STATE
  memberCarePackages: [],
  packagesCurrentPage: 1,
  packagesCurrentLimit: 2,
  packagesTotalPages: 0,
  packagesTotalCount: 0,
  packagesSearchTerm: '',
  packagesisFetching: false,

  // VOUCHERS PAGINATION STATE
  memberVouchers: [],
  vouchersCurrentPage: 1,
  vouchersCurrentLimit: 2,
  vouchersTotalPages: 0,
  vouchersTotalCount: 0,
  vouchersSearchTerm: '',
  vouchersisFetching: false,

  // UI & CRUD states
  loading: false,
  error: false,
  errorMessage: null,
});

// function emptyStringToNull(obj) {
//   return Object.fromEntries(
//     Object.entries(obj).map(([key, value]) =>
//       value === "" ? [key, null] : [key, value]
//     )
//   );
// }

const useSelectedMemberStore = create(
  devtools((set, get) => ({
    ...getInitialState(),

    // Reset store to initial state
    resetStore: () => {
      set(getInitialState());
    },

    // MEMBER SEARCH
    searchMember: async (searchTerm) => {
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Search term must be a non-empty string');
      }

      set({ memberSearchLoading: true, error: false, errorMessage: null });

      try {
        const response = await api.get('/member/search', {
          params: { q: searchTerm },
        });

        const data = response.data;
        // console.log('Member search response:', data);

        if (data.members && data.members.length > 0) {
          const member = data.members[0];

          set({
            currentMember: member,
            memberSearchLoading: false,
            // Reset pagination when new member is selected
            packagesCurrentPage: 1,
            vouchersCurrentPage: 1,
            packagesSearchTerm: '',
            vouchersSearchTerm: '',
          });

          // Load initial data with default pagination
          await get().fetchMemberPackages({ memberId: member.id });
          await get().fetchMemberVouchers({ memberId: member.id });

          return member;
        } else {
          set({
            currentMember: null,
            memberCarePackages: [],
            memberVouchers: [],
            memberSearchLoading: false,
            packagesCurrentPage: 1,
            packagesTotalPages: 0,
            packagesTotalCount: 0,
            vouchersCurrentPage: 1,
            vouchersTotalPages: 0,
            vouchersTotalCount: 0,
            packagesSearchTerm: '',
            vouchersSearchTerm: '',
          });

          return null;
        }
      } catch (error) {
        set({
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to search member',
          memberSearchLoading: false,
          currentMember: null,
        });
        throw error;
      }
    },

    // PACKAGES PAGINATION - Core Fetch
    fetchMemberPackages: async (params = {}) => {
      const { currentMember } = get();
      if (!currentMember) return;

      set({ packagesisFetching: true, error: false, errorMessage: null });

      const state = get();
      const queryParams = {
        page: params.page || state.packagesCurrentPage,
        limit: params.limit || state.packagesCurrentLimit,
        search: params.search ?? state.packagesSearchTerm,
      };

      // Update state with new parameters
      if (params.page) set({ packagesCurrentPage: params.page });
      if (params.limit) set({ packagesCurrentLimit: params.limit });
      if (params.search !== undefined) set({ packagesSearchTerm: params.search });

      const memberId = params.memberId || currentMember.id;

      try {
        const response = await api.get(`/member/${memberId}/member-care-packages`, {
          params: {
            page: queryParams.page,
            limit: queryParams.limit,
            searchTerm: queryParams.search,
          },
        });
        const { data, pageInfo } = response.data;

        set({
          memberCarePackages: data || [],
          packagesTotalCount: pageInfo?.totalCount || 0,
          packagesTotalPages: pageInfo?.totalPages || 0,
          packagesisFetching: false,
          error: false,
          errorMessage: null,
        });
      } catch (error) {
        console.error('Error fetching member packages:', error);
        set({
          memberCarePackages: [],
          packagesTotalCount: 0,
          packagesTotalPages: 0,
          packagesisFetching: false,
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to fetch packages',
        });
      }
    },

    fetchMemberVouchers: async (params = {}) => {
      const { currentMember } = get();
      if (!currentMember) return;

      set({ vouchersisFetching: true, error: false, errorMessage: null });

      const state = get();
      const queryParams = {
        page: params.page || state.vouchersCurrentPage,
        limit: params.limit || state.vouchersCurrentLimit,
        search: params.search ?? state.vouchersSearchTerm,
      };

      // Update state with new parameters
      if (params.page) set({ vouchersCurrentPage: params.page });
      if (params.limit) set({ vouchersCurrentLimit: params.limit });
      if (params.search !== undefined) set({ vouchersSearchTerm: params.search });

      const memberId = params.memberId || currentMember.id;

      try {
        const response = await api.get(`/member/${memberId}/member-vouchers`, {
          params: {
            page: queryParams.page,
            limit: queryParams.limit,
            searchTerm: queryParams.search,
          },
        });

        const { data, pageInfo } = response.data;

        set({
          memberVouchers: data || [],
          vouchersTotalCount: pageInfo?.totalCount || 0,
          vouchersTotalPages: pageInfo?.totalPages || 0,
          vouchersisFetching: false,
          error: false,
          errorMessage: null,
        });
      } catch (error) {
        console.error('Error fetching member vouchers:', error);
        set({
          memberVouchers: [],
          vouchersTotalCount: 0,
          vouchersTotalPages: 0,
          vouchersisFetching: false,
          error: true,
          errorMessage: error.response?.data?.message || error.message || 'Failed to fetch vouchers',
        });
      }
    },

    refreshCurrentMemberData: async () => {
      const { currentMember } = get();

      if (!currentMember) {
        console.warn('No current member to refresh');
        return;
      }

      try {
        // Refresh packages and vouchers while preserving current pagination/search state
        await Promise.all([
          get().fetchMemberPackages({ memberId: currentMember.id }),
          get().fetchMemberVouchers({ memberId: currentMember.id }),
        ]);
      } catch (error) {
        console.error('Failed to refresh current member data:', error);
      }
    },
    // PACKAGES PAGINATION CONTROLS
    goToPackagesPage: (pageNumber) => {
      const { packagesCurrentLimit, packagesSearchTerm } = get();
      get().fetchMemberPackages({
        page: pageNumber,
        limit: packagesCurrentLimit,
        search: packagesSearchTerm,
      });
    },

    goToNextPackagesPage: () => {
      const { packagesCurrentPage, packagesTotalPages } = get();
      if (packagesCurrentPage < packagesTotalPages) {
        get().goToPackagesPage(packagesCurrentPage + 1);
      }
    },

    goToPreviousPackagesPage: () => {
      const { packagesCurrentPage } = get();
      if (packagesCurrentPage > 1) {
        get().goToPackagesPage(packagesCurrentPage - 1);
      }
    },

    setPackagesSearchTerm: (term) => {
      const { packagesCurrentLimit } = get();
      get().fetchMemberPackages({
        page: 1,
        limit: packagesCurrentLimit,
        search: term,
      });
    },

    setPackagesLimit: (newLimit) => {
      const { packagesSearchTerm } = get();
      get().fetchMemberPackages({
        page: 1,
        limit: newLimit,
        search: packagesSearchTerm,
      });
    },

    // VOUCHERS PAGINATION CONTROLS
    goToVouchersPage: (pageNumber) => {
      const { vouchersCurrentLimit, vouchersSearchTerm } = get();
      get().fetchMemberVouchers({
        page: pageNumber,
        limit: vouchersCurrentLimit,
        search: vouchersSearchTerm,
      });
    },

    goToNextVouchersPage: () => {
      const { vouchersCurrentPage, vouchersTotalPages } = get();
      if (vouchersCurrentPage < vouchersTotalPages) {
        get().goToVouchersPage(vouchersCurrentPage + 1);
      }
    },

    goToPreviousVouchersPage: () => {
      const { vouchersCurrentPage } = get();
      if (vouchersCurrentPage > 1) {
        get().goToVouchersPage(vouchersCurrentPage - 1);
      }
    },

    setVouchersSearchTerm: (term) => {
      const { vouchersCurrentLimit } = get();
      get().fetchMemberVouchers({
        page: 1,
        limit: vouchersCurrentLimit,
        search: term,
      });
    },

    setVouchersLimit: (newLimit) => {
      const { vouchersSearchTerm } = get();
      get().fetchMemberVouchers({
        page: 1,
        limit: newLimit,
        search: vouchersSearchTerm,
      });
    },

    cancelMemberPackage: async (mcpId) => {
      try {
        const response = await api.delete(`/mcp/${mcpId}/rm`);

        // Refresh all member data to get updated counts
        const { currentMember } = get();
        if (currentMember) {
          // This will refresh member info including counts, and reload packages/vouchers
          await get().searchMember(currentMember.name || currentMember.contact);
        }

        return response.data;
      } catch (error) {
        console.error('Error cancelling package:', error);
        throw error; // Re-throw so component can handle
      }
    },

    cancelMemberVoucher: async (mvId) => {
      try {
        const response = await api.delete(`/mv/${mvId}/rm`);

        // Refresh all member data to get updated counts
        const { currentMember } = get();
        if (currentMember) {
          // This will refresh member info including counts, and reload packages/vouchers
          await get().searchMember(currentMember.name || currentMember.contact);
        }

        return response.data;
      } catch (error) {
        console.error('Error cancelling voucher:', error);
        throw error; // Re-throw so component can handle
      }
    },
    // CLEAR MEMBER DATA
    clearMemberData: () => {
      set({
        currentMember: null,
        memberCarePackages: [],
        memberVouchers: [],
        packagesCurrentPage: 1,
        packagesTotalPages: 0,
        packagesTotalCount: 0,
        packagesSearchTerm: '',
        vouchersCurrentPage: 1,
        vouchersTotalPages: 0,
        vouchersTotalCount: 0,
        vouchersSearchTerm: '',
      });
    },
  }))
);

export default useSelectedMemberStore;

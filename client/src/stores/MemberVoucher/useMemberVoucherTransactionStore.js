import { create } from 'zustand';
import api from '@/services/api';

import { handleApiError } from '@/utils/errorHandlingUtils';
import { validateMemberVoucherId } from '@/utils/validationUtils';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,

    memberVoucherServiceList: [],
    memberVoucherTransactionLogs: [],
    selectedMemberVoucherId: -1,

    currentPage: 1,
    currentLimit: 10,
    startCursor: null,
    endCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
    totalCount: null,
    isOffsetMode: false,
    lastAction: null,

    isConfirming: false,
    isUpdating: false,
});

const useMemberVoucherTransactionStore = create((set, get) => ({

    ...getInitialState(),

    fetchServiceOfMemberVoucher: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const state = get();
            const { selectedMemberVoucherId } = state;
            const response = await api.get(`/mv/${selectedMemberVoucherId}/s`);
            const data = response.data.data.data;

            set({
                success: true,
                error: false,
                errorMessage: null,
                loading: false,
                memberVoucherServiceList: data
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        };
    },

    fetchTransactionLogsOfMemberVoucher: async () => {
        console.log(get().loading);
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        const state = get(); // Get the current state
        const { currentPage, currentLimit, startCursor, endCursor, isOffsetMode, lastAction } = state;

        const queryParams = {
            limit: currentLimit,
        };

        // Determine pagination strategy
        if (isOffsetMode) {
            queryParams.page = currentPage;
        } else {
            // Cursor-based logic:
            // If going next, use endCursor of previous page as 'after'
            if (lastAction === 'next' && endCursor) {
                queryParams.after = endCursor;
            }
            // If going previous, use startCursor of previous page as 'before'
            else if (lastAction === 'prev' && startCursor) {
                queryParams.before = startCursor;
            }
            // For initial load or new filter (where cursors might be null),
            // no 'after' or 'before' is sent, so it fetches the first page.
        }

        try {

            const state = get();
            const { selectedMemberVoucherId, totalCount } = state;

            const response = await api.get(`/mv/${selectedMemberVoucherId}/t`, { params: queryParams });
            
            console.log(response);

            const transactionList = response.data.data.data;
            const pageInfo = response.data.data.pageInfo;

            console.log(transactionList);

            set({
                loading: false,
                error: false,
                success: true,  
                errorMessage: null,

                memberVoucherTransactionLogs: transactionList,
                startCursor: pageInfo.startCursor,
                endCursor: pageInfo.endCursor,
                hasNextPage: pageInfo.hasNextPage,
                hasPreviousPage: pageInfo.hasPreviousPage,
                totalCount: pageInfo.totalCount ? pageInfo.totalCount : totalCount,
            });

            console.log('State after fetchTransactionLog:', { ...response });

            get().setSuccessWithTimeout();

        } catch (err) {
            console.error('Failed to fetch member voucher transaction logs:', err);
            set({ error: err.message || 'An unexpected error occurred', loading: false });
        }
    },

    createMemberVoucherTransactionLog: async (data) => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.post(`/mv/${selectedMemberVoucherId}/t/create`, data);

            await get().initialize();

            set({ isConfirming: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        };
    },

    updateMemberVoucherTransactionLog: async (data) => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/mv/${selectedMemberVoucherId}/t/update`, data);

            await get().initialize();

            set({ isConfirming: false, isUpdating: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        };
    },

    deletingMemberVoucherTransactionLog: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/mv/${selectedMemberVoucherId}/t/delete`);

            await get().initialize();

            set({ isConfirming: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        };
    },

    // Action to navigate to the next page (cursor-based)
    goToNextPage: () => {
        set((state) => ({
            currentPage: state.currentPage + 1,
            isOffsetMode: false,
            lastAction: 'next', // Track the action for `WorkspaceVouchers`
        }));
        get().fetchTransactionLogsOfMemberVoucher(); // Trigger fetch
    },

    // Action to navigate to the previous page (cursor-based)
    goToPreviousPage: () => {
        set((state) => ({
            currentPage: state.currentPage - 1,
            isOffsetMode: false,
            lastAction: 'prev', // Track the action for `WorkspaceVouchers`
        }));
        get().fetchTransactionLogsOfMemberVoucher(); // Trigger fetch
    },

    // Action for direct jump to page (offset-based)
    goToPage: (pageNumber) => {
        set({
            currentPage: pageNumber,
            isOffsetMode: true, // Switch to offset mode
            startCursor: null, // Clear cursors when jumping by page number
            endCursor: null,
            lastAction: 'jump', // Track action
        });
        get().fetchTransactionLogsOfMemberVoucher(); // Trigger fetch
    },

    setLimit: (newLimit) => {
        set(() => ({
            currentLimit: newLimit,
            currentPage: 1,
            startCursor: null,
            endCursor: null,
            totalCount: null,
            isOffsetMode: false, // Reset to cursor mode for new limit
            lastAction: 'limit', // Track action
        }));
        get().fetchTransactionLogsOfMemberVoucher(); // Trigger fetch
    },

    setIsUpdating: (value) => { set({ isUpdating: value }) },

    setIsConfirming: (value) => { set({ isConfirming: value }) },

    setSelectedMemberVoucherTypeId: (id) => {
        const validation = validateMemberVoucherId(id);
        if (validation.isValid) {
            set({ selectedMemberVoucherId: id });
            return true;
        }

        set({ error: true, errorMessage: validation.error });
        return false;
    },

    setError: (value) => { set({ error: value }) },

    setErrorMessage: (value) => { set({ errorMessage: value }) },

    initialize: async () => {
        await get().fetchServiceOfMemberVoucher();
        await get().fetchTransactionLogsOfMemberVoucher();
    },

    clearError: () => {
        set({ error: false, errorMessage: null })
    },

    // Helper function inside the store
    setSuccessWithTimeout: () => {
        set({ success: true, error: false, errorMessage: null });

        // Auto-clear success message after 3 seconds (data stays)
        setTimeout(() => {
            set((state) => ({
                ...state,
                success: false  // Only clear the success flag, keep data
            }));
        }, 3000);
    },

    reset: () => set(getInitialState())
}));

export default useMemberVoucherTransactionStore;
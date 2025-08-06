import { create } from 'zustand';
import api from '@/services/api';

import { handleApiError } from '@/utils/errorHandlingUtils';
import { validateMemberVoucherId, validateMemberVoucherConsumptionCreateData, validateTransactionLogId } from '@/utils/validationUtils';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,

    // View
    memberVoucherServiceList: [],
    memberVoucherTransactionLogs: [],
    employeeList: [],
    memberName: null,
    selectedMemberVoucherId: -1,
    selectedTransactionLogId: -1,
    memberVoucherPurchasedAt: null,

    // Employee Commission
    selectedServiceId: null,
    selectedServiceFinalPrice: 0,

    // Create and Update
    formData: [], // form Data is validate data while formFieldData is user input
    createFormFieldData: {
        consumptionValue: '',
        remarks: '',
        date: '',
        time: '12:00',
        type: '',
        createdBy: '',
        handledBy: '',
        assignedEmployee: []
    },
    updateFormFieldData: {
        consumptionValue: '',
        remarks: '',
        date: '',
        time: '12:00',
        type: '',
        createdBy: '',
        handledBy: ''
    },

    // Pagination
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
    isCreating: false,
    isUpdating: false,
    isDeleting: false
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

            // Get service ID and final price from the service for Employee Commission Select
            const service = data[0];
            set({
                selectedServiceId: service.id,
                selectedServiceFinalPrice: parseFloat(service.final_price)
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        };
    },

    setSelectedService: (serviceId, finalPrice) => {
        set({
            selectedServiceId: serviceId,
            selectedServiceFinalPrice: finalPrice
        });
    },

    clearSelectedService: () => {
        set({
            selectedServiceId: null,
            selectedServiceFinalPrice: 0
        });
    },

    fetchMemberNameByMemberVoucherId: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const state = get(); // Single call
            const {
                selectedMemberVoucherId
            } = state;

            const response = await api.get(`/mv/${selectedMemberVoucherId}/mn`);

            const memberName = response.data.data;

            set({
                success: true,
                error: false,
                errorMessage: null,
                loading: false,
                memberName: memberName
            })

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    fetchEmployeeBasicDetails: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const response = await api.get(`/em/basic-details`);

            const employeeList = response.data.data;

            set({
                loading: false,
                error: false,
                success: true,
                errorMessage: null,

                employeeList: employeeList,
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    fetchTransactionLogsOfMemberVoucher: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        const state = get(); // Get the current state
        const { currentPage, currentLimit, startCursor, endCursor, isOffsetMode, lastAction, selectedMemberVoucherId, totalCount } = state;

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
            const response = await api.get(`/mv/${selectedMemberVoucherId}/t`, { params: queryParams });

            const transactionList = response.data.data.data;
            const pageInfo = response.data.data.pageInfo;

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

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    fetchMemberVoucherPurchaseDate: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        const state = get(); // Get the current state
        const { selectedMemberVoucherId } = state;

        try {

            const response = await api.get(`/mv/${selectedMemberVoucherId}/t/pd`);

            const memberVoucherPurchasedDateStr = response.data.data;

            const memberVoucherPurchasedDate = new Date(memberVoucherPurchasedDateStr);

            set({
                loading: false,
                error: false,
                success: true,
                errorMessage: null,

                memberVoucherPurchasedAt: memberVoucherPurchasedDate,
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    createMemberVoucherTransactionLog: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const state = get();
            const { selectedMemberVoucherId, formData } = state;

            await api.post(`/mv/${selectedMemberVoucherId}/t/create`, formData);

            set({
                isConfirming: false,
                isCreating: false,
                loading: false,
                success: true,
                formData: [],
                createFormFieldData: {
                    consumptionValue: '',
                    remarks: '',
                    date: '',
                    time: '12:00',
                    type: '',
                    createdBy: '',
                    handledBy: '',
                    assignedEmployee: []
                },
            });

            await get().initialize();

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ isConfirming: false, isCreating: false, error: true, errorMessage: errorMessage, loading: false });
        };
    },

    updateMemberVoucherTransactionLog: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const state = get();
            const { selectedMemberVoucherId, formData, selectedTransactionLogId } = state;

            const formDataWithTransactionId = {
                ...formData,
                transaction_log_id: selectedTransactionLogId
            };


            await api.put(`/mv/${selectedMemberVoucherId}/t/update`, formDataWithTransactionId);

            set({
                isConfirming: false,
                isUpdating: false,
                loading: false,
                success: true,
                formData: [],
                updateFormFieldData: {
                    consumptionValue: '',
                    remarks: '',
                    date: '',
                    time: '12:00',
                    type: '',
                    createdBy: '',
                    handledBy: ''
                },
            });

            await get().initialize();

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ isConfirming: false, error: true, errorMessage: errorMessage, loading: false });
        };
    },

    deletingMemberVoucherTransactionLog: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const state = get();
            const { selectedMemberVoucherId, selectedTransactionLogId } = state;

            await api.delete(`/mv/${selectedMemberVoucherId}/t/${selectedTransactionLogId}/delete`);

            set({
                isConfirming: false,
                isDeleting: false,
                loading: false,
                success: true,
                formData: []
            });

            await get().initialize();

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

    setStoreFormData: (formFieldData) => {
        const state = get();
        const { employeeList, memberVoucherPurchasedAt } = state;
        const validate = validateMemberVoucherConsumptionCreateData(formFieldData, memberVoucherPurchasedAt);

        if (!validate.isValid) {

            set({
                error: true,
                errorMessage: validate.error
            });
            return false;
        };

        const createdByWithName = employeeList.find(emp => emp.id === String(formFieldData.createdBy))?.employee_name || 'Unknown';
        const handledByWithName = employeeList.find(emp => emp.id === String(formFieldData.handledBy))?.employee_name || 'Unknown';

        let formFieldDataWithEmpName;

        if (formFieldData.lastUpdatedBy) {
            const lastUpdatedByWithName = employeeList.find(emp => emp.id === String(formFieldData.lastUpdatedBy))?.employee_name || 'Unknown';
            formFieldDataWithEmpName = {
                ...formFieldData,
                createdByWithName,
                handledByWithName,
                lastUpdatedByWithName
            };
        } else {
            formFieldDataWithEmpName = {
                ...formFieldData,
                createdByWithName,
                handledByWithName,
                assignedEmployee: formFieldData.assignedEmployee || []
            };
        }

        // No error
        console.log("Set Form Success");
        set({
            formData: formFieldDataWithEmpName
        });
        return true;
    },

    setIsCreating: (value) => { set({ isCreating: value }) },

    setIsUpdating: (value) => { set({ isUpdating: value }) },

    setIsDeleting: (value) => { set({ isDeleting: value }) },

    setIsConfirming: (value) => { set({ isConfirming: value }) },

    setSelectedMemberVoucherId: (id) => {
        const validation = validateMemberVoucherId(id);
        if (validation.isValid) {
            set({ selectedMemberVoucherId: id });
            return;
        }

        set({ error: true, errorMessage: validation.error });
        return;
    },

    setSelectedTransactionLogId: (id) => {
        const validation = validateTransactionLogId(id);
        if (validation.isValid) {
            set({ selectedTransactionLogId: id });
            return;
        }

        set({ error: true, errorMessage: validation.error });
        return;
    },

    setError: (value) => { set({ error: value }) },

    setErrorMessage: (value) => { set({ errorMessage: value }) },

    initialize: async (id) => {
        get().setSelectedMemberVoucherId(id);

        await get().fetchMemberNameByMemberVoucherId();
        await get().fetchServiceOfMemberVoucher();
        await get().fetchTransactionLogsOfMemberVoucher();
        await get().fetchEmployeeBasicDetails();
        await get().fetchMemberVoucherPurchaseDate();
    },

    clearError: () => {
        set({ error: false, errorMessage: null })
    },

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

    updateCreateFormField: (field, value) => {
        set((state) => ({
            createFormFieldData: { ...state.createFormFieldData, [field]: value }
        }));
    },

    clearCreateFormData: () => {
        set({
            createFormFieldData: {
                consumptionValue: '',
                remarks: '',
                date: '',
                time: '12:00',
                type: '',
                createdBy: '',
                handledBy: '',
                assignedEmployee: []
            }
        });
    },

    updateUpdateFormField: (field, value) => {
        set((state) => ({
            updateFormFieldData: { ...state.updateFormFieldData, [field]: value }
        }));
    },

    clearUpdateFormData: () => {
        set({
            updateFormFieldData: {
                consumptionValue: '',
                remarks: '',
                date: '',
                time: '12:00',
                type: '',
                createdBy: '',
                handledBy: '',
                lastUpdatedBy: ''
            }
        });
    },

    setUpdateFormData: () => {
        const state = get();
        const { memberVoucherTransactionLogs, selectedTransactionLogId } = state;
        const memberVoucherTransactionLog = memberVoucherTransactionLogs.find(log => log.id === selectedTransactionLogId);

        const dateStr = memberVoucherTransactionLog.service_date;
        const date = new Date(dateStr);

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        const dateFormatted = `${year}-${month}-${day}`;
        const timeFormatted = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const createdBy = memberVoucherTransactionLog.created_by;
        const handledBy = memberVoucherTransactionLog.serviced_by
        const lastUpdatedBy = memberVoucherTransactionLog.last_updated_by

        set({
            updateFormFieldData: {
                consumptionValue: memberVoucherTransactionLog.amount_change,
                remarks: memberVoucherTransactionLog.service_description,
                date: dateFormatted,
                time: timeFormatted,
                type: memberVoucherTransactionLog.type,
                createdBy: createdBy,
                handledBy: handledBy,
                lastUpdatedBy: lastUpdatedBy
            }
        });
    },

    setDeleteFormData: () => {
        const state = get();
        const { memberVoucherTransactionLogs, selectedTransactionLogId, employeeList } = state;
        const memberVoucherTransactionLog = memberVoucherTransactionLogs.find(log => log.id === selectedTransactionLogId);

        const dateStr = memberVoucherTransactionLog.service_date;
        const date = new Date(dateStr);

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        const dateFormatted = `${year}-${month}-${day}`;
        const timeFormatted = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const createdByWithName = employeeList.find(emp => emp.id === String(memberVoucherTransactionLog.created_by))?.employee_name || 'Unknown';
        const handledByWithName = employeeList.find(emp => emp.id === String(memberVoucherTransactionLog.serviced_by))?.employee_name || 'Unknown';

        set({
            formData: {
                consumptionValue: memberVoucherTransactionLog.amount_change,
                remarks: memberVoucherTransactionLog.service_description,
                date: dateFormatted,
                time: timeFormatted,
                type: memberVoucherTransactionLog.type,
                createdByWithName: createdByWithName,
                handledByWithName: handledByWithName
            },
            isDeleting: true,
            isConfirming: true
        });
    },

    reset: () => set(getInitialState())
}));

export default useMemberVoucherTransactionStore;
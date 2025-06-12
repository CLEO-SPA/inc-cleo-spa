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
    employeeList: null,
    memberName: null,
    selectedMemberVoucherId: -1,
    selectedTransactionLogId: -1,

    // Create and Update
    formData: [], // form Data is validate data while formFieldData is user input
    createFormFieldData: {
        consumptionValue: '',
        remarks: '',
        date: '',
        time: '12:00',
        type: '',
        createdBy: '',
        handledBy: ''
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

function getNameById(empMap, id) {
    for (let [name, empId] of empMap) {
        if (empId === id) {
            return name;
        }
    }
    return null;
}

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
            console.log(memberName);

            set({
                success: true,
                error: false,
                errorMessage: null,
                loading: false,
                memberName: memberName
            })

            get().setSuccessWithTimeout();

        } catch (err) {
            console.error('Failed to fetch member name:', err);
            set({ error: err.message || 'An unexpected error occurred', loading: false });
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

            const empMap = new Map();
            employeeList.forEach(emp => {
                empMap.set(emp.employee_name.toLowerCase(), emp.id);
            });

            set({
                loading: false,
                error: false,
                success: true,
                errorMessage: null,

                employeeList: empMap,
            });

            get().setSuccessWithTimeout();

        } catch (err) {
            console.error('Failed to fetch employee data:', err);
            set({ error: err.message || 'An unexpected error occurred', loading: false });
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
            const { selectedMemberVoucherId, formData, employeeList } = state;

            const formDataWithEmployeeId = {
                ...formData,
                createdBy: employeeList.get(formData.createdBy.toLowerCase()),
                handledBy: employeeList.get(formData.handledBy.toLowerCase())
            };

            console.log("fetch function form data: ");
            console.log(formDataWithEmployeeId);
            await api.post(`/mv/${selectedMemberVoucherId}/t/create`, formDataWithEmployeeId);

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
                    handledBy: ''
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
            const { selectedMemberVoucherId, formData, employeeList, selectedTransactionLogId } = state;

            const formDataWithEmployeeId = {
                ...formData,
                createdBy: employeeList.get(formData.createdBy.toLowerCase()),
                handledBy: employeeList.get(formData.handledBy.toLowerCase()),
                lastUpdatedBy: employeeList.get(formData.lastUpdatedBy.toLowerCase()),
                transaction_log_id: selectedTransactionLogId
            };


            await api.put(`/mv/${selectedMemberVoucherId}/t/update`, formDataWithEmployeeId);

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
                isUpdating: false,
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
        const { employeeList } = state;
        const validate = validateMemberVoucherConsumptionCreateData(formFieldData);

        if (!validate.isValid) {

            console.log(validate.error);
            set({
                error: true,
                errorMessage: validate.error
            });
            return false;
        };

        const validateCreatedBy = employeeList.get(formFieldData.createdBy.toLowerCase());
        const validatehandledBy = employeeList.get(formFieldData.handledBy.toLowerCase());

        if (!validateCreatedBy || !validatehandledBy) {
            set({
                error: true,
                errorMessage: "This Employee does not exist. Please try again."
            });
            return false;
        };

        if (formFieldData.lastUpdatedBy) {
            const validateLastUpdatedBy = employeeList.get(formFieldData.lastUpdatedBy.toLowerCase());

            if (!validateLastUpdatedBy) {
                set({
                    error: true,
                    errorMessage: "This Employee does not exist. Please try again."
                });
                return false;
            };
        };

        // No error
        console.log("Set Form Success");
        set({
            formData: formFieldData
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
                handledBy: ''
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
        const { memberVoucherTransactionLogs, employeeList, selectedTransactionLogId } = state;
        const memberVoucherTransactionLog = memberVoucherTransactionLogs.find(log => log.id === selectedTransactionLogId);

        const dateStr = memberVoucherTransactionLog.service_date;
        const date = new Date(dateStr);

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        const dateFormatted = `${year}-${month}-${day}`;
        const timeFormatted = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const createdByEmpName = getNameById(employeeList, String(memberVoucherTransactionLog.created_by));
        const handledByEmpName = getNameById(employeeList, String(memberVoucherTransactionLog.serviced_by));
        const lastUpdatedByEmpName = getNameById(employeeList, String(memberVoucherTransactionLog.last_updated_by));

        set({
            updateFormFieldData: {
                consumptionValue: memberVoucherTransactionLog.amount_change,
                remarks: memberVoucherTransactionLog.service_description,
                date: dateFormatted,
                time: timeFormatted,
                type: memberVoucherTransactionLog.type,
                createdBy: createdByEmpName,
                handledBy: handledByEmpName,
                lastUpdatedBy: lastUpdatedByEmpName
            }
        });
    },

    setDeleteFormData: () => {
        const state = get();
        const { memberVoucherTransactionLogs, employeeList, selectedTransactionLogId } = state;
        const memberVoucherTransactionLog = memberVoucherTransactionLogs.find(log => log.id === selectedTransactionLogId);

        const dateStr = memberVoucherTransactionLog.service_date;
        const date = new Date(dateStr);

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        const dateFormatted = `${year}-${month}-${day}`;
        const timeFormatted = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const createdByEmpName = getNameById(employeeList, String(memberVoucherTransactionLog.created_by));
        const handledByEmpName = getNameById(employeeList, String(memberVoucherTransactionLog.serviced_by));

        set({
            formData: {
                consumptionValue: memberVoucherTransactionLog.amount_change,
                remarks: memberVoucherTransactionLog.service_description,
                date: dateFormatted,
                time: timeFormatted,
                type: memberVoucherTransactionLog.type,
                createdBy: createdByEmpName,
                handledBy: handledByEmpName
            },
            isDeleting: true,
            isConfirming: true
        });
    },

    reset: () => set(getInitialState())
}));

export default useMemberVoucherTransactionStore;
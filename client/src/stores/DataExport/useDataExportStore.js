import { create } from 'zustand';
import api from '@/services/api';
import { handleApiError } from '@/utils/errorHandlingUtils';
import { validateTimeInput } from '@/utils/validationUtils';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,
    dataExportList: null,
    columns: [],
    selectedTable: null,
    openTimeInput: false,
    exportFormat: null,
    timeInput: null
});

const useDataExportStore = create((set, get) => ({

    ...getInitialState(),

    fetchMemberDetails: async () => {

        if (get().loading) {
            set({ error: true, errorMessage: "Another process is running." });
            return;
        }

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`/de/get-member-details`);
            const dataToExport = response.data.data;

            console.log(dataToExport);

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberVoucher: async (time) => {

        if (get().loading) {
            set({ error: true, errorMessage: "Another process is running." });
            return;
        }

        const validation = validateTimeInput(time);
        if (!validation.isValid) {
            set({ error: true, errorMessage: validation.error });
            return;
        }

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`/de/get-minimum-time-since-used-member-voucher?time=${time}`);
            const dataToExport = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberCarePackage: async (time) => {

        if (get().loading) {
            set({ error: true, errorMessage: "Another process is running." });
            return;
        }

        const validation = validateTimeInput(time);
        if (!validation.isValid) {
            set({ error: true, errorMessage: validation.error });
            return;
        }

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`/de/get-minimum-time-since-used-member-care-package?time=${time}`);
            const dataToExport = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    getDataToExport: async () => {
        const { selectedTable, timeInput } = get();

        if (selectedTable === 'member-details') {
            await get().fetchMemberDetails();
            return true;
        }
        if (selectedTable === "unused-member-voucher") {
            const validate = validateTimeInput(timeInput);
            if (validate.isValid) {
                await get().fetchMinimumTimeSinceUsedOfMemberVoucher(timeInput ? timeInput : 7);
                return true;
            }

            set({ error: true, errorMessage: validate.error });

            return false;
        }

        if (selectedTable === "unused-member-care-package") {
            const validate = validateTimeInput(timeInput);
            if (validate.isValid) {
                await get().fetchMinimumTimeSinceUsedOfMemberCarePackage(timeInput ? timeInput : 7);
                return true;
            }

            set({ error: true, errorMessage: validate.error });

            return false;
        }

        return false;
    },

    setSelectedTable: (value) => {
        set({ selectedTable: value })
            set({ openTimeInput: false })
        if (value === 'member-details') {
            get().setColumns(['member_id', 'name', 'email', 'contact', 'dob', 'sex', 'remarks', 'address', 'nric']);
        }

        if (value === "unused-member-voucher") {
            set({ openTimeInput: true })
            get().setColumns(['member_name', 'contact', 'email', 'member_voucher_name', 'days_since_use', 'created_at']);
        }

        if (value === "unused-member-care-package") {
            set({ openTimeInput: true })
            get().setColumns(['member_name', 'contact', 'email', 'member_care_package_name', 'days_since_use', 'created_at']);
        }
    },

    setTimeInput: (value) => set({ timeInput: value }),

    setExportFormat: (value) => set({ exportFormat: value }),

    setErrorMessage: (value) => set({ errorMessage: value }),

    setLoading: (value) => set({ loading: value }),

    setColumns: (value) => set({ columns: value }),

    setError: (value) => set({ error: value }),

    clearError: () => {
        set({ error: false, errorMessage: null })
    },

    setSuccessWithTimeout: () => {
        set({ success: true, error: false, errorMessage: null });

        setTimeout(() => {
            set((state) => ({
                ...state,
                success: false
            }));
        }, 3000);
    },

    clearDataToExportList: () => {
        set({
            dataExportList: []
        });
    },

    reset: () => (set(getInitialState))
}));

export default useDataExportStore;
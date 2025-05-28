import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,
    dataExportList: [],
    columns: [],
    selectedTable: null,
    isSelectingUnusedMemberVoucher: false,
    isSelectingUnusedMemberCarePackage: false,
    exportFormat: null,
    timeInput: null
});

const useDataExportStore = create((set, get) => ({

    ...getInitialState,

    fetchMemberDetails: async () => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder`);
            const dataToExport = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: false,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Details: ${error}`);
            set({ error: error.message, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberVoucher: async (time) => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder?time=${time}`);
            const dataToExport = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: false,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Vouchers that were unused for the stated amount of time and its details: ${error}`);
            set({ error: error.message, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberCarePackage: async (time) => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder?time=${time}`);
            const dataToExport = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: false,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Care Packages that were unused for the stated amount of time and its details: ${error}`);
            set({ error: error.message, loading: false });
        }

    },

    getDataToExport: async () => {
        
        const {selectedTable, timeInput} = get();

        if (selectedTable === 'member-details') {
            await get().fetchMemberDetails();
        }

        if (selectedTable === "unused-member-voucher") {
            await get().fetchMinimumTimeSinceUsedOfMemberVoucher(timeInput);
        }

        if (selectedTable === "unused-member-care-package") {
            await get().fetchMinimumTimeSinceUsedOfMemberCarePackage(timeInput);
        }
    },

    setSelectedTable: (value) => {
        set({ selectedTable: value })

        if (value === 'member-details') {
            get().setColumns(['member_id', 'name', 'email', 'contact', 'dob', 'sex', 'remarks', 'address', 'nric']);
        }

        if (value === "unused-member-voucher") {
            set({ isSelectingUnusedMemberVoucher: true, isSelectingUnusedMemberCarePackage: false })
            get().setColumns(['member_name', 'contact', 'email', 'member_voucher_name', 'days_since_use', 'created_at']);
        }

        if (value === "unused-member-care-package") {
            set({ isSelectingUnusedMemberVoucher: false, isSelectingUnusedMemberCarePackage: true })
            get().setColumns(['member_name', 'contact', 'email', 'member_care_package_name', 'days_since_use', 'created_at']);
        }
    },

    setTimeInput: (value) => set({ timeInput: value }),

    setExportFormat: (value) => set({ exportFormat: value }),

    setErrorMessage: (value) => set({ errorMessage: value }),

    setLoading: (value) => set({ loading: value }),

    setColumns: (value) => set({ columns: value}),

    reset: () => (set(getInitialState))
}));

export default useDataExportStore;
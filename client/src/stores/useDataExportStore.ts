import { create } from 'zustand';
import api from '@/services/api';

import { 
    DataToExportList,
    UnusedMemberVoucherData,
    UnusedMemberCarePackageData, 
    MemberDetailsData, 
    DataExportState, 
    UseDataExportStore 
} from '../types/dataExport';

const getInitialState = (): DataExportState=> ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,
    dataExportList: null,
    columns: [],
    selectedTable: null,
    isSelectingUnusedMemberVoucher: false,
    isSelectingUnusedMemberCarePackage: false,
    exportFormat: null,
    timeInput: null
});

const useDataExportStore = create<UseDataExportStore>((set, get) => ({

    ...getInitialState(),

    fetchMemberDetails: async (): Promise<void> => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder`);
            const dataToExport: DataToExportList<MemberDetailsData> = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Details: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown error";
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberVoucher: async (time: number): Promise<void> => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder?time=${time}`);
            const dataToExport: DataToExportList<UnusedMemberVoucherData> = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Vouchers that were unused for the stated amount of time and its details: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown error";
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    fetchMinimumTimeSinceUsedOfMemberCarePackage: async (time: number): Promise<void> => {

        set({ loading: true, success: false, error: false })

        try {
            const response = await api.get(`placeholder?time=${time}`);
            const dataToExport: DataToExportList<UnusedMemberCarePackageData> = response.data.data;

            set({
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                dataExportList: dataToExport
            });

        } catch (error) {
            console.error(`Error fetching Member Care Packages that were unused for the stated amount of time and its details: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown error";
            set({ error: true, errorMessage: errorMessage, loading: false });
        }

    },

    getDataToExport: async (): Promise<void> => {
        
        const {selectedTable, timeInput} = get();

        if (selectedTable === 'member-details') {
            await get().fetchMemberDetails();
        }

        if (selectedTable === "unused-member-voucher") {
            await get().fetchMinimumTimeSinceUsedOfMemberVoucher(timeInput? timeInput : 7);
        }

        if (selectedTable === "unused-member-care-package") {
            await get().fetchMinimumTimeSinceUsedOfMemberCarePackage(timeInput? timeInput : 7);
        }
    },

    setSelectedTable: (value: string): void => {
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

    setTimeInput: (value: number): void => set({ timeInput: value }),

    setExportFormat: (value: string): void => set({ exportFormat: value }),

    setErrorMessage: (value: string): void=> set({ errorMessage: value }),

    setLoading: (value: boolean): void => set({ loading: value }),

    setColumns: (value: string[]): void => set({ columns: value}),

    reset: (): void => (set(getInitialState))
}));

export default useDataExportStore;
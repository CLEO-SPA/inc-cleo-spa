import { create } from 'zustand';
import api from '@/services/api';
import {
    MembershipType,
    NewMembershipType,
    UpdatedMembershipType,
    MembershipTypeState,
    UseMembershipTypeStore
} from '../types/membershipType';
import { handleApiError } from '@/utils/errorHandlingUtils';
import { validateMembershipTypeId } from '@/utils/validationUtils';

const getInitialState = (): MembershipTypeState => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,

    membershipTypeList: [],
    selectedMembershipTypeId: -1,

    isCreating: false,
    isConfirming: false,
    isUpdating: false,
    isDeleting: false,
});

// TO DO:
// ADD VALIDATION
// Proper status returns in backend and backend validation


const useMembershipTypeStore = create<UseMembershipTypeStore>((set, get) => ({

    ...getInitialState(),

    fetchAllMembershipType: async (): Promise<void> => {

        set({ loading: true, success: false, error: false });

        try {
            const response = await api.get(`/membership-type/get`);
            const membershipTypeList: MembershipType[] = response.data.data.membershipTypeList;

            set((state) => ({
                ...state,
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                membershipTypeList: membershipTypeList
            }));

            get().setSuccessWithTimeout();

        } catch (error) {
            // console.error(`Error fetching membership type details: ${error}`);
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    getMembershipTypeById: (id: number): MembershipType | undefined => {
        return get().membershipTypeList.find(type => type.id === id);
    },

    createMembershipType: async (data: NewMembershipType): Promise<void> => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.post(`/membership-type/create`, data);
            console.log("Membership created successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, isCreating: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            // console.error(`Error creating membership type: ${error}`);
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    updateMembershipType: async (data: UpdatedMembershipType): Promise<void> => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/membership-type/update`, data);
            console.log("Membership updated successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, isUpdating: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            // console.error(`Error updating membership type: ${error}`);
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },
    deleteMembershipType: async (id: number): Promise<void> => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/membership-type/delete/${id}`);
            console.log("Membership deleted successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false, success: true });

            get().setSuccessWithTimeout();

        } catch (error) {
            // console.error(`Error deleting membership type: ${error}`);
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    setIsCreating: (value: boolean): void => { set({ isCreating: value }) },
    setIsUpdating: (value: boolean): void => { set({ isUpdating: value }) },
    setIsConfirming: (value: boolean): void => { set({ isConfirming: value }) },
    setSelectedMembershipTypeId: (id: number): boolean => {
        const validation: { isValid: boolean, error: string} = validateMembershipTypeId(id);
        if (validation.isValid) {
            set({ selectedMembershipTypeId: id });
            return true;
        }

        set({ error: true, errorMessage: validation.error });
        return false;
    },

    setError:  (value: boolean): void => { set({ error: value }) },

    setErrorMessage:  (value: string): void => { set({ errorMessage: value }) },

    initialize: async (): Promise<void> => {
        await get().fetchAllMembershipType();
    },

    clearError: (): void => {
        set({ error: false, errorMessage: null })
    },

    // Helper function inside the store
    setSuccessWithTimeout: (): void => {
        set({ success: true, error: false, errorMessage: null });

        // Auto-clear success message after 3 seconds (data stays)
        setTimeout(() => {
            set((state) => ({
                ...state,
                success: false  // Only clear the success flag, keep data
            }));
        }, 3000);
    },

    reset: (): void => set(getInitialState())

}));

export default useMembershipTypeStore;
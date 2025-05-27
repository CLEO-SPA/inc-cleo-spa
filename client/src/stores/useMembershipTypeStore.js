import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,

    membershipTypeList: [],
    selectedMembershipTypeId: null,

    isCreating: false,
    isConfirming: false,
    isUpdating: false,
    isDeleting: false,
});

const useMembershipTypeStore = create((set, get) => ({

    ...getInitialState,

    fetchAllMembershipType: async () => {

        set({ loading: true, error: null });

        try {
            const response = await api.get(`placeholder`);
            const membershipTypeList = response.data.data;

            set((state) => ({
                ...state,
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                membershipTypeList: membershipTypeList
            }));
        } catch (error) {
            console.error(`Error fetching membership type details: ${error}`);
            set({ error: error.message, loading: false });
        }
    },

    getMembershipTypeById: (id) => {
        return get().membershipTypes.find(type => type.membership_type_id === id);
    },

    createMembershipType: async (data) => {

        set({ loading: true, error: null });

        try {
            await api.post(`placeholder`, data);
            console.log("Membership created successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false });

            return { success: true };

        } catch (error) {
            console.error(`Error creating membership type: ${error}`);
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }
    },
    updateMembershipType: async (data) => {

        set({ loading: true, error: null });

        try {
            await api.post(`placeholder`, data);
            console.log("Membership updated successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false });

            return { success: true };

        } catch (error) {
            console.error(`Error updating membership type: ${error}`);
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }
    },
    deleteMembershipType: async (data) => {

        set({ loading: true, error: null });

        try {
            await api.post(`placeholder`, data);
            console.log("Membership deleted successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false });

            return { success: true };

        } catch (error) {
            console.error(`Error deleting membership type: ${error}`);
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }
    },

    setIsCreating: (value) => { set({ isCreating: value }) },
    setIsUpdating: (value) => { set({ isUpdating: value }) },
    setIsConfirming: (value) => { set({ isConfirming: value }) },
    setSelectedMembershipTypeId: (value) => { set({ selectedMembershipTypeId: value }) },
    setIsDeleting: (value) => { set({ isUpdating: value }) },

    initialize: async () => {
        await get().fetchAllMembershipType();
    },

    reset: () => set(getInitialState())

}));

export default useMembershipTypeStore;
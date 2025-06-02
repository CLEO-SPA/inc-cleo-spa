import { create } from 'zustand';
import api from '@/services/api';
import { 
    MembershipType,
    NewMembershipType, 
    UpdatedMembershipType, 
    MembershipTypeState, 
    UseMembershipTypeStore} from '../types/membershipType';

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
        } catch (error) {
            console.error(`Error fetching membership type details: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown Error"; // Propery Type the error handling
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    getMembershipTypeById: (id: number): MembershipType | undefined => {
        return get().membershipTypeList.find(type => type.id === id);
    },

    createMembershipType: async (data: NewMembershipType): Promise<{success: boolean, error?: string}> => {

        set({ loading: true, success: false, error: false });

        try {
            await api.post(`/membership-type/create`, data);
            console.log("Membership created successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false, success: true });

            return { success: true };

        } catch (error) {
            console.error(`Error creating membership type: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown Error"; // Propery Type the error handling
            set({ error: true, errorMessage: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    updateMembershipType: async (data: UpdatedMembershipType): Promise<{success: boolean, error?: string}> => {

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/membership-type/update`, data);
            console.log("Membership updated successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false, success: true });

            return { success: true };

        } catch (error) {
            console.error(`Error updating membership type: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown Error"; // Propery Type the error handling
            set({ error: true, errorMessage: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    deleteMembershipType: async (id: number):Promise<{success: boolean, error?: string}> => {

        set({ loading: true, success: false, error: false });

        try {
            await api.put(`/membership-type/delete/${id}`);
            console.log("Membership deleted successfully");

            await get().fetchAllMembershipType();

            set({ isConfirming: false, loading: false, success: true });

            return { success: true };

        } catch (error) {
            console.error(`Error deleting membership type: ${error}`);
            const errorMessage = error instanceof Error ? error.message: "Unknown Error"; // Propery Type the error handling
            set({ error: true, errorMessage: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },

    setIsCreating: (value: boolean): void => { set({ isCreating: value }) },
    setIsUpdating: (value: boolean): void => { set({ isUpdating: value }) },
    setIsConfirming: (value: boolean): void => { set({ isConfirming: value }) },
    setSelectedMembershipTypeId: (value: number): void => { set({ selectedMembershipTypeId: value }) },
    setIsDeleting: (value: boolean): void => { set({ isUpdating: value }) },

    initialize: async (): Promise<void> => {
        await get().fetchAllMembershipType();
    },

    reset: (): void => set(getInitialState())

}));

export default useMembershipTypeStore;
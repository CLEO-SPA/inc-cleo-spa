import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: null,
    errorMessage: null,
    memberList: [],
});

const useMemberStore = create((set, get) => ({

    ...getInitialState(),

    fetchMembersByName: async (name) => {
        set({ loading: true, success: false, error: null, errorMessage: null });
        try {
            const response = await api.get(`/members?name=${name}`);
            set({ memberList: response.data, loading: false, success: true });
        } catch (error) {
            set({
                loading: false,
                success: false,
                error: error,
                errorMessage: error.message || 'Failed to fetch members',
            });
        }
    },

    fetchMembersByEmail: async (id) => {
        set({ loading: true, success: false, error: null, errorMessage: null });
        try {
            const response = await api.get(`/members?email=${email}`);
            set({ memberList: [response.data], loading: false, success: true });
        } catch (error) {
            set({
                loading: false,
                success: false,
                error: error,
                errorMessage: error.message || 'Failed to fetch member',
            });
        }
    },

    fetchMembersByContact: async (contact) => {
        set({ loading: true, success: false, error: null, errorMessage: null });
        try {
            const response = await api.get(`/members?contact=${contact}`);
            set({ memberList: response.data, loading: false, success: true });
        } catch (error) {
            set({
                loading: false,
                success: false,
                error: error,
                errorMessage: error.message || 'Failed to fetch members',
            });
        }
    },

    reset: () => set(getInitialState())
}));
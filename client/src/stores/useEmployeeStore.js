import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  employeeData: {
    employee_name: '',
    employee_email: '',
    employee_contact: '',
    employee_code: '',
    role_name: '',
    position_ids: [],
    created_at: new Date(),
    updated_at: new Date(),
  },

  currentEmployee: null,
  isFetchingOne: false,

  dropdownEmployees: [],
  isFetchingDropdown: false,
  isFetchingName: false,
  employeeName: null,

  inviteLink: null,
  employees: [],
  searchQuery: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },

  error: null,
  success: null,
  isCreating: false,
  isFetchingList: false,
  isRegenerating: null,
  isUpdating: null,
});

const useEmployeeStore = create((set, get) => ({
  ...getInitialState(),

  setEmployeeData: (field, value) => {
    set((state) => ({
      employeeData: {
        ...state.employeeData,
        [field]: value,
      },
    }));
  },

  setSearchQuery: (value) => set({ searchQuery: value }),

  setPageSize: (pageSize) => {
    set((state) => ({
      pagination: { ...state.pagination, pageSize, currentPage: 1 },
    }));
    get().fetchAllEmployees();
  },

  setCurrentPage: (currentPage) => {
    set((state) => ({
      pagination: { ...state.pagination, currentPage },
    }));
    get().fetchAllEmployees();
  },

  resetMessages: () =>
    set({ error: null, success: null, inviteLink: null }),

  reset: () => set(getInitialState()),

  getEmployeeById: async (employeeId) => {
    set({ isFetchingOne: true, error: null, currentEmployee: null });
    try {
      const res = await api.get(`/em/${employeeId}`);
      set({ currentEmployee: res.data.data, isFetchingOne: false });
    } catch (err) {
      set({
        isFetchingOne: false,
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to fetch employee details',
      });
    }
  },

  fetchAllEmployees: async () => {
    const { pagination, searchQuery } = get();
    set({ isFetchingList: true, error: null });

    try {
      const res = await api.get('/em', {
        params: {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          search: searchQuery,
        },
      });

      const data = res.data;

      set({
        employees: data.data || [],
        pagination: {
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          pageSize: data.pageSize || pagination.pageSize,
        },
        isFetchingList: false,
      });
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to fetch employees',
        isFetchingList: false,
      });
    }
  },

  fetchDropdownEmployees: async () => {
    set({ isFetchingDropdown: true, error: null });
    try {
      const res = await api.get('/em/dropdown');
      set({ dropdownEmployees: res.data, isFetchingDropdown: false });
    } catch (err) {
      set({
        dropdownEmployees: [],
        isFetchingDropdown: false,
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to fetch employees',
      });
    }
  },

  createAndInviteEmployee: async (payload) => {
    set({ isCreating: true, error: null, success: null, inviteLink: null });
    try {
      const res = await api.post('/em/create-invite', payload);
      set({
        isCreating: false,
        success:
          'Employee created and invited successfully! The invite link is ready.',
        inviteLink: res.data.resetUrl,
      });
      get().fetchAllEmployees();
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Failed to create employee';
      set({ isCreating: false, error: msg });
      throw new Error(msg);
    }
  },

  updateEmployee: async (employeeId, updatePayload) => {
    set({ isUpdating: employeeId, error: null, success: null });
    try {
      const res = await api.put(`/em/${employeeId}`, updatePayload);
      const { newInviteUrl } = res.data;

      let successMsg = 'Employee updated successfully!';
      if (newInviteUrl) {
        await navigator.clipboard.writeText(newInviteUrl);
        successMsg += ' New invite link copied to clipboard.';
      }

      set({ isUpdating: null, success: successMsg });
      get().fetchAllEmployees();
    } catch (err) {
      set({
        isUpdating: null,
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to update employee',
      });
    }
  },

  regenerateInviteLink: async (employee) => {
    set({ isRegenerating: employee.id, error: null, success: null });
    try {
      const res = await api.post('/em/regenerate-uri', {
        email: employee.employee_email,
      });
      const { callbackUrl } = res.data;
      await navigator.clipboard.writeText(callbackUrl);
      set({
        isRegenerating: null,
        success: `New invite link for ${employee.employee_name} copied to clipboard!`,
      });
      get().fetchAllEmployees();
    } catch (err) {
      set({
        isRegenerating: null,
        error: err.response?.data?.message || 'Failed to regenerate link.',
      });
    }
  },

  fetchEmployeeNameById: async (employeeId) => {
    set({ isFetchingName: true, error: null });
    try {
      const res = await api.get(`/em/employeeName/${employeeId}`);
      set({
        employeeName: res.data,
        isFetchingName: false,
      });
      return res.data;
    } catch (err) {
      set({
        employeeName: null,
        isFetchingName: false,
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to fetch employee',
      });
      throw new Error(
        err?.response?.data?.message ||
        err.message ||
        'Failed to fetch employee'
      );
    }
  },
}));

export default useEmployeeStore;

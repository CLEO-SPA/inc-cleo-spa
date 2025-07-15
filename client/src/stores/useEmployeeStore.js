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

  /* ------------ single-employee detail view ---------------------------- */
  currentEmployee: null,
  isFetchingOne: false,

  /* ------------ dropdown and name-only fetch --------------------------- */
  dropdownEmployees: [],
  isFetchingDropdown: false,
  /* ------------ commission settings fetch --------------------------- */
  commissionSettings: [],
  isFetchingCommissionSettings: false,
  isFetchingName: false,
  employeeName: null,

  inviteLink: null,
  employees: [],
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
  isRegenerating: null, // id
  isUpdating: null, // id
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

  resetMessages: () => set({ error: null, success: null, inviteLink: null }),

  reset: () => set(getInitialState()),

  /* ------------------------------------------------- single fetch */
  getEmployeeById: async (employeeId) => {
    set({ isFetchingOne: true, error: null, currentEmployee: null });
    try {
      const res = await api.get(`/em/${employeeId}`);
      console.log('Fetched employee:', res.data.data);
      set({ currentEmployee: res.data.data, isFetchingOne: false });
    } catch (err) {
      set({
        isFetchingOne: false,
        error: err?.response?.data?.message || err.message || 'Failed to fetch employee details',
      });
    }
  },

  fetchAllEmployees: async () => {
    const { pagination } = get();
    set({ isFetchingList: true, error: null });
    try {
      const res = await api.get(`/em?page=${pagination.currentPage}&limit=${pagination.pageSize}`);
      const data = res.data;

      console.log(data);

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
        error: err?.response?.data?.message || err.message || 'Failed to fetch employees',
        isFetchingList: false,
      });
    }
  },

  /* ------------------------------------------------- dropdown fetch */
  fetchDropdownEmployees: async () => {
    set({ isFetchingDropdown: true, error: null });
    try {
      const res = await api.get('/em/dropdown');
      set({ dropdownEmployees: res.data, isFetchingDropdown: false });
    } catch (err) {
      set({
        dropdownEmployees: [],
        isFetchingDropdown: false,
        error: err?.response?.data?.message || err.message || 'Failed to fetch employees',
      });
    }
  },

  /* ------------------------------------------------- create */
  createAndInviteEmployee: async (payload) => {
    set({ isCreating: true, error: null, success: null, inviteLink: null });
    try {
      const res = await api.post('/em/create-invite', payload);
      set({
        isCreating: false,
        success: 'Employee created and invited successfully! The invite link is ready.',
        inviteLink: res.data.resetUrl,
      });
      get().fetchAllEmployees();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create employee';
      set({ isCreating: false, error: msg });
      throw new Error(msg);
    }
  },
  // createAndInviteEmployee: async (data) => {
  //   set({ isCreating: true, error: null, success: null, inviteLink: null });

  //   console.log(data);

  //   try {
  //     const response = await api.post('/em/create-invite', data);
  //     set({
  //       isCreating: false,
  //       success: 'Employee created and invited successfully! The invite link is ready.',
  //       inviteLink: response.data.resetUrl,
  //     });
  //   } catch (err) {
  //     const apiMessage = err?.response?.data?.message || 'Failed to create employee';
  //     set({ isCreating: false, error: apiMessage });
  //     throw new Error(apiMessage);
  //   }
  // },

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
      get().fetchAllEmployees(); // refresh list
    } catch (err) {
      set({
        isUpdating: null,
        error: err?.response?.data?.message || err.message || 'Failed to update employee',
      });
    }
  },

  regenerateInviteLink: async (employee) => {
    set({ isRegenerating: employee.id, error: null, success: null });
    try {
      const res = await api.post('/em/regenerate-uri', { email: employee.employee_email });
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
      const response = await api.get(`/em/employeeName/${employeeId}`);
      set({
        employeeName: response.data,
        isFetchingName: false,
      });
      return response.data;
    } catch (error) {
      set({
        employeeName: null,
        isFetchingName: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch employee',
      });
      console.error('Error fetching employee:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch employee');
    }
  },

  fetchCommissionSettings: async () => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/em/commissionSettings');
      set({
        commissionSettings: response.data,
        isFetchingCommissionSettings: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        commissionSettings: [],
        isFetchingCommissionSettings: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch commission settings',
      });
    }
  },
}));

export default useEmployeeStore;

import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  /* ------------ form scaffold (for CreateEmployeePage etc.) ------------- */
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
  currentEmployee: null,     // ← NEW – holds object returned by GET /em/employees/:id
  isFetchingOne: false,      // ← NEW

  /* ------------ misc single-item state --------------------------------- */
  inviteLink: null,

  /* ------------ table + pagination ------------------------------------- */
  employees: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },

  /* ------------ UI flags & messages ------------------------------------ */
  error: null,
  success: null,
  isCreating: false,
  isFetchingList: false,
  isRegenerating: null,   // id
  isUpdating: null,       // id
});

const useEmployeeStore = create((set, get) => ({
  /* ------------------------------------------------- state */
  ...getInitialState(),

  /* ------------------------------------------------- helpers */
  setEmployeeData: (field, value) => {
    set((state) => ({
      employeeData: { ...state.employeeData, [field]: value },
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

  /* ------------------------------------------------- single fetch */
  getEmployeeById: async (employeeId) => {
    set({ isFetchingOne: true, error: null, currentEmployee: null });
    try {
      const res = await api.get(`/em/${employeeId}`);
      set({ currentEmployee: res.data, isFetchingOne: false });
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

  /* ------------------------------------------------- list fetch */
  fetchAllEmployees: async () => {
    const { pagination } = get();
    set({ isFetchingList: true, error: null });
    try {
      const res = await api.get(
        `/em?page=${pagination.currentPage}&limit=${pagination.pageSize}`
      );
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
    set({ isFetching: true, error: null });
    try {
      const res = await api.get('/em/dropdown');
      set({ employees: res.data, isFetching: false });
    } catch (err) {
      set({
        employees: [],
        isFetching: false,
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to fetch employees',
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

  /* ------------------------------------------------- update */
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
        error:
          err?.response?.data?.message ||
          err.message ||
          'Failed to update employee',
      });
    }
  },

  /* ------------------------------------------------- regenerate link */
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
        error:
          err?.response?.data?.message || 'Failed to regenerate link.',
      });
    }
  },

  /* ------------------------------------------------- misc */
  resetMessages: () =>
    set({ error: null, success: null, inviteLink: null }),
  reset: () => set(getInitialState()),
}));

export default useEmployeeStore;

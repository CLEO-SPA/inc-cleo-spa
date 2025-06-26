import { create } from 'zustand';
import api from '@/services/api';

const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(10, 0, 0, 0);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getInitialState = () => ({
  employeeData: {
    employee_name: '',
    employee_email: '',
    employee_contact: '',
    employee_code: '',
    role_name: '',
    position_ids: [],
    created_at: getDefaultDateTime(),
    updated_at: getDefaultDateTime(),
  },
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
  isRegenerating: null, // Will hold employee id
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

  fetchAllEmployees: async () => {
    const { pagination } = get();
    set({ isFetchingList: true, error: null });
    try {
      const res = await api.get(`/employee?page=${pagination.currentPage}&limit=${pagination.pageSize}`);
      const data = res.data;
      set({
        employees: data.data || [],
        pagination: {
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          pageSize: data.pageSize || 10,
        },
        isFetchingList: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isFetchingList: false,
      });
    }
  },

  createAndInviteEmployee: async (data) => {
    set({ isCreating: true, error: null, success: null });

    console.log(data);

    try {
      // await api.post('/employee/create-invite', data);
      set({
        isCreating: false,
        success: 'Employee created and invited successfully!',
      });
    } catch (err) {
      const apiMessage = err?.response?.data?.message || 'Failed to create employee';
      set({ isCreating: false, error: apiMessage });
      throw new Error(apiMessage);
    }
  },

  regenerateInviteLink: async (employee) => {
    set({ isRegenerating: employee.id, error: null, success: null });
    try {
      const res = await api.post('/employee/regenerate-uri', { email: employee.employee_email });
      const { callbackUrl } = res.data;
      await navigator.clipboard.writeText(callbackUrl);
      set({
        isRegenerating: null,
        success: `New invite link for ${employee.employee_name} copied to clipboard!`,
      });
    } catch (err) {
      set({
        isRegenerating: null,
        error: err.response?.data?.message || 'Failed to regenerate link.',
      });
    }
  },

  fetchDropdownEmployees: async () => {
    set({ isFetching: true, error: false, errorMessage: null });

    try {
      const response = await api.get('/em/dropdown');
      set({
        employees: response.data,
        isFetching: false,
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        employees: [],
        isFetching: false,
        error: true,
        errorMessage: error.response?.data?.message || error.message || 'Failed to fetch employees',
      });
    }
  },

  resetMessages: () => set({ error: null, success: null }),
  reset: () => set(getInitialState()),
}));

export default useEmployeeStore;

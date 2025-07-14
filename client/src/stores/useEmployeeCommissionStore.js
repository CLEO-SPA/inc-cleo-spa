import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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

  /* ------------ dropdown and name-only fetch --------------------------- */
  employees: [],
  isFetching: false,

  /* ------------ commission settings fetch --------------------------- */
  commissionSettings: {},
  isFetchingCommissionSettings: false,

  /* ------------ commission assignments --------------------------- */
  commissionAssignments: {}, // { itemId: [assignments] }

  isFetchingName: false,
  employeeName: null,

  error: null,
  success: null,
  loading: false,
});

const useEmployeeCommissionStore = create(
  devtools((set, get) => ({
    ...getInitialState(),

    /* ------------------------------------------------- dropdown fetch */
    fetchDropdownEmployees: async () => {
      set({
        isFetching: true,
        loading: true,
        error: null,
      });

      try {
        const res = await api.get('/em/dropdown');
        set({
          employees: res.data,
          isFetching: false,
          loading: false,
        });
      } catch (err) {
        set({
          employees: [],
          isFetching: false,
          loading: false,
          error: err?.response?.data?.message || err.message || 'Failed to fetch employees',
        });
      }
    },


    /* ------------------------------------------------- commission settings */
    fetchCommissionSettings: async () => {
      set({
        isFetchingCommissionSettings: true,
        error: null,
      });

      try {
        const response = await api.get('/em/commissionSettings');
        set({
          commissionSettings: response.data,
          isFetchingCommissionSettings: false,
        });
      } catch (error) {
        set({
          commissionSettings: {},
          isFetchingCommissionSettings: false,
          error: error.response?.data?.message || error.message || 'Failed to fetch commission settings',
        });
      }
    },

    /* ------------------------------------------------- commission assignment management */
    addCommissionAssignment: (itemId, assignment) => {
      set((state) => {
        const currentAssignments = state.commissionAssignments[itemId] || [];
        return {
          commissionAssignments: {
            ...state.commissionAssignments,
            [itemId]: [...currentAssignments, assignment],
          },
        };
      });
    },

    removeCommissionAssignment: (itemId, assignmentId) => {
      set((state) => {
        const currentAssignments = state.commissionAssignments[itemId] || [];
        return {
          commissionAssignments: {
            ...state.commissionAssignments,
            [itemId]: currentAssignments.filter(assignment => assignment.id !== assignmentId),
          },
        };
      });
    },

    updateCommissionAssignment: (itemId, assignmentId, updates) => {
      set((state) => {
        const currentAssignments = state.commissionAssignments[itemId] || [];
        const updatedAssignments = currentAssignments.map(assignment =>
          assignment.id === assignmentId
            ? { ...assignment, ...updates }
            : assignment
        );

        return {
          commissionAssignments: {
            ...state.commissionAssignments,
            [itemId]: updatedAssignments,
          },
        };
      });
    },

    setCommissionAssignments: (itemId, assignments) => {
      set((state) => ({
        commissionAssignments: {
          ...state.commissionAssignments,
          [itemId]: assignments,
        },
      }));
    },

    getCommissionAssignments: (itemId) => {
      const state = get();
      return state.commissionAssignments[itemId] || [];
    },

    /* ------------------------------------------------- utility methods */
    getCommissionRate: (itemType) => {
      const state = get();
      const commissionKey = itemType === 'member-voucher' ? 'member-voucher' : itemType;
      return parseFloat(state.commissionSettings[commissionKey] || '6.00');
    },

    calculatePerformanceRate: (totalEmployees) => {
      return totalEmployees > 0 ? 100 / totalEmployees : 100;
    },

    calculatePerformanceAmount: (totalPrice, performanceRate) => {
      return (totalPrice * performanceRate) / 100;
    },

    calculateCommissionAmount: (performanceAmount, commissionRate) => {
      return (performanceAmount * commissionRate) / 100;
    },

    /* ------------------------------------------------- reset/clear methods */
    resetError: () => set({ error: null }),

    resetSuccess: () => set({ success: null }),

    clearCommissionAssignments: (itemId) => {
      set((state) => ({
        commissionAssignments: {
          ...state.commissionAssignments,
          [itemId]: [],
        },
      }));
    },

    reset: () => set(getInitialState()),
  }))
);

export default useEmployeeCommissionStore;
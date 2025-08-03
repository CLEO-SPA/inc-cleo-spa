import { create } from 'zustand';
import { format } from 'date-fns';
import api from '@/services/api';

const useCommissionStore = create((set, get) => ({
  // Data initialization
  commissionData: [], // Array of daily commission data
  breakdownData: [], // Array of individual commission records for breakdown view
  
  // Current selection state
  selectedEmployee: null, // Employee object with id, name, etc.
  currentMonth: new Date(), // Current month being viewed
  selectedDate: null, // Selected date for breakdown view (YYYY-MM-DD string)

  // Loading states
  loading: {
    monthlyData: false,
    breakdownData: false,
  },

  // Error states
  error: {
    monthlyData: null,
    breakdownData: null,
  },

  // Monthly totals (calculated from daily data)
  monthlyTotals: {
    services: "0.00",
    products: "0.00",
    member_vouchers: "0.00",
    member_care_packages: "0.00",
    performance_total: "0.00",
    commission_total: "0.00",
  },

  // Actions - State setters
  setSelectedEmployee: (employee) => {
    console.log('[COMMISSION STORE] Setting selected employee:', employee);
    set({ selectedEmployee: employee });
  },

  setCurrentMonth: (month) => {
    console.log('[COMMISSION STORE] Setting current month:', month);
    console.log('[COMMISSION STORE] Month toString():', month.toString());
    console.log('[COMMISSION STORE] Month toISOString():', month.toISOString());
    
    set({ 
      currentMonth: month,
      // Clear data when month changes
      commissionData: [],
      breakdownData: [],
      selectedDate: null,
    });
  },

  setSelectedDate: (date) => {
    console.log('[COMMISSION STORE] Setting selected date:', date);
    set({ selectedDate: date });
  },

  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),

  setError: (key, error) => set((state) => ({
    error: { ...state.error, [key]: error }
  })),

  // Clear errors
  clearErrors: () => set({
    error: {
      monthlyData: null,
      breakdownData: null,
    }
  }),

  // API calls
  loadMonthlyCommissionData: async (employeeId, month) => {
    if (!employeeId) {
      console.error('[COMMISSION STORE] No employee ID provided');
      return;
    }

    set((state) => ({
      loading: { ...state.loading, monthlyData: true },
      error: { ...state.error, monthlyData: null }
    }));

    try {
      const monthStr = format(month, 'yyyy-MM'); // Format as 'YYYY-MM'
      console.log('[COMMISSION STORE] Loading monthly commission data:', {
        employeeId,
        monthStr,
        month: month.toString()
      });

      const url = `/com/employee/${employeeId}/monthly?month=${monthStr}`;
      console.log('[COMMISSION STORE] Fetching from URL:', url);

      const response = await api.get(url);
      const data = response.data;
      
      console.log('[COMMISSION STORE] API Response:', data);

      if (data.success) {
        // Calculate monthly totals from daily data
        const totals = {
          services: "0.00",
          products: "0.00", 
          member_vouchers: "0.00",
          member_care_packages: "0.00",
          performance_total: "0.00",
          commission_total: "0.00",
        };

        // Sum up all daily amounts
        data.data.forEach(day => {
          totals.services = (parseFloat(totals.services) + parseFloat(day.services || 0)).toFixed(2);
          totals.products = (parseFloat(totals.products) + parseFloat(day.products || 0)).toFixed(2);
          totals.member_vouchers = (parseFloat(totals.member_vouchers) + parseFloat(day.member_vouchers || 0)).toFixed(2);
          totals.member_care_packages = (parseFloat(totals.member_care_packages) + parseFloat(day.member_care_packages || 0)).toFixed(2);
          totals.performance_total = (parseFloat(totals.performance_total) + parseFloat(day.performance_total || 0)).toFixed(2);
          totals.commission_total = (parseFloat(totals.commission_total) + parseFloat(day.commission_total || 0)).toFixed(2);
        });

        set({
          commissionData: data.data,
          monthlyTotals: totals,
          loading: { ...get().loading, monthlyData: false }
        });

        console.log('[COMMISSION STORE] Monthly commission data loaded successfully:', {
          days: data.data.length,
          totals
        });
      } else {
        throw new Error(data.error?.message || 'Failed to load commission data');
      }
    } catch (error) {
      console.error('[COMMISSION STORE] Failed to load monthly commission data:', error);
      set((state) => ({
        loading: { ...state.loading, monthlyData: false },
        error: { ...state.error, monthlyData: error.message || 'Failed to load commission data' },
        commissionData: [],
        monthlyTotals: {
          services: "0.00",
          products: "0.00",
          member_vouchers: "0.00", 
          member_care_packages: "0.00",
          performance_total: "0.00",
          commission_total: "0.00",
        }
      }));
    }
  },

  loadCommissionBreakdown: async (employeeId, date) => {
    if (!employeeId || !date) {
      console.error('[COMMISSION STORE] Missing employee ID or date for breakdown');
      return;
    }

    set((state) => ({
      loading: { ...state.loading, breakdownData: true },
      error: { ...state.error, breakdownData: null }
    }));

    try {
      console.log('[COMMISSION STORE] Loading commission breakdown:', {
        employeeId,
        date
      });

      const url = `/com/employee/${employeeId}/breakdown/${date}`;
      console.log('[COMMISSION STORE] Fetching breakdown from URL:', url);

      const response = await api.get(url);
      const data = response.data;

      console.log('[COMMISSION STORE] Breakdown API Response:', data);

      if (data.success) {
        set({
          breakdownData: data.data,
          loading: { ...get().loading, breakdownData: false }
        });

        console.log('[COMMISSION STORE] Commission breakdown loaded successfully:', {
          records: data.data.length,
          date
        });
      } else {
        throw new Error(data.error?.message || 'Failed to load breakdown data');
      }
    } catch (error) {
      console.error('[COMMISSION STORE] Failed to load commission breakdown:', error);
      set((state) => ({
        loading: { ...state.loading, breakdownData: false },
        error: { ...state.error, breakdownData: error.message || 'Failed to load breakdown data' },
        breakdownData: []
      }));
    }
  },

  // Computed getters
  getCommissionForDate: (date) => {
    const { commissionData } = get();
    return commissionData.find(day => day.date === date) || {
      date,
      services: "0.00",
      products: "0.00",
      member_vouchers: "0.00",
      member_care_packages: "0.00", 
      performance_total: "0.00",
      commission_total: "0.00",
    };
  },

  hasCommissionDataForDate: (date) => {
    const dayData = get().getCommissionForDate(date);
    return parseFloat(dayData.commission_total) > 0;
  },

  // Initialization helper
  initialize: async (employeeId, month) => {
    console.log('[COMMISSION STORE] Initializing with:', { employeeId, month });
    const { loadMonthlyCommissionData, setCurrentMonth, clearErrors } = get();
    
    clearErrors();
    setCurrentMonth(month);
    
    if (employeeId) {
      await loadMonthlyCommissionData(employeeId, month);
    }
  },

  // Reset store to initial state
  reset: () => {
    console.log('[COMMISSION STORE] Resetting store');
    set({
      commissionData: [],
      breakdownData: [],
      selectedEmployee: null,
      currentMonth: new Date(),
      selectedDate: null,
      loading: {
        monthlyData: false,
        breakdownData: false,
      },
      error: {
        monthlyData: null,
        breakdownData: null,
      },
      monthlyTotals: {
        services: "0.00",
        products: "0.00",
        member_vouchers: "0.00",
        member_care_packages: "0.00",
        performance_total: "0.00",
        commission_total: "0.00",
      },
    });
  }
}));

export default useCommissionStore;
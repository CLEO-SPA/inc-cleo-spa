import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseRevenueData = (raw) => {
  return raw.map(item => {
    const date = new Date(item.date);
    return {
      day: date.getDate(),
      cash: parseFloat(item.cash) || 0,
      visa: parseFloat(item.visa) || 0,
      payment: parseFloat(item.paynow) || 0,
      nets: parseFloat(item.nets) || 0,
      total: parseFloat(item.total) || 0,
      foc: parseFloat(item.foc) || 0,
      vip: parseFloat(item.vip) || 0,
      package: parseFloat(item.package) || 0,
      netSales: parseFloat(item.net_sales) || 0,
      refund: parseFloat(item.refund) || 0,
    };
  });
};

const calculateTotals = (data) => {
  return data.reduce((acc, item) => {
    Object.keys(item).forEach(key => {
      if (key !== 'day') acc[key] = (acc[key] || 0) + item[key];
    });
    return acc;
  }, {});
};

const mergeDataArrays = (...arrays) => {
  const map = new Map();
  arrays.flat().forEach(item => {
    const existing = map.get(item.day) || {
      day: item.day,
      cash: 0, visa: 0, payment: 0, nets: 0, total: 0,
      foc: 0, vip: 0, package: 0, netSales: 0, refund: 0
    };
    Object.keys(item).forEach(key => {
      if (key !== 'day') existing[key] += item[key];
    });
    map.set(item.day, existing);
  });
  return Array.from(map.values()).sort((a, b) => a.day - b.day);
};

export const useRevenueReportStore = create(persist(
  (set, get) => ({
    earliestDate: null,
    selectedMonth: months[new Date().getMonth()],
    selectedYear: new Date().getFullYear().toString(),
    resultMonth: months[new Date().getMonth()],
    resultYear: new Date().getFullYear().toString(),
    loading: false,
    error: null,

    reportData: [],
    mvData: [],
    mcpData: [],
    adhocData: [],
    combinedData: [],
    totals: {
      mv: {}, mcp: {}, adhoc: {}, combined: {}
    },

    // Add new state for deferred revenue data
    deferredRevenue: {
      mv: null,
      mcp: null
    },

    // Add new state for payment methods
    paymentMethods: [],
    paymentMethodsLoading: false,
    paymentMethodsError: null,

    setMonth: (month) => set({ selectedMonth: month }),
    setYear: (year) => set({ selectedYear: year }),
    setReportData: (data) => set({ reportData: data }),

    fetchEarliestDate: async () => {
      set({ loading: true, error: null });
      try {
        const res = await api.get('/rr/range');
        const date = new Date(res.data.data.range.earliest_created_at_sgt);
        set({ earliestDate: date });
      } catch (err) {
        set({ error: err.message || 'Failed to fetch earliest date' });
      } finally {
        set({ loading: false });
      }
    },

    // Add new function to fetch payment methods
    fetchPaymentMethods: async () => {
      set({ paymentMethodsLoading: true, paymentMethodsError: null });
      try {
        const res = await api.get('/payment-method/visible');
        const filteredPaymentMethods = res.data
          .filter(method => method.is_enabled && method.is_income)
          .map(method => ({
            id: method.id,
            payment_method_name: method.payment_method_name
          }));
        
        set({ paymentMethods: filteredPaymentMethods });
      } catch (err) {
        set({ paymentMethodsError: err.message || 'Failed to fetch payment methods' });
      } finally {
        set({ paymentMethodsLoading: false });
      }
    },

    fetchRevenueData: async () => {
      const { selectedMonth, selectedYear } = get();
      const monthIndex = months.indexOf(selectedMonth) + 1;

      set({ loading: true, error: null });
      try {
        const [mvRes, mcpRes, adhocRes, mvDrRes, mcpDrRes] = await Promise.all([
          api.get(`rr/mrr/mv?year=${selectedYear}&month=${monthIndex}`),
          api.get(`rr/mrr/mcp?year=${selectedYear}&month=${monthIndex}`),
          api.get(`rr/mrr/adhoc?year=${selectedYear}&month=${monthIndex}`),
          api.get(`rr/dr/mv?year=${selectedYear}&month=${monthIndex}`),
          api.get(`rr/dr/mcp?year=${selectedYear}&month=${monthIndex}`),
        ]);

        const mv = parseRevenueData(mvRes.data.data);
        const mcp = parseRevenueData(mcpRes.data.data);
        const adhoc = parseRevenueData(adhocRes.data.data);
        const combined = mergeDataArrays(mv, mcp, adhoc);

        set({
          mvData: mv,
          mcpData: mcp,
          adhocData: adhoc,
          combinedData: combined,
          reportData: combined,
          resultMonth: selectedMonth,
          resultYear: selectedYear,
          totals: {
            mv: calculateTotals(mv),
            mcp: calculateTotals(mcp),
            adhoc: calculateTotals(adhoc),
            combined: calculateTotals(combined),
          },
          // Store the deferred revenue data
          deferredRevenue: {
            mv: {
              ...mvDrRes.data.data,
              income: parseFloat(mvDrRes.data.data.income) || 0,
              net_sale: parseFloat(mvDrRes.data.data.net_sale) || 0,
              refund: parseFloat(mvDrRes.data.data.refund) || 0,
              deferred_amount: parseFloat(mvDrRes.data.data.deferred_amount) || 0,
              previous_total_deferred_amount: parseFloat(mvDrRes.data.data.previous_total_deferred_amount) || 0
            },
            mcp: {
              ...mcpDrRes.data.data,
              income: parseFloat(mcpDrRes.data.data.income) || 0,
              net_sale: parseFloat(mcpDrRes.data.data.net_sale) || 0,
              refund: parseFloat(mcpDrRes.data.data.refund) || 0,
              deferred_amount: parseFloat(mcpDrRes.data.data.deferred_amount) || 0,
              previous_total_deferred_amount: parseFloat(mcpDrRes.data.data.previous_total_deferred_amount) || 0
            }
          }
        });
      } catch (err) {
        set({ error: err.message || 'Failed to fetch revenue data' });
      } finally {
        set({ loading: false });
      }
    },

    getMonths: () => months,
  }),
  {
    name: 'revenue-report-storage', // localStorage key
    partialize: (state) => ({
      selectedMonth: state.selectedMonth,
      selectedYear: state.selectedYear,
      resultMonth: state.resultMonth,
      resultYear: state.resultYear,
      reportData: state.reportData,
      mvData: state.mvData,
      mcpData: state.mcpData,
      adhocData: state.adhocData,
      combinedData: state.combinedData,
      totals: state.totals,
      deferredRevenue: state.deferredRevenue, // Add deferred revenue to persisted state
      paymentMethods: state.paymentMethods // Add payment methods to persisted state
    })
  }
));

// Auto-fetch payment methods when the store is created
// This will run when the store is first initialized
const store = useRevenueReportStore.getState();
if (store.paymentMethods.length === 0) {
  store.fetchPaymentMethods();
}
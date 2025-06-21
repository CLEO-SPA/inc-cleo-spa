// --- File: revenueStore.js ---
import { create } from 'zustand';
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

export const useRevenueReportStore = create((set, get) => ({
  earliestDate: null,
  selectedMonth: months[new Date().getMonth()],
  selectedYear: new Date().getFullYear().toString(),
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

  fetchRevenueData: async () => {
    const { selectedMonth, selectedYear } = get();
    const monthIndex = months.indexOf(selectedMonth) + 1;

    set({ loading: true, error: null });
    try {
      const [mvRes, mcpRes, adhocRes] = await Promise.all([
        api.get(`rr/mrr/mv?year=${selectedYear}&month=${monthIndex}`),
        api.get(`rr/mrr/mcp?year=${selectedYear}&month=${monthIndex}`),
        api.get(`rr/mrr/adhoc?year=${selectedYear}&month=${monthIndex}`),
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
        totals: {
          mv: calculateTotals(mv),
          mcp: calculateTotals(mcp),
          adhoc: calculateTotals(adhoc),
          combined: calculateTotals(combined),
        }
      });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch revenue data' });
    } finally {
      set({ loading: false });
    }
  },

  getMonths: () => months,
}));
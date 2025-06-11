import { create } from 'zustand';
import api from '@/services/api';

const initialData = [
  [{ value: 'id' }, { value: 'name' }, { value: 'description' }],
  [{}, {}, {}],
];

// Helper function to convert array of arrays of cell objects to CSV string
const convertDataToCSV = (data) => {
  return data
    .map((row) =>
      row
        .map((cell) => {
          let cellValue = cell && cell.value !== undefined && cell.value !== null ? String(cell.value) : '';
          // Escape quotes by doubling them, and wrap in quotes if it contains comma, newline or quote
          if (cellValue.includes('"') || cellValue.includes(',') || cellValue.includes('\n')) {
            cellValue = `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        })
        .join(',')
    )
    .join('\n');
};

export const useSeedDataStore = create((set, get) => ({
  tables: [
    // {
    //   name: 'care_packages',
    //   pre: true,
    //   post: true,
    // },
  ],
  // Rename sheetData to data to match what's used in the component
  data: initialData, // Make sure initialData is defined, e.g., [[{ value: '' }]] or similar
  isLoading: false,
  error: null,

  // Directly set data, usually from the Spreadsheet component's onChange
  setData: (newData) => set({ data: newData }),

  fetchAvailableTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sa/seed/check/all');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ tables: response.data, isLoading: false }, false);
      } else {
        set({ tables: [], isLoading: false }, false);
      }
    } catch (error) {
      console.error('Failed to fetch available table data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      // Ensure this also resets 'data' if that's the desired behavior on error
      set({ error: errorMessage, isLoading: false, data: initialData });
    }
  },

  fetchPreData: async (tableName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sa/seed/pre/' + tableName);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ data: response.data, isLoading: false });
      } else {
        set({ data: initialData, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch pre-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData }); // Fallback on error
    }
  },

  fetchPostData: async (tableName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sa/seed/post/' + tableName);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ data: response.data, isLoading: false });
      } else {
        set({ data: initialData, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch post-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData }); // Fallback on error
    }
  },

  // Add resetSchemaAndDataToDefault if you haven't already, or ensure resetData does this.
  resetSchemaAndDataToDefault: () => {
    // Assuming this function exists from previous steps
    set({ data: initialData, error: null, isLoading: false }); // Simplified for this example
  },

  savePreData: async (tableName) => {
    const currentData = get().data;
    const nonEmptyData = currentData.filter((row) =>
      row.some((cell) => cell && cell.value !== undefined && cell.value !== null && cell.value !== '')
    );

    if (nonEmptyData.length === 0) {
      alert('Cannot save empty data.');
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const csvData = convertDataToCSV(nonEmptyData);
      const file = new File([csvData], `${tableName}.csv`, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/sa/update/pre`, formData);
      set({ isLoading: false });
      alert(`${tableName} data saved successfully!`);
      get().fetchPreData(tableName);
    } catch (error) {
      console.error(`Failed to save ${tableName} data:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save ${tableName} data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  savePostData: async (tableName) => {
    const currentData = get().data;
    const nonEmptyData = currentData.filter((row) =>
      row.some((cell) => cell && cell.value !== undefined && cell.value !== null && cell.value !== '')
    );
    if (nonEmptyData.length === 0) {
      alert('Cannot save empty data.');
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const csvData = convertDataToCSV(nonEmptyData);
      const file = new File([csvData], `${tableName}.csv`, { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/sa/update/post`, formData);
      set({ isLoading: false });
      alert(`${tableName} data saved successfully!`);
      get().fetchPostData(tableName);
    } catch (error) {
      console.error(`Failed to save ${tableName} data:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save ${tableName} data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  seedPreData: async (tableName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/sa/seed/pre/' + tableName);
      console.log(response);
    } catch (error) {
      console.error('Failed to fetch pre-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData }); // Fallback on error
    }
  },

  seedPostData: async (tableName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/sa/seed/post/' + tableName);
      console.log(response);
    } catch (error) {
      console.error('Failed to fetch pre-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData }); // Fallback on error
    }
  },

  addRow: () => {
    const currentData = get().data;
    // Ensure there's at least one row to determine column count, or default
    const columnCount = currentData.length > 0 && currentData[0] ? currentData[0].length : 1;
    const newEmptyRow = Array(columnCount)
      .fill(null)
      .map(() => ({ value: '' }));
    set({ data: [...currentData, newEmptyRow] });
  },

  addColumn: () => {
    const currentData = get().data;
    if (currentData.length === 0) {
      // If no rows, add a new row with one column
      set({ data: [[{ value: '' }]] });
      return;
    }
    const newData = currentData.map((row) => [...row, { value: '' }]);
    set({ data: newData });
  },
}));

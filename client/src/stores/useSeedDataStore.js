import { create } from 'zustand';
import api from '@/services/api';

export const initialData = [
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
  data: initialData,
  isLoading: false,
  error: null,
  availableFiles: [],
  selectedFile: '',

  setData: (newData) => set({ data: newData }),

  fetchAvailableTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sa/seed/check/all');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ tables: response.data, isLoading: false });
      } else {
        set({ tables: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch available table data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tables';
      set({
        error: errorMessage,
        isLoading: false,
        tables: [],
        data: initialData,
        availableFiles: [],
        selectedFile: '',
      });
    }
  },

  fetchPreAvailableFilesForTable: async (tableName) => {
    if (!tableName) {
      set({ availableFiles: [], selectedFile: '', data: initialData });
      return;
    }
    set({ isLoading: true, error: null, data: initialData, selectedFile: '' });
    try {
      const response = await api.get(`/sa/seed/pre/${tableName}`);

      console.log(response);

      set({ availableFiles: response.data || [], isLoading: false });
      if ((response.data || []).length === 0) {
        set({ selectedFile: '' }); // No file to select if list is empty
      }
    } catch (error) {
      console.error(`Failed to fetch files for table ${tableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to load files for ${tableName}`;
      set({ error: errorMessage, isLoading: false, availableFiles: [], selectedFile: '', data: initialData });
    }
  },

  fetchPostAvailableFilesForTable: async (tableName) => {
    if (!tableName) {
      set({ availableFiles: [], selectedFile: '', data: initialData });
      return;
    }
    set({ isLoading: true, error: null, data: initialData, selectedFile: '' });
    try {
      const response = await api.get(`/sa/seed/post/${tableName}`);

      console.log(response);

      set({ availableFiles: response.data || [], isLoading: false });
      if ((response.data || []).length === 0) {
        set({ selectedFile: '' }); // No file to select if list is empty
      }
    } catch (error) {
      console.error(`Failed to fetch files for table ${tableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to load files for ${tableName}`;
      set({ error: errorMessage, isLoading: false, availableFiles: [], selectedFile: '', data: initialData });
    }
  },

  fetchPreData: async (tableName, fileName) => {
    if (!tableName || !fileName) {
      set({ data: initialData, error: 'Table name or file name missing for fetching pre-data.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/sa/seed/pre/${tableName}/${fileName}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ data: response.data, isLoading: false, selectedFile: fileName });
      } else {
        set({ data: initialData, isLoading: false, selectedFile: fileName });
      }
    } catch (error) {
      console.error(`Failed to fetch pre-data for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData });
    }
  },

  fetchPostData: async (tableName, fileName) => {
    if (!tableName || !fileName) {
      set({ data: initialData, error: 'Table name or file name missing for fetching post-data.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/sa/seed/post/${tableName}/${fileName}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        set({ data: response.data, isLoading: false, selectedFile: fileName });
      } else {
        set({ data: initialData, isLoading: false, selectedFile: fileName });
      }
    } catch (error) {
      console.error(`Failed to fetch post-data for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set({ error: errorMessage, isLoading: false, data: initialData });
    }
  },

  resetSchemaAndDataToDefault: () => {
    set({ data: initialData, error: null, isLoading: false, selectedFile: '' });
  },

  savePreData: async (tableName, fileName) => {
    if (!tableName || !fileName) {
      alert('Table name and file name are required to save pre-data.');
      return;
    }
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
      const file = new File([csvData], `${fileName}.csv`, { type: 'text/csv' });

      console.log('Frontend tableName', tableName);
      console.log('Frontend fileName', fileName);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);
      await api.post(`/sa/update/pre`, formData);

      set({ isLoading: false });
      alert(`Pre-data for table '${tableName}', file '${fileName}.csv' saved successfully!`);
      get().fetchAvailableFilesForTable(tableName);
      get().fetchPreData(tableName, fileName);
    } catch (error) {
      console.error(`Failed to save pre-data for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save pre-data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  savePostData: async (tableName, fileName) => {
    if (!tableName || !fileName) {
      alert('Table name and file name are required to save post-data.');
      return;
    }
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
      const file = new File([csvData], `${fileName}.csv`, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);
      await api.post(`/sa/update/post`, formData);

      set({ isLoading: false });
      alert(`Post-data for table '${tableName}', file '${fileName}.csv' saved successfully!`);
      get().fetchPostData(tableName, fileName);
      get().fetchAvailableFilesForTable(tableName);
    } catch (error) {
      console.error(`Failed to save post-data for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save post-data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  seedPreData: async (tableName, tablePayload) => {
    set({ isLoading: true, error: null });
    try {
      const fileToSeed = get().selectedFile;
      if (!fileToSeed) {
        alert('Please select a file to seed.');
        set({ isLoading: false });
        return;
      }
      const payload = { targetTable: tableName, tablePayload };
      const response = await api.post('/sa/seed/pre', payload); // Adjust endpoint if it takes payload in body
      console.log(response);
      alert(`Seeding pre-data for ${tableName} (file: ${fileToSeed}) initiated.`);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to seed pre-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to seed pre-data';
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  seedPostData: async (tableName, tablePayload) => {
    set({ isLoading: true, error: null });
    try {
      const fileToSeed = get().selectedFile;
      if (!fileToSeed) {
        alert('Please select a file to seed.');
        set({ isLoading: false });
        return;
      }
      const payload = { targetTable: tableName, tablePayload };
      const response = await api.post('/sa/seed/post', payload);
      console.log(response);
      alert(`Seeding post-data for ${tableName} (file: ${fileToSeed}) initiated.`);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to seed post-data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to seed post-data';
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
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

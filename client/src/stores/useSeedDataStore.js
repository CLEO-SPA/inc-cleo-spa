import { create } from 'zustand';
import api from '@/services/api';

// Represents the default structure for a single spreadsheet
export const defaultSpreadsheetData = [
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
  tables: [],
  data: {},
  isLoading: false,
  error: null,

  seedingSetTables: [],
  activeTableForDisplay: null,

  // Modified structure: { [tableName: string]: { pre: SeedFileStatus[], post: SeedFileStatus[] } }
  availableFiles: {},

  // Selected file name for each table
  selectedFiles: {},

  // Selected file type (pre/post) for each table
  selectedFileTypes: {},

  // Action to set the data for a specific table
  setTableData: (tableName, newData) => {
    set((state) => ({
      data: {
        ...state.data,
        [tableName]: newData,
      },
    }));
  },

  setActiveTableForDisplay: (tableName) => {
    set({ activeTableForDisplay: tableName });
  },

  fetchAvailableTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sa/seed/check/all');
      set({ tables: response.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch available table data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tables';
      set({
        error: errorMessage,
        isLoading: false,
        tables: [],
        data: {},
        seedingSetTables: [],
        activeTableForDisplay: null,
        availableFiles: {},
        selectedFiles: {},
        selectedFileTypes: {},
      });
    }
  },

  // Fetches available pre and post files for a specific table
  fetchAvailableFilesForTable: async (tableName) => {
    if (!tableName) return;
    set((state) => ({
      isLoading: true,
      error: null,
      availableFiles: { ...state.availableFiles, [tableName]: { pre: [], post: [] } },
      selectedFiles: { ...state.selectedFiles, [tableName]: '' },
      selectedFileTypes: { ...state.selectedFileTypes, [tableName]: 'pre' }, // Default to pre
      data: { ...state.data, [tableName]: defaultSpreadsheetData },
    }));
    try {
      // Fetch both pre and post files
      const [preResponse, postResponse] = await Promise.all([
        api.get(`/sa/seed/pre/${tableName}`),
        api.get(`/sa/seed/post/${tableName}`),
      ]);

      const preFiles = preResponse.data || [];
      const postFiles = postResponse.data || [];

      set((state) => ({
        availableFiles: {
          ...state.availableFiles,
          [tableName]: {
            pre: preFiles,
            post: postFiles,
          },
        },
        isLoading: false,
      }));

      // Auto-select the first pre file if available, otherwise first post file
      if (preFiles.length > 0) {
        get().setSelectedFileForTable(tableName, preFiles[0].name, 'pre');
      } else if (postFiles.length > 0) {
        get().setSelectedFileForTable(tableName, postFiles[0].name, 'post');
      }
    } catch (error) {
      console.error(`Failed to fetch files for table ${tableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to load files for ${tableName}`;
      set((state) => ({
        error: errorMessage,
        isLoading: false,
        availableFiles: { ...state.availableFiles, [tableName]: { pre: [], post: [] } },
      }));
    }
  },

  // Sets the selected file for a table and fetches its data
  setSelectedFileForTable: (tableName, fileName, fileType) => {
    // First update the selected type regardless of fileName
    set((state) => ({
      selectedFileTypes: { ...state.selectedFileTypes, [tableName]: fileType },
    }));

    // Then update the filename and fetch data if a filename was provided
    set((state) => ({
      selectedFiles: { ...state.selectedFiles, [tableName]: fileName },
    }));

    if (fileName) {
      get().fetchTableData(tableName, fileName, fileType);
    } else {
      set((state) => ({
        data: { ...state.data, [tableName]: defaultSpreadsheetData },
      }));
    }
  },

  // Generic function to fetch data for a table
  fetchTableData: async (tableName, fileName, dataType) => {
    if (!tableName || !fileName || !dataType) {
      set((state) => ({
        data: { ...state.data, [tableName]: defaultSpreadsheetData },
        error: `Table, file, or type missing for fetching ${dataType}-data.`,
      }));
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/sa/seed/${dataType}/${tableName}/${fileName}`);
      set((state) => ({
        data: {
          ...state.data,
          [tableName]: response.data && response.data.length > 0 ? response.data : defaultSpreadsheetData,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error(`Failed to fetch ${dataType}-data for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      set((state) => ({
        error: errorMessage,
        isLoading: false,
        data: { ...state.data, [tableName]: defaultSpreadsheetData },
      }));
    }
  },

  // Loads the target table and its ancestors for seeding
  loadTablesForSeedingSet: async (targetTableName) => {
    if (!targetTableName) return;
    set({
      isLoading: true,
      error: null,
      seedingSetTables: [],
      data: {},
      availableFiles: {},
      selectedFiles: {},
      selectedFileTypes: {},
      activeTableForDisplay: null,
    });

    try {
      const orderResponse = await api.get(`/sa/seed/order/${targetTableName}`);
      const tablesInOrder = orderResponse.data?.sortedOrderForInsert || [];

      if (!tablesInOrder.includes(targetTableName)) {
        if (tablesInOrder.length === 0) {
          tablesInOrder.push(targetTableName);
        } else {
          throw new Error(`Target table ${targetTableName} not found in its own seeding order.`);
        }
      }

      set({ seedingSetTables: tablesInOrder, activeTableForDisplay: targetTableName });

      // Fetch files for all tables in the set
      for (const tableNameInSet of tablesInOrder) {
        await get().fetchAvailableFilesForTable(tableNameInSet);
      }

      set({ isLoading: false });
    } catch (error) {
      console.error(`Failed to load seeding set for ${targetTableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load table seeding order';
      set({ error: errorMessage, isLoading: false });
    }
  },

  resetActiveTableToDefault: () => {
    const activeTable = get().activeTableForDisplay;
    if (activeTable) {
      set((state) => ({
        data: { ...state.data, [activeTable]: defaultSpreadsheetData },
        selectedFiles: { ...state.selectedFiles, [activeTable]: '' },
      }));
    }
  },

  // Resets everything related to the current multi-table seeding view
  clearCurrentSeedingSet: () => {
    set({
      data: {},
      seedingSetTables: [],
      activeTableForDisplay: null,
      availableFiles: {},
      selectedFiles: {},
      selectedFileTypes: {},
      error: null,
    });
  },

  // Save data for a table with specified file type
  saveTableData: async (tableName, fileNameToSave, dataType) => {
    if (!tableName || !fileNameToSave || !dataType) {
      alert('Table name, file name, and data type are required to save.');
      return;
    }

    const tableData = get().data[tableName];
    if (!tableData) {
      alert(`No data found for table ${tableName} to save.`);
      return;
    }

    const nonEmptyData = tableData.filter((row) =>
      row.some((cell) => cell && cell.value !== undefined && cell.value !== null && cell.value !== '')
    );

    if (nonEmptyData.length === 0) {
      alert('Cannot save empty data for the table.');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const csvData = convertDataToCSV(nonEmptyData);
      const file = new File([csvData], `${fileNameToSave}.csv`, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);

      await api.post(`/sa/update/${dataType}`, formData);

      set({ isLoading: false });
      alert(`${dataType}-data for table '${tableName}', file '${fileNameToSave}.csv' saved successfully!`);

      // Refresh files and data for the saved table
      await get().fetchAvailableFilesForTable(tableName);
      await get().setSelectedFileForTable(tableName, fileNameToSave, dataType);
    } catch (error) {
      console.error(`Failed to save ${dataType}-data for ${tableName}/${fileNameToSave}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save ${dataType}-data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  // Merge pre and post files with the same name
  mergeTableFiles: async (tableName, fileName) => {
    if (!tableName || !fileName) {
      throw new Error('Table name and file name are required for merging.');
    }

    set({ isLoading: true, error: null });
    try {
      // Check if both pre and post files exist
      const availableFilesForTable = get().availableFiles[tableName] || { pre: [], post: [] };
      const preFileExists = availableFilesForTable.pre?.some((f) => f.name === fileName);
      const postFileExists = availableFilesForTable.post?.some((f) => f.name === fileName);

      if (!preFileExists || !postFileExists) {
        throw new Error(`Both pre and post files named "${fileName}.csv" must exist for merging.`);
      }

      // Call backend API to perform the merge
      await api.post('/sa/seed/merge', {
        tableName,
        fileName,
      });

      // Refresh files for this table after merge
      await get().fetchAvailableFilesForTable(tableName);
      set({ isLoading: false });

      return true;
    } catch (error) {
      console.error(`Failed to merge files for ${tableName}/${fileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to merge files`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  copyTableDataFile: async (tableName, originalFileName, dataType) => {
    if (!tableName || !originalFileName || !dataType) {
      alert('Table name, original file name, and data type are required to copy.');
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const currentAvailableFileObjects = get().availableFiles[tableName]?.[dataType] || [];
      const baseName = originalFileName.replace(/\.csv$/i, '');
      let newFileName = '';
      let counter = 1;

      while (true) {
        const potentialName = `${baseName}_${counter}`;
        if (!currentAvailableFileObjects.some((fileObj) => fileObj.name === potentialName)) {
          newFileName = potentialName;
          break;
        }
        counter++;
      }

      const response = await api.get(`/sa/seed/${dataType}/${tableName}/${originalFileName}`);
      const originalData = response.data;

      if (!originalData || originalData.length === 0) {
        throw new Error(
          `Original file ${originalFileName}.csv for table ${tableName} is empty or could not be fetched.`
        );
      }

      const csvData = convertDataToCSV(originalData);
      const fileToCopy = new File([csvData], `${newFileName}.csv`, { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', fileToCopy);
      formData.append('tableName', tableName);

      await api.post(`/sa/update/${dataType}`, formData);
      set({ isLoading: false });

      await get().fetchAvailableFilesForTable(tableName);
      await get().setSelectedFileForTable(tableName, newFileName, dataType);
      return true;
    } catch (error) {
      console.error(`Failed to copy ${dataType}-data for ${tableName}/${originalFileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to copy file';
      set({ error: errorMessage, isLoading: false });
      alert(`Error copying file: ${errorMessage}`);
      return false;
    }
  },

  deleteTableDataFile: async (tableName, fileNameToDelete, dataType) => {
    if (!tableName || !fileNameToDelete || !dataType) {
      alert('Table name, file name, and data type are required to delete.');
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      await api.delete(`/sa/seed/${dataType}/${tableName}/${fileNameToDelete}`);
      set({ isLoading: false });

      // Refresh files for the table
      await get().fetchAvailableFilesForTable(tableName);

      // Clear selected file and data for this table if it was the one deleted
      if (get().selectedFiles[tableName] === fileNameToDelete && get().selectedFileTypes[tableName] === dataType) {
        set((state) => ({
          selectedFiles: { ...state.selectedFiles, [tableName]: '' },
          data: { ...state.data, [tableName]: defaultSpreadsheetData },
        }));
      }
      return true;
    } catch (error) {
      console.error(`Failed to delete ${dataType}-data file ${fileNameToDelete} for ${tableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete file';
      set({ error: errorMessage, isLoading: false });
      alert(`Error deleting file: ${errorMessage}`);
      return false;
    }
  },

  // For seeding the entire set using selected files and file types
  seedCurrentSet: async (targetTableName) => {
    set({ isLoading: true, error: null });
    try {
      const tablesToSeed = get().seedingSetTables;
      const currentSelectedFiles = get().selectedFiles;
      const currentSelectedFileTypes = get().selectedFileTypes;

      const tablePayload = tablesToSeed.map((tn) => {
        if (!currentSelectedFiles[tn]) {
          throw new Error(`File not selected for table: ${tn}. Please select a file for all tables in the set.`);
        }

        return {
          table: tn,
          file: currentSelectedFiles[tn],
          type: currentSelectedFileTypes[tn] || 'pre',
        };
      });

      if (tablePayload.length !== tablesToSeed.length) {
        alert('Not all tables in the seeding set have a selected file. Please select files for all tables.');
        set({ isLoading: false });
        return;
      }

      const payload = { targetTable: targetTableName, tablePayload };
      await api.post(`/sa/seed`, payload);

      alert(`Seeding data for ${targetTableName} and its dependencies initiated successfully.`);
      set({ isLoading: false });
    } catch (error) {
      console.error(`Failed to seed data for ${targetTableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to seed data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  addRow: () => {
    const activeTable = get().activeTableForDisplay;
    if (!activeTable || !get().data[activeTable]) return;

    const currentTableData = get().data[activeTable];
    const columnCount = currentTableData.length > 0 && currentTableData[0] ? currentTableData[0].length : 1;
    const newEmptyRow = Array(columnCount)
      .fill(null)
      .map(() => ({ value: '' }));

    set((state) => ({
      data: {
        ...state.data,
        [activeTable]: [...currentTableData, newEmptyRow],
      },
    }));
  },

  deleteRow: () => {
    const activeTable = get().activeTableForDisplay;
    if (!activeTable || !get().data[activeTable]) return;

    const currentTableData = get().data[activeTable];
    if (currentTableData.length <= 1) {
      return;
    }

    set((state) => ({
      data: {
        ...state.data,
        [activeTable]: currentTableData.slice(0, -1),
      },
    }));
  },

  addColumn: () => {
    const activeTable = get().activeTableForDisplay;
    if (!activeTable || !get().data[activeTable]) return;

    let currentTableData = get().data[activeTable];
    if (currentTableData.length === 0) {
      // If table is empty, add a row first
      currentTableData = [[{ value: '' }]];
    } else {
      currentTableData = currentTableData.map((row) => [...row, { value: '' }]);
    }

    set((state) => ({
      data: {
        ...state.data,
        [activeTable]: currentTableData,
      },
    }));
  },

  deleteColumn: () => {
    const activeTable = get().activeTableForDisplay;
    if (!activeTable || !get().data[activeTable]) return;

    const currentTableData = get().data[activeTable];
    if (currentTableData.length === 0 || currentTableData[0].length <= 1) {
      return;
    }

    const newTableData = currentTableData.map((row) => row.slice(0, -1));

    set((state) => ({
      data: {
        ...state.data,
        [activeTable]: newTableData,
      },
    }));
  },
}));

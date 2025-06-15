import { create } from 'zustand';
import api from '@/services/api';

// Renamed: Represents the default structure for a single spreadsheet
export const defaultSpreadsheetData = [
  [{ value: 'id' }, { value: 'name' }, { value: 'description' }],
  [{}, {}, {}],
];

// Helper function to convert array of arrays of cell objects to CSV string (remains the same)
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
  tables: [], // List of all available tables from /sa/seed/check/all
  data: {}, // Object: { [tableName: string]: Array<Array<Cell>> }
  isLoading: false,
  error: null,

  seedingSetTables: [], // Array of table names for current seeding context (target + ancestors)
  activeTableForDisplay: null, // String: tableName of the currently viewed/edited spreadsheet

  availableFiles: {}, // Object: { [tableName: string]: string[] }
  selectedFiles: {}, // Object: { [tableName: string]: string }

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
      });
    }
  },

  // Fetches available files for a specific table
  fetchAvailableFilesForTable: async (tableName, dataType) => {
    if (!tableName || !dataType) return;
    set((state) => ({
      isLoading: true, // Consider a more granular loading state if needed
      error: null,
      availableFiles: { ...state.availableFiles, [tableName]: [] }, // Clear previous files for this table
      selectedFiles: { ...state.selectedFiles, [tableName]: '' }, // Clear previous selection
      data: { ...state.data, [tableName]: defaultSpreadsheetData }, // Reset data for this table
    }));
    try {
      const response = await api.get(`/sa/seed/${dataType}/${tableName}`);
      const files = response.data || [];
      set((state) => ({
        availableFiles: { ...state.availableFiles, [tableName]: files },
        isLoading: false,
      }));
      // Optionally, auto-select the first file if available
      if (files.length > 0) {
        // get().setSelectedFileForTable(tableName, files[0], dataType); // Auto-load data for it
      }
    } catch (error) {
      console.error(`Failed to fetch ${dataType} files for table ${tableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to load files for ${tableName}`;
      set((state) => ({
        error: errorMessage, // This error is global, might need per-table error state
        isLoading: false,
        availableFiles: { ...state.availableFiles, [tableName]: [] },
      }));
    }
  },

  // Sets the selected file for a table and fetches its data
  setSelectedFileForTable: (tableName, fileName, dataType) => {
    set((state) => ({
      selectedFiles: { ...state.selectedFiles, [tableName]: fileName },
    }));
    if (fileName) {
      if (dataType === 'pre') {
        get().fetchTableData(tableName, fileName, 'pre');
      } else {
        get().fetchTableData(tableName, fileName, 'post');
      }
    } else {
      // No file selected, reset to default schema
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
    set({ isLoading: true, error: null }); // Global loading
    try {
      const response = await api.get(`/sa/seed/${dataType}/${tableName}/${fileName}`);
      set((state) => ({
        data: {
          ...state.data,
          [tableName]: response.data && response.data.length > 0 ? response.data : defaultSpreadsheetData,
        },
        isLoading: false,
        // selectedFiles: { ...state.selectedFiles, [tableName]: fileName }, // Already set by setSelectedFileForTable
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
  loadTablesForSeedingSet: async (targetTableName, dataType) => {
    if (!targetTableName || !dataType) return;
    set({
      isLoading: true,
      error: null,
      seedingSetTables: [],
      data: {},
      availableFiles: {},
      selectedFiles: {},
      activeTableForDisplay: null,
    });
    try {
      const orderResponse = await api.get(`/sa/seed/order/${targetTableName}`);
      console.log(orderResponse);

      const tablesInOrder = orderResponse.data?.sortedOrderForInsert || []; // Assuming insertOrder contains target + ancestors
      if (!tablesInOrder.includes(targetTableName)) {
        // Ensure target is in the list
        if (tablesInOrder.length === 0) {
          // if target has no deps
          tablesInOrder.push(targetTableName);
        } else {
          throw new Error(`Target table ${targetTableName} not found in its own seeding order.`);
        }
      }

      set({ seedingSetTables: tablesInOrder, activeTableForDisplay: targetTableName });

      // Sequentially fetch available files and then potentially data for each table
      for (const tableNameInSet of tablesInOrder) {
        await get().fetchAvailableFilesForTable(tableNameInSet, dataType);
        // After files are fetched, if a file should be auto-selected and loaded,
        // that logic would be inside fetchAvailableFilesForTable or called here.
        // For now, we just load defaultSpreadsheetData, user has to pick a file.
        const currentFiles = get().availableFiles[tableNameInSet] || [];
        if (currentFiles.length > 0) {
          // Auto-select and load the first file for simplicity in this phase
          await get().setSelectedFileForTable(tableNameInSet, currentFiles[0], dataType);
        } else {
          set((state) => ({
            data: { ...state.data, [tableNameInSet]: defaultSpreadsheetData },
          }));
        }
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
        // availableFiles for this table remain as they are
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
      error: null,
    });
  },

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
      formData.append('tableName', tableName); // Server needs to know which subfolder

      await api.post(`/sa/update/${dataType}`, formData);

      set({ isLoading: false });
      alert(`${dataType}-data for table '${tableName}', file '${fileNameToSave}.csv' saved successfully!`);
      // Refresh files and data for the saved table
      await get().fetchAvailableFilesForTable(tableName, dataType);
      // After fetching files, re-select and fetch data for the just-saved file
      await get().setSelectedFileForTable(tableName, fileNameToSave, dataType);
    } catch (error) {
      console.error(`Failed to save ${dataType}-data for ${tableName}/${fileNameToSave}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to save ${dataType}-data`;
      set({ error: errorMessage, isLoading: false });
      alert(`Error: ${errorMessage}`);
    }
  },

  copyTableDataFile: async (tableName, originalFileName, dataType) => {
    if (!tableName || !originalFileName || !dataType) {
      alert('Table name, original file name, and data type are required to copy.');
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      // 1. Determine the new filename
      const currentAvailableFiles = get().availableFiles[tableName] || [];
      const baseName = originalFileName.replace(/\.csv$/i, '');
      let newFileName = '';
      let counter = 1;
      // Loop to find an available filename like baseName_1, baseName_2, etc.
      while (true) {
        const potentialName = `${baseName}_${counter}`;
        if (!currentAvailableFiles.includes(potentialName)) {
          newFileName = potentialName;
          break;
        }
        counter++;
      }

      // 2. Fetch the data of the original file
      const response = await api.get(`/sa/seed/${dataType}/${tableName}/${originalFileName}`);
      const originalData = response.data;

      if (!originalData || originalData.length === 0) {
        throw new Error(
          `Original file ${originalFileName}.csv for table ${tableName} is empty or could not be fetched.`
        );
      }

      // 3. Convert this data to CSV
      const csvData = convertDataToCSV(originalData);
      const fileToCopy = new File([csvData], `${newFileName}.csv`, { type: 'text/csv' });

      // 4. Save this CSV data as a new file
      const formData = new FormData();
      formData.append('file', fileToCopy);
      formData.append('tableName', tableName);

      await api.post(`/sa/update/${dataType}`, formData);

      set({ isLoading: false });
      // No alert needed as per new requirement

      // 5. Refresh files for the table
      await get().fetchAvailableFilesForTable(tableName, dataType);
      // 6. Set the new copy as the selected file
      await get().setSelectedFileForTable(tableName, newFileName, dataType);
      // The useEffect in DataSeedingPage will update newFileNameInputs
      return true;
    } catch (error) {
      console.error(`Failed to copy ${dataType}-data for ${tableName}/${originalFileName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to copy file';
      set({ error: errorMessage, isLoading: false });
      alert(`Error copying file: ${errorMessage}`); // Keep error alert
      return false;
    }
  },

  // For seeding the entire set based on current selections
  seedCurrentSet: async (targetTableName, dataType) => {
    set({ isLoading: true, error: null });
    try {
      const tablesToSeed = get().seedingSetTables;
      const currentSelectedFiles = get().selectedFiles;

      const tablePayload = tablesToSeed.map((tn) => {
        if (!currentSelectedFiles[tn]) {
          // If strict, throw error. If lenient, filter out.
          // For now, let's assume a file must be selected or it's an error to proceed.
          throw new Error(`File not selected for table: ${tn}. Please select a file for all tables in the set.`);
        }
        return { table: tn, file: currentSelectedFiles[tn] };
      });
      // .filter(p => p.file); // Use this if you want to allow seeding only tables with files selected

      if (tablePayload.length !== tablesToSeed.length) {
        // This case might be handled by the throw above, but as a fallback.
        alert('Not all tables in the seeding set have a selected file. Please select files for all tables.');
        set({ isLoading: false });
        return;
      }

      const payload = { targetTable: targetTableName, tablePayload }; // Backend expects targetTable for context
      console.log(payload);
      // await api.post(`/sa/seed/${dataType}`, payload);

      alert(`Seeding ${dataType}-data for ${targetTableName} and its dependencies initiated successfully.`);
      set({ isLoading: false });
    } catch (error) {
      console.error(`Failed to seed ${dataType}-data for ${targetTableName}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to seed ${dataType}-data`;
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
}));

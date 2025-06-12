import React, { useEffect, useState, useCallback } from 'react';
import Spreadsheet from 'react-spreadsheet';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useSeedDataStore, initialData } from '@/stores/useSeedDataStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, FileCheck, FilePlus, Database, Type, Save, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DataSeedingPage = () => {
  const {
    data,
    setData,
    tables,
    fetchAvailableTables,
    availableFiles,
    selectedFile,
    fetchPreAvailableFilesForTable,
    fetchPostAvailableFilesForTable,
    fetchPreData,
    fetchPostData,
    savePreData,
    savePostData,
    addRow,
    addColumn,
    resetSchemaAndDataToDefault,
    isLoading,
    error,
  } = useSeedDataStore();

  const [selectedTable, setSelectedTable] = useState('');
  const [selectedDataType, setSelectedDataType] = useState('pre');
  const [newFileNameInput, setNewFileNameInput] = useState('');

  // Fix missing dependencies in useCallback hooks
  const stableFetchAvailableTables = useCallback(fetchAvailableTables, [fetchAvailableTables]);
  const stableResetSchemaAndDataToDefault = useCallback(resetSchemaAndDataToDefault, [resetSchemaAndDataToDefault]);
  const stableFetchPreAvailableFiles = useCallback(fetchPreAvailableFilesForTable, [fetchPreAvailableFilesForTable]);
  const stableFetchPostAvailableFiles = useCallback(fetchPostAvailableFilesForTable, [fetchPostAvailableFilesForTable]);
  const stableFetchPreData = useCallback(fetchPreData, [fetchPreData]);
  const stableFetchPostData = useCallback(fetchPostData, [fetchPostData]);

  useEffect(() => {
    stableFetchAvailableTables();
  }, [stableFetchAvailableTables]);

  useEffect(() => {
    if (selectedTable && selectedDataType) {
      stableResetSchemaAndDataToDefault();
      setNewFileNameInput(''); // Reset new file name input when table/type changes
      if (selectedDataType === 'pre') {
        stableFetchPreAvailableFiles(selectedTable);
      } else {
        stableFetchPostAvailableFiles(selectedTable);
      }
    } else {
      useSeedDataStore.setState({ availableFiles: [], selectedFile: '', data: initialData });
      setNewFileNameInput('');
    }
  }, [
    selectedTable,
    selectedDataType,
    stableFetchPreAvailableFiles,
    stableFetchPostAvailableFiles,
    stableResetSchemaAndDataToDefault,
  ]);

  useEffect(() => {
    if (selectedTable && selectedDataType && selectedFile) {
      setNewFileNameInput(selectedFile); // Populate input if a file is selected
      if (selectedDataType === 'pre') {
        stableFetchPreData(selectedTable, selectedFile);
      } else {
        stableFetchPostData(selectedTable, selectedFile);
      }
    } else if (selectedTable && selectedDataType && !selectedFile) {
      setData(initialData); // Use imported initialData
    }
  }, [selectedTable, selectedDataType, selectedFile, stableFetchPreData, stableFetchPostData, setData]);

  const handleTableChange = (value) => {
    setSelectedTable(value);
  };

  const handleDataTypeChange = (value) => {
    setSelectedDataType(value);
  };

  const handleFileChange = (fileName) => {
    useSeedDataStore.setState({ selectedFile: fileName });
    setNewFileNameInput(fileName); // Also update the input field
  };

  const handleSaveChanges = async () => {
    if (!selectedTable) {
      alert('Please select a table.');
      return;
    }

    let fileNameToSave = newFileNameInput.trim();

    if (!fileNameToSave) {
      alert('Please enter a filename.');
      return;
    }

    // Sanitize filename (optional, basic example: remove .csv if user adds it)
    fileNameToSave = fileNameToSave.replace(/\.csv$/i, '');
    if (!fileNameToSave) {
      alert('Filename cannot be empty or just ".csv".');
      return;
    }

    const isNewFile = !availableFiles.includes(fileNameToSave);
    if (isNewFile) {
      // Optional: Confirm if user wants to create a new file if the name doesn't exist
      // const confirmNew = window.confirm(`File "${fileNameToSave}.csv" does not exist. Create new?`);
      // if (!confirmNew) return;
    } else if (fileNameToSave !== selectedFile) {
      // Saving to an existing file but with a name different from the one selected in dropdown
      // This implies the user typed an existing name into the input field
      // Optional: Confirm overwrite if it's an existing file different from selectedFile
      // const confirmOverwrite = window.confirm(`Overwrite existing file "${fileNameToSave}.csv"?`);
      // if (!confirmOverwrite) return;
    }

    if (selectedDataType === 'pre') {
      await savePreData(selectedTable, fileNameToSave);
    } else {
      await savePostData(selectedTable, fileNameToSave);
    }
    // After successful save, update selectedFile in store to the saved name
    // and refresh available files. savePreData/savePostData should ideally handle this.
    // If they do, these lines might be redundant or handled within the store actions.
    useSeedDataStore.setState({ selectedFile: fileNameToSave });
    if (isNewFile) {
      // If it was a new file, clear input for next new file.
      // setNewFileNameInput(''); // Or keep it if user might save multiple versions
    }
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
              {/* Breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href='#'>Super Admin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Seeding</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className='flex items-center'>
                <h1 className='text-lg font-semibold md:text-2xl'>Data Seeding Management</h1>
              </div>

              {error && (
                <Alert variant='destructive' className='mb-4'>
                  <Terminal className='h-4 w-4' />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{typeof error === 'object' ? JSON.stringify(error) : error}</AlertDescription>
                </Alert>
              )}

              {/* Enhanced UI for Controls */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle>Data Configuration</CardTitle>
                  <CardDescription>
                    Select a table, data type, and file to begin editing or create a new file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='table-select' className='flex items-center gap-2'>
                        <Database className='h-4 w-4' /> Select Table
                      </Label>
                      <Select onValueChange={handleTableChange} value={selectedTable}>
                        <SelectTrigger id='table-select' className='w-full'>
                          <SelectValue placeholder='Choose a table...' />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.name} value={table.name}>
                              {table.name} (Pre: {table.pre ? '✓' : '✗'}, Post: {table.post ? '✓' : '✗'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='data-type-select' className='flex items-center gap-2'>
                        <Type className='h-4 w-4' /> Seeding Type
                      </Label>
                      <RadioGroup
                        id='data-type-select'
                        value={selectedDataType}
                        onValueChange={handleDataTypeChange}
                        className='flex space-x-4 pt-2'
                      >
                        <div className='flex items-center space-x-2 bg-muted/20 px-4 py-2 rounded-md'>
                          <RadioGroupItem value='pre' id='pre-data' />
                          <Label htmlFor='pre-data' className='font-medium cursor-pointer'>
                            Pre-Seeding
                          </Label>
                        </div>
                        <div className='flex items-center space-x-2 bg-muted/20 px-4 py-2 rounded-md'>
                          <RadioGroupItem value='post' id='post-data' />
                          <Label htmlFor='post-data' className='font-medium cursor-pointer'>
                            Post-Seeding
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='file-select' className='flex items-center gap-2'>
                        <FileCheck className='h-4 w-4' /> Select File
                      </Label>
                      <Select
                        onValueChange={handleFileChange}
                        value={selectedFile}
                        disabled={isLoading || !selectedTable || availableFiles.length === 0}
                      >
                        <SelectTrigger id='file-select' className='w-full'>
                          <SelectValue
                            placeholder={availableFiles.length > 0 ? 'Choose a file...' : 'No files available'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFiles.map((fileName) => (
                            <SelectItem key={fileName} value={fileName}>
                              {fileName}.csv
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableFiles.length > 0 && (
                        <p className='text-xs text-muted-foreground'>
                          {availableFiles.length} {availableFiles.length === 1 ? 'file' : 'files'} available
                        </p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='filename-input' className='flex items-center gap-2'>
                        <FilePlus className='h-4 w-4' /> Save Filename
                      </Label>
                      <div className='flex space-x-2'>
                        <Input
                          id='filename-input'
                          type='text'
                          placeholder='e.g., my_data'
                          value={newFileNameInput}
                          onChange={(e) => setNewFileNameInput(e.target.value)}
                          disabled={isLoading || !selectedTable}
                          className='flex-1'
                        />
                        <span className='flex items-center text-sm text-muted-foreground self-center'>.csv</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Enter filename to save data (without .csv extension)
                      </p>
                    </div>
                  </div>

                  <Separator className='my-4' />

                  <div className='flex flex-wrap items-center gap-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isLoading || !selectedTable}
                            onClick={handleSaveChanges}
                            className='flex items-center gap-2'
                          >
                            <Save className='h-4 w-4' />
                            {isLoading ? 'Saving...' : 'Save Data'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Save to {newFileNameInput.trim() || '...'}.csv</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                          onClick={addRow}
                          disabled={isLoading}
                          className='flex items-center gap-2'
                        >
                          <Plus className='h-4 w-4' /> Row
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>Add a new row to the spreadsheet</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                          onClick={addColumn}
                          disabled={isLoading}
                          className='flex items-center gap-2'
                        >
                          <Plus className='h-4 w-4' /> Column
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>Add a new column to the spreadsheet</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='secondary'
                          onClick={() => {
                            stableResetSchemaAndDataToDefault();
                            setNewFileNameInput('');
                          }}
                          disabled={isLoading}
                          className='flex items-center gap-2'
                        >
                          <RefreshCw className='h-4 w-4' /> Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>Clear the spreadsheet and reset selections</TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>

              {/* The dashboard part with the spreadsheet - unchanged */}
              <div
                className='flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4 min-h-[400px] overflow-y-auto'
                x-chunk='dashboard-02-chunk-1'
              >
                {isLoading && <p>Loading...</p>}
                {!isLoading && !selectedTable && (
                  <div className='text-center text-muted-foreground'>
                    <p className='mb-2'>Please select a table and data type to begin.</p>
                  </div>
                )}
                {!isLoading && selectedTable && (
                  <div className='w-full'>
                    {!selectedFile && availableFiles.length === 0 && (
                      <div className='text-center text-muted-foreground mb-4 p-2 border border-yellow-300 bg-yellow-50 rounded'>
                        <p>
                          No {selectedDataType} data files found for table '{selectedTable}'.
                        </p>
                        <p className='text-sm'>You can start editing the sheet below and save it as a new file.</p>
                      </div>
                    )}
                    {!selectedFile && availableFiles.length > 0 && !newFileNameInput && (
                      <div className='text-center text-muted-foreground mb-4 p-2 border border-blue-300 bg-blue-50 rounded'>
                        <p>
                          Select an existing file from the dropdown or enter a new filename to start editing/saving.
                        </p>
                      </div>
                    )}
                    <div className='mb-4 overflow-x-auto'>
                      <Spreadsheet data={data} onChange={setData} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DataSeedingPage;

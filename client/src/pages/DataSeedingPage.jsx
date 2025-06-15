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
import { useSeedDataStore, defaultSpreadsheetData } from '@/stores/useSeedDataStore'; // Updated import
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Terminal,
  FileCheck,
  FilePlus,
  Database,
  Type,
  Save,
  RefreshCw,
  Plus,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs

const DataSeedingPage = () => {
  const {
    tables, // List of all possible tables
    fetchAvailableTables,
    isLoading,
    error,

    data, // Object: { [tableName: string]: spreadsheetData }
    seedingSetTables, // Array of table names for current context (target + ancestors)
    activeTableForDisplay, // String: tableName of the currently viewed/edited spreadsheet
    availableFiles, // Object: { [tableName: string]: string[] }
    selectedFiles, // Object: { [tableName: string]: string }

    setTableData,
    setActiveTableForDisplay,
    // fetchAvailableFilesForTable, // Used by loadTablesForSeedingSet
    setSelectedFileForTable,
    // fetchTableData, // Used by setSelectedFileForTable

    loadTablesForSeedingSet,
    resetActiveTableToDefault,
    clearCurrentSeedingSet,
    saveTableData,
    seedCurrentSet,

    addRow,
    addColumn,
  } = useSeedDataStore();

  // Component State
  const [selectedTargetTable, setSelectedTargetTable] = useState(''); // The main table selected to initiate a seeding set
  const [selectedDataType, setSelectedDataType] = useState('pre'); // 'pre' or 'post'
  const [newFileNameInputs, setNewFileNameInputs] = useState({}); // Object: { [tableName: string]: string }

  const stableFetchAvailableTables = useCallback(fetchAvailableTables, [fetchAvailableTables]);
  const stableLoadTablesForSeedingSet = useCallback(loadTablesForSeedingSet, [loadTablesForSeedingSet]);
  const stableClearCurrentSeedingSet = useCallback(clearCurrentSeedingSet, [clearCurrentSeedingSet]);

  useEffect(() => {
    stableFetchAvailableTables(); // Fetch all possible tables on component mount
    return () => {
      stableClearCurrentSeedingSet(); // Clear seeding set when component unmounts
    };
  }, [stableFetchAvailableTables, stableClearCurrentSeedingSet]);

  // Effect to load/reload the seeding set when target table or data type changes
  useEffect(() => {
    if (selectedTargetTable && selectedDataType) {
      stableLoadTablesForSeedingSet(selectedTargetTable, selectedDataType);
      setNewFileNameInputs({}); // Reset all filename inputs for the new set
    } else {
      stableClearCurrentSeedingSet(); // Clear if no target table selected
    }
  }, [selectedTargetTable, selectedDataType, stableLoadTablesForSeedingSet, stableClearCurrentSeedingSet]);

  // Update individual filename input when a file is selected for a table in a tab
  useEffect(() => {
    if (activeTableForDisplay && selectedFiles[activeTableForDisplay]) {
      setNewFileNameInputs((prev) => ({
        ...prev,
        [activeTableForDisplay]: selectedFiles[activeTableForDisplay],
      }));
    }
  }, [selectedFiles, activeTableForDisplay]);

  const handleTargetTableChange = (value) => {
    setSelectedTargetTable(value);
    // The useEffect above will handle loading the seeding set
  };

  const handleDataTypeChange = (value) => {
    setSelectedDataType(value);
    // The useEffect above will handle loading the seeding set
  };

  const handleFileNameInputChange = (tableName, value) => {
    setNewFileNameInputs((prev) => ({ ...prev, [tableName]: value }));
  };

  const handleSaveTableData = (tableName) => {
    const fileNameToSave = (newFileNameInputs[tableName] || '').trim();
    if (!fileNameToSave) {
      alert(`Please enter a filename for table ${tableName}.`);
      return;
    }
    saveTableData(tableName, fileNameToSave.replace(/\.csv$/i, ''), selectedDataType);
  };

  const handleSeedCurrentSet = () => {
    if (!selectedTargetTable) {
      alert('Please select a target table first.');
      return;
    }
    seedCurrentSet(selectedTargetTable, selectedDataType);
  };

  const handleResetEntireView = () => {
    setSelectedTargetTable('');
    // setSelectedDataType('pre'); // Optionally reset data type
    stableClearCurrentSeedingSet();
    setNewFileNameInputs({});
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
                  <CardTitle>Seeding Configuration</CardTitle>
                  <CardDescription>
                    Select a target table and data type. Ancestor tables will be loaded for editing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end'>
                    <div className='space-y-2'>
                      <Label htmlFor='target-table-select' className='flex items-center gap-2'>
                        <Database className='h-4 w-4' /> Select Target Table
                      </Label>
                      <Select onValueChange={handleTargetTableChange} value={selectedTargetTable}>
                        <SelectTrigger id='target-table-select' className='w-full'>
                          <SelectValue placeholder='Choose a target table...' />
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
                    <Button
                      variant='destructive'
                      onClick={handleResetEntireView}
                      className='flex items-center gap-2 w-full md:w-auto'
                    >
                      <XCircle className='h-4 w-4' /> Reset View
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isLoading && <p className='text-center my-4'>Loading configuration and data...</p>}

              {!isLoading && selectedTargetTable && seedingSetTables.length > 0 && (
                <Tabs value={activeTableForDisplay} onValueChange={setActiveTableForDisplay} className='w-full'>
                  <TabsList className='grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 h-auto'>
                    {seedingSetTables.map((tableName) => (
                      <TabsTrigger
                        key={tableName}
                        value={tableName}
                        className='truncate px-2 py-1.5 text-xs sm:text-sm'
                      >
                        {tableName}
                        {selectedFiles[tableName] && <FileCheck className='h-3 w-3 ml-1 text-green-500 inline-block' />}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {seedingSetTables.map((currentTabTable) => (
                    <TabsContent key={currentTabTable} value={currentTabTable} className='mt-4'>
                      <Card>
                        <CardHeader>
                          <CardTitle>Editing: {currentTabTable}</CardTitle>
                          <CardDescription>
                            Select or create a file for this table. Changes are per-table.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-end'>
                            <div className='space-y-2'>
                              <Label htmlFor={`file-select-${currentTabTable}`} className='flex items-center gap-2'>
                                <FileCheck className='h-4 w-4' /> Select File for {currentTabTable}
                              </Label>
                              <Select
                                onValueChange={(fileName) =>
                                  setSelectedFileForTable(currentTabTable, fileName, selectedDataType)
                                }
                                value={selectedFiles[currentTabTable] || ''}
                                disabled={
                                  isLoading ||
                                  !(availableFiles[currentTabTable] && availableFiles[currentTabTable].length > 0)
                                }
                              >
                                <SelectTrigger id={`file-select-${currentTabTable}`} className='w-full'>
                                  <SelectValue
                                    placeholder={
                                      availableFiles[currentTabTable] && availableFiles[currentTabTable].length > 0
                                        ? 'Choose a file...'
                                        : 'No files available'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {(availableFiles[currentTabTable] || []).map((fileName) => (
                                    <SelectItem key={fileName} value={fileName}>
                                      {fileName}.csv
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor={`filename-input-${currentTabTable}`} className='flex items-center gap-2'>
                                <FilePlus className='h-4 w-4' /> Save Filename for {currentTabTable}
                              </Label>
                              <div className='flex space-x-2'>
                                <Input
                                  id={`filename-input-${currentTabTable}`}
                                  type='text'
                                  placeholder='e.g., my_data'
                                  value={newFileNameInputs[currentTabTable] || ''}
                                  onChange={(e) => handleFileNameInputChange(currentTabTable, e.target.value)}
                                  disabled={isLoading}
                                  className='flex-1'
                                />
                                <span className='flex items-center text-sm text-muted-foreground self-center'>
                                  .csv
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSaveTableData(currentTabTable)}
                            disabled={isLoading || !newFileNameInputs[currentTabTable]}
                            className='flex items-center gap-2'
                          >
                            <Save className='h-4 w-4' /> Save Data for {currentTabTable}
                          </Button>

                          <Separator />
                          <div className='mb-4 overflow-x-auto min-h-[300px]'>
                            <Spreadsheet
                              data={data[currentTabTable] || defaultSpreadsheetData}
                              onChange={(newData) => setTableData(currentTabTable, newData)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {!isLoading && selectedTargetTable && seedingSetTables.length === 0 && !error && (
                <p className='text-center my-4 text-muted-foreground'>
                  Loading ancestor tables for {selectedTargetTable}...
                </p>
              )}
              {!isLoading && !selectedTargetTable && (
                <div className='text-center text-muted-foreground my-10'>
                  <p className='mb-2 text-lg'>Please select a target table to begin the seeding process.</p>
                  <p className='text-sm'>
                    Ancestor tables will be loaded into tabs for individual file selection and editing.
                  </p>
                </div>
              )}

              {/* Global actions for the active tab or the entire set */}
              {selectedTargetTable && seedingSetTables.length > 0 && (
                <Card className='mt-6'>
                  <CardHeader>
                    <CardTitle>Spreadsheet & Seeding Actions</CardTitle>
                    <CardDescription>
                      Actions for the currently active table (<b>{activeTableForDisplay}</b>) or the entire seeding set.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-wrap items-center gap-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            onClick={addRow}
                            disabled={isLoading || !activeTableForDisplay}
                            className='flex items-center gap-2'
                          >
                            <Plus className='h-4 w-4' /> Row
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Add Row to {activeTableForDisplay}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            onClick={addColumn}
                            disabled={isLoading || !activeTableForDisplay}
                            className='flex items-center gap-2'
                          >
                            <Plus className='h-4 w-4' /> Column
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Add Column to {activeTableForDisplay}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='secondary'
                            onClick={resetActiveTableToDefault}
                            disabled={isLoading || !activeTableForDisplay}
                            className='flex items-center gap-2'
                          >
                            <RefreshCw className='h-4 w-4' /> Reset Active Table
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Reset {activeTableForDisplay} to default schema</TooltipContent>
                      </Tooltip>
                      <Separator orientation='vertical' className='h-8 mx-2' />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSeedCurrentSet}
                            disabled={isLoading}
                            className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white'
                          >
                            <UploadCloud className='h-4 w-4' /> Seed This Set
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>
                          Seed {selectedTargetTable} and its ancestors with selected files
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DataSeedingPage;

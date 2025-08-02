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
import { useSeedDataStore, defaultSpreadsheetData } from '@/stores/useSeedDataStore';
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
  Copy,
  Trash2,
  GitMerge,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DataSeedingPage = () => {
  const {
    tables,
    fetchAvailableTables,
    isLoading,
    error,
    data,
    seedingSetTables,
    activeTableForDisplay,
    availableFiles,
    selectedFiles,
    selectedFileTypes,
    setTableData,
    setActiveTableForDisplay,
    setSelectedFileForTable,
    loadTablesForSeedingSet,
    resetActiveTableToDefault,
    clearCurrentSeedingSet,
    saveTableData,
    seedCurrentSet,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    deleteTableDataFile,
    copyTableDataFile,
  } = useSeedDataStore();

  // Component State
  const [selectedTargetTable, setSelectedTargetTable] = useState('');
  const [newFileNameInputs, setNewFileNameInputs] = useState({});

  const stableFetchAvailableTables = useCallback(fetchAvailableTables, [fetchAvailableTables]);
  const stableLoadTablesForSeedingSet = useCallback(loadTablesForSeedingSet, [loadTablesForSeedingSet]);
  const stableClearCurrentSeedingSet = useCallback(clearCurrentSeedingSet, [clearCurrentSeedingSet]);

  useEffect(() => {
    stableFetchAvailableTables(); // Fetch all possible tables on component mount
    return () => {
      stableClearCurrentSeedingSet(); // Clear seeding set when component unmounts
    };
  }, [stableFetchAvailableTables, stableClearCurrentSeedingSet]);

  // Effect to load/reload the seeding set when target table changes
  useEffect(() => {
    if (selectedTargetTable) {
      stableLoadTablesForSeedingSet(selectedTargetTable);
      setNewFileNameInputs({}); // Reset all filename inputs for the new set
    } else {
      stableClearCurrentSeedingSet(); // Clear if no target table selected
    }
  }, [selectedTargetTable, stableLoadTablesForSeedingSet, stableClearCurrentSeedingSet]);

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

  const handleFileTypeChange = (tableName, fileType) => {
    // When switching data types, we should select the first available file of the new type
    // rather than trying to keep the same filename which may not exist in the other folder
    const filesForType = availableFiles[tableName]?.[fileType] || [];

    if (filesForType.length > 0) {
      // Select the first file of the new type
      setSelectedFileForTable(tableName, filesForType[0].name, fileType);
    } else {
      // No files available for this type, just update the type but clear the file
      setNewFileNameInputs((prev) => ({ ...prev, [tableName]: '' }));

      // Update state in the store but don't try to fetch a file
      // (this will trigger a UI update showing "No files available")
      setSelectedFileForTable(tableName, '', fileType);
    }
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
    const fileType = selectedFileTypes[tableName] || 'pre'; // Default to pre if not set
    saveTableData(tableName, fileNameToSave.replace(/\.csv$/i, ''), fileType);
  };

  const handleCreateCopy = async (tableName) => {
    const originalFileName = selectedFiles[tableName];
    if (!originalFileName) {
      alert('Please select a file to copy first.');
      return;
    }
    const fileType = selectedFileTypes[tableName] || 'pre';
    await copyTableDataFile(tableName, originalFileName, fileType);
  };

  const handleDeleteSelectedFile = async (tableName) => {
    const fileNameToDelete = selectedFiles[tableName];
    if (!fileNameToDelete) {
      alert('No file selected to delete.');
      return;
    }

    const fileType = selectedFileTypes[tableName] || 'pre';

    if (
      confirm(
        `Are you sure you want to delete the ${fileType} file "${fileNameToDelete}.csv" for table "${tableName}"? This action cannot be undone.`
      )
    ) {
      const success = await deleteTableDataFile(tableName, fileNameToDelete, fileType);
      if (success) {
        setNewFileNameInputs((prev) => {
          const updatedInputs = { ...prev };
          if (updatedInputs[tableName] === fileNameToDelete) {
            updatedInputs[tableName] = '';
          }
          return updatedInputs;
        });
      }
    }
  };

  const handleSeedCurrentSet = () => {
    if (!selectedTargetTable) {
      alert('Please select a target table first.');
      return;
    }
    seedCurrentSet(selectedTargetTable);
  };

  const handleResetEntireView = () => {
    setSelectedTargetTable('');
    stableClearCurrentSeedingSet();
    setNewFileNameInputs({});
  };

  const handleToggleMerged = (tableName) => {
    const currentType = selectedFileTypes[tableName];
    const fileName = selectedFiles[tableName];

    if (currentType === 'merged') {
      // Switch back to pre data
      setSelectedFileForTable(tableName, fileName, 'pre');
    } else {
      // Toggle to merged mode - use the same filename but change type to merged
      setSelectedFileForTable(tableName, fileName, 'merged');
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

              {/* Configuration Card */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle>Seeding Configuration</CardTitle>
                  <CardDescription>Select a target table. Ancestor tables will be loaded for editing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 items-end'>
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
                    {seedingSetTables.map((tableName) => {
                      const selectedFileNameForTab = selectedFiles[tableName];
                      const selectedFileType = selectedFileTypes[tableName] || 'pre';
                      const isSelectedFileLive =
                        selectedFileNameForTab &&
                        availableFiles[tableName]?.[selectedFileType]?.find((f) => f.name === selectedFileNameForTab)
                          ?.isLive;

                      return (
                        <TabsTrigger
                          key={tableName}
                          value={tableName}
                          className='truncate px-2 py-1.5 text-xs sm:text-sm data-[state=active]:shadow-md relative'
                        >
                          {tableName}
                          {selectedFileNameForTab && (
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <FileCheck
                                    className={`h-3 w-3 ml-1.5 inline-block ${
                                      isSelectedFileLive ? 'text-green-500' : 'text-muted-foreground'
                                    }`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side='bottom'>
                                  <p>
                                    {isSelectedFileLive
                                      ? `${selectedFileType}/${selectedFileNameForTab}.csv is live in DB.`
                                      : `${selectedFileType}/${selectedFileNameForTab}.csv selected.`}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {seedingSetTables.map((currentTabTable) => (
                    <TabsContent key={currentTabTable} value={currentTabTable} className='mt-4'>
                      <Card>
                        <CardHeader>
                          <CardTitle>Editing: {currentTabTable}</CardTitle>
                          <CardDescription>
                            Select or create a file for this table. Choose between pre and post data.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-end'>
                            <div className='space-y-2'>
                              <Label htmlFor={`file-type-${currentTabTable}`} className='flex items-center gap-2'>
                                <Type className='h-4 w-4' /> Data Type
                              </Label>
                              <RadioGroup
                                id={`file-type-${currentTabTable}`}
                                value={selectedFileTypes[currentTabTable] || 'pre'}
                                onValueChange={(value) => handleFileTypeChange(currentTabTable, value)}
                                className='flex space-x-2'
                              >
                                <div className='flex items-center space-x-2 bg-muted/20 px-3 py-1.5 rounded-md'>
                                  <RadioGroupItem value='pre' id={`pre-${currentTabTable}`} />
                                  <Label htmlFor={`pre-${currentTabTable}`} className='text-sm cursor-pointer'>
                                    Pre
                                  </Label>
                                </div>
                                <div className='flex items-center space-x-2 bg-muted/20 px-3 py-1.5 rounded-md'>
                                  <RadioGroupItem value='post' id={`post-${currentTabTable}`} />
                                  <Label htmlFor={`post-${currentTabTable}`} className='text-sm cursor-pointer'>
                                    Post
                                  </Label>
                                </div>
                                {selectedFileTypes[currentTabTable] === 'merged' && (
                                  <div className='flex items-center space-x-2 bg-amber-100 px-3 py-1.5 rounded-md'>
                                    <RadioGroupItem value='merged' id={`merged-${currentTabTable}`} />
                                    <Label htmlFor={`merged-${currentTabTable}`} className='text-sm cursor-pointer'>
                                      Merged
                                    </Label>
                                  </div>
                                )}
                              </RadioGroup>
                            </div>

                            <div className='space-y-2'>
                              <Label htmlFor={`file-select-${currentTabTable}`} className='flex items-center gap-2'>
                                <FileCheck className='h-4 w-4' /> Select File
                              </Label>
                              <Select
                                onValueChange={(fileName) =>
                                  setSelectedFileForTable(
                                    currentTabTable,
                                    fileName,
                                    selectedFileTypes[currentTabTable] || 'pre'
                                  )
                                }
                                value={selectedFiles[currentTabTable] || ''}
                                disabled={
                                  isLoading ||
                                  !(
                                    availableFiles[currentTabTable]?.[selectedFileTypes[currentTabTable] || 'pre']
                                      ?.length > 0
                                  )
                                }
                              >
                                <SelectTrigger id={`file-select-${currentTabTable}`} className='w-full'>
                                  <SelectValue
                                    placeholder={
                                      availableFiles[currentTabTable]?.[selectedFileTypes[currentTabTable] || 'pre']
                                        ?.length > 0
                                        ? 'Choose a file...'
                                        : 'No files available'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {(
                                    availableFiles[currentTabTable]?.[selectedFileTypes[currentTabTable] || 'pre'] || []
                                  ).map((fileStatus) => (
                                    <SelectItem key={fileStatus.name} value={fileStatus.name}>
                                      <div className='flex items-center justify-between w-full'>
                                        <span>{fileStatus.name}.csv</span>
                                        {fileStatus.isLive && (
                                          <Badge
                                            variant='outline'
                                            className='ml-2 text-green-600 border-green-600 px-1.5 py-0.5 text-xs'
                                          >
                                            Live
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className='space-y-2'>
                              <Label htmlFor={`filename-input-${currentTabTable}`} className='flex items-center gap-2'>
                                <FilePlus className='h-4 w-4' /> Save Filename
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

                          <div className='flex flex-wrap gap-2 items-center'>
                            <Button
                              onClick={() => handleSaveTableData(currentTabTable)}
                              disabled={isLoading || !newFileNameInputs[currentTabTable]}
                              className='flex items-center gap-2'
                            >
                              <Save className='h-4 w-4' /> Save Data
                            </Button>
                            <Button
                              variant='outline'
                              onClick={() => handleCreateCopy(currentTabTable)}
                              disabled={isLoading || !selectedFiles[currentTabTable]}
                              className='flex items-center gap-2'
                            >
                              <Copy className='h-4 w-4' /> Create Copy
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='destructive'
                                    onClick={() => handleDeleteSelectedFile(currentTabTable)}
                                    disabled={isLoading || !selectedFiles[currentTabTable]}
                                    className='flex items-center gap-2'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side='bottom'>
                                  <p>
                                    Delete {selectedFileTypes[currentTabTable] || 'pre'}/
                                    {selectedFiles[currentTabTable]
                                      ? `${selectedFiles[currentTabTable]}.csv`
                                      : 'selected file'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Merge button for combining pre/post data */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={selectedFileTypes[currentTabTable] === 'merged' ? 'default' : 'secondary'}
                                    onClick={() => handleToggleMerged(currentTabTable)}
                                    disabled={
                                      isLoading ||
                                      !selectedFiles[currentTabTable] ||
                                      !availableFiles[currentTabTable]?.pre?.some(
                                        (f) => f.name === selectedFiles[currentTabTable]
                                      ) ||
                                      !availableFiles[currentTabTable]?.post?.some(
                                        (f) => f.name === selectedFiles[currentTabTable]
                                      )
                                    }
                                    className={`flex items-center gap-2 ${
                                      selectedFileTypes[currentTabTable] === 'merged'
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : ''
                                    }`}
                                  >
                                    <GitMerge className='h-4 w-4' />{' '}
                                    {selectedFileTypes[currentTabTable] === 'merged' ? 'Using Merged' : 'Use Merged'}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side='bottom'>
                                  <p>
                                    {selectedFileTypes[currentTabTable] === 'merged'
                                      ? 'Currently using merged data (pre+post)'
                                      : 'Toggle to use merged data from pre and post files'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

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
                            variant='outline'
                            onClick={deleteRow}
                            disabled={isLoading || !activeTableForDisplay}
                            className='flex items-center gap-2'
                          >
                            <Trash2 className='h-4 w-4' /> Delete Row
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Delete Last Row from {activeTableForDisplay}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            onClick={deleteColumn}
                            disabled={isLoading || !activeTableForDisplay}
                            className='flex items-center gap-2'
                          >
                            <Trash2 className='h-4 w-4' /> Delete Column
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Delete Last Column from {activeTableForDisplay}</TooltipContent>
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

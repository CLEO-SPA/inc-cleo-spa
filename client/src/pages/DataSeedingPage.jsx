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
import { useSeedDataStore } from '@/stores/useSeedDataStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const DataSeedingPage = () => {
  const {
    data,
    setData,
    tables,
    fetchAvailableTables,
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
  const [selectedDataType, setSelectedDataType] = useState('pre'); // 'pre' or 'post'

  const stableFetchAvailableTables = useCallback(fetchAvailableTables, [fetchAvailableTables]);
  const stableResetSchemaAndDataToDefault = useCallback(resetSchemaAndDataToDefault, [resetSchemaAndDataToDefault]);
  const stableFetchPreData = useCallback(fetchPreData, [fetchPreData]);
  const stableFetchPostData = useCallback(fetchPostData, [fetchPostData]);

  useEffect(() => {
    stableFetchAvailableTables();
  }, [stableFetchAvailableTables]);

  useEffect(() => {
    if (selectedTable) {
      stableResetSchemaAndDataToDefault();
    }
  }, [selectedTable, selectedDataType, stableResetSchemaAndDataToDefault]);

  useEffect(() => {
    if (selectedTable) {
      if (selectedDataType === 'pre') {
        stableFetchPreData(selectedTable);
      } else {
        stableFetchPostData(selectedTable);
      }
    }
  }, [selectedTable, selectedDataType, stableFetchPreData, stableFetchPostData]);

  useEffect(() => {
    if (selectedTable) {
      resetSchemaAndDataToDefault(); // Resets to original default
    }
  }, [selectedTable, selectedDataType, resetSchemaAndDataToDefault]);

  const handleLoadData = () => {
    if (!selectedTable) {
      alert('Please select a table.');
      return;
    }
    if (selectedDataType === 'pre') {
      fetchPreData(selectedTable);
    } else {
      fetchPostData(selectedTable);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedTable) {
      alert('Please select a table to save data for.');
      return;
    }
    if (selectedDataType === 'pre') {
      await savePreData(selectedTable);
    } else {
      await savePostData(selectedTable);
    }
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    // Potentially auto-load or require a "Load" button click
    // For now, let's require a "Load" click
  };

  const handleDataTypeChange = (value) => {
    setSelectedDataType(value);
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
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

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end'>
                <div>
                  <Label htmlFor='table-select'>Select Table</Label>
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
                <div>
                  <Label htmlFor='data-type-select'>Data Type</Label>
                  <RadioGroup
                    id='data-type-select'
                    value={selectedDataType}
                    onValueChange={handleDataTypeChange}
                    className='flex space-x-2 mt-2'
                  >
                    <div className='flex items-center space-x-1'>
                      <RadioGroupItem value='pre' id='pre-data' />
                      <Label htmlFor='pre-data'>Pre-Seeding</Label>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <RadioGroupItem value='post' id='post-data' />
                      <Label htmlFor='post-data'>Post-Seeding</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button onClick={handleLoadData} disabled={isLoading || !selectedTable} className='w-full md:w-auto'>
                  {isLoading && selectedTable ? 'Loading...' : 'Load Data'}
                </Button>
              </div>

              <div
                className='flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4 min-h-[400px] overflow-y-auto'
                x-chunk='dashboard-02-chunk-1'
              >
                {isLoading && !data.length ? (
                  <p>Loading initial data structure...</p>
                ) : !selectedTable ? (
                  <div className='text-center text-muted-foreground'>
                    <p className='mb-2'>Please select a table and data type, then click "Load Data".</p>
                    <p className='text-sm'>This tool allows editing and seeding data for system tables.</p>
                  </div>
                ) : (
                  <div className='w-full'>
                    <div className='mb-4 overflow-x-auto'>
                      {' '}
                      {/* This handles horizontal scroll for the spreadsheet itself */}
                      <Spreadsheet data={data} onChange={setData} />
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button onClick={addRow} disabled={isLoading}>
                        Add Row
                      </Button>
                      <Button onClick={addColumn} disabled={isLoading}>
                        {' '}
                        Add Column{' '}
                      </Button>{' '}
                      <Button onClick={resetSchemaAndDataToDefault} disabled={isLoading} variant='outline'>
                        Reset to Default Schema
                      </Button>
                      <Button onClick={handleSaveChanges} variant='default' disabled={isLoading || !selectedTable}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
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

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit,
  Database,
  RefreshCw,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useDatabaseReportStore } from '@/stores/useDatabaseReportStore';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';

const DynamicDatabaseChangesReport = () => {
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [allOperationsData, setAllOperationsData] = useState({
    create: null,
    update: null,
    delete: null,
  });
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const {
    isLoading,
    error,
    carePackageData,
    fetchCarePackageCreationEmulationData,
    fetchCarePackageUpdateEmulationData,
    fetchCarePackageDeleteEmulationData,
    packages,
  } = useDatabaseReportStore();

  // auto-load on component mount, then manual refresh only
  useEffect(() => {
    const initialLoad = async () => {
      console.log('Component mounted, performing initial load...');
      await fetchAllOperations(true); // true indicates initial load
    };

    initialLoad();
  }, [fetchCarePackageCreationEmulationData, fetchCarePackageUpdateEmulationData, fetchCarePackageDeleteEmulationData]);

  const fetchAllOperations = async (isInitialLoad = false) => {
    if (!isInitialLoad) {
      setIsManualLoading(true);
      console.log('Manual refresh triggered, fetching all operations data...');
    } else {
      console.log('Initial load triggered, fetching all operations data...');
    }

    // reset data
    setAllOperationsData({
      create: null,
      update: null,
      delete: null,
    });

    // fetch operations sequentially to avoid conflicts
    try {
      const createData = await fetchCarePackageCreationEmulationData();
      setAllOperationsData((prev) => ({ ...prev, create: createData }));
    } catch (error) {
      console.error('CREATE operation failed:', error);
      setAllOperationsData((prev) => ({ ...prev, create: null }));
    }

    try {
      const updateData = await fetchCarePackageUpdateEmulationData();
      setAllOperationsData((prev) => ({ ...prev, update: updateData }));
    } catch (error) {
      console.error('UPDATE operation failed:', error);
      setAllOperationsData((prev) => ({ ...prev, update: null }));
    }

    try {
      const deleteData = await fetchCarePackageDeleteEmulationData();
      setAllOperationsData((prev) => ({ ...prev, delete: deleteData }));
    } catch (error) {
      console.error('DELETE operation failed:', error);
      // expected to fail if no package exists to delete
      setAllOperationsData((prev) => ({ ...prev, delete: null }));
    }

    if (!isInitialLoad) {
      setIsManualLoading(false);
    }
    setHasInitialLoad(true);
  };

  const transformOperationData = (apiData, operationType) => {
    if (!apiData) {
      return {
        operation: operationType,
        timestamp: new Date().toISOString(),
        changes: [],
        status: 'no_data',
      };
    }

    // handle the case where apiData is an array of records
    if (Array.isArray(apiData)) {
      const changes = [];
      const timestamp = new Date().toISOString();

      if (apiData.length > 0) {
        changes.push({
          tableName: 'packages',
          changeType: operationType === 'create' ? 'insert' : operationType,
          records: apiData,
        });
      }

      return {
        operation: operationType,
        timestamp,
        changes,
        status: 'success',
      };
    }

    // expected format {old: {...}, new: {...}}
    if (!apiData.old || !apiData.new) {
      if (packages && packages.length > 0) {
        console.log(`Using packages data instead for ${operationType}...`);
        const changes = [
          {
            tableName: 'packages',
            changeType: operationType === 'create' ? 'insert' : operationType,
            records: packages,
          },
        ];

        return {
          operation: operationType,
          timestamp: new Date().toISOString(),
          changes,
          status: 'success',
        };
      }

      return null;
    }

    const changes = [];
    const timestamp = new Date().toISOString();

    // get all table names from both old and new data
    const allTables = new Set([...Object.keys(apiData.old || {}), ...Object.keys(apiData.new || {})]);
    allTables.forEach((tableName) => {
      const oldRecords = apiData.old[tableName] || [];
      const newRecords = apiData.new[tableName] || [];
      console.log(`Table ${tableName} (${operationType}): ${oldRecords.length} old, ${newRecords.length} new`);

      // based on operation type, determine the change type
      let changeType = operationType;
      let records = [];

      switch (operationType) {
        case 'create':
          changeType = 'insert';
          records = newRecords;
          break;
        case 'update':
          changeType = 'update';

          // find updated records
          newRecords.forEach((newRecord) => {
            const oldRecord = oldRecords.find((old) => old.id === newRecord.id);
            if (oldRecord) {
              const updatedRecord = { id: newRecord.id };
              let hasChanges = false;

              const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);
              allKeys.forEach((key) => {
                if (key === 'id') {
                  updatedRecord[key] = newRecord[key];
                } else if (oldRecord[key] !== newRecord[key]) {
                  updatedRecord[key] = {
                    old: oldRecord[key],
                    new: newRecord[key],
                  };
                  hasChanges = true;
                } else {
                  updatedRecord[key] = newRecord[key];
                }
              });

              if (hasChanges) {
                records.push(updatedRecord);
              }
            }
          });
          break;
        case 'delete':
          changeType = 'delete';
          records = oldRecords.filter((oldRecord) => !newRecords.some((newRecord) => newRecord.id === oldRecord.id));
          break;
      }

      if (records.length > 0) {
        changes.push({
          tableName,
          changeType,
          records,
        });
      }
    });

    console.log(`Final changes for ${operationType}:`, changes);

    return {
      operation: operationType,
      timestamp,
      changes,
      status: 'success',
    };
  };

  // transform all operations data
  const createData = transformOperationData(allOperationsData.create || carePackageData, 'create');
  const updateData = transformOperationData(allOperationsData.update, 'update');
  const deleteData = transformOperationData(allOperationsData.delete, 'delete');

  // combine all operations into a single data structure
  const combinedData = {
    title: 'Database Changes Report',
    subtitle: 'CREATE | UPDATE | DELETE Operations',
    timestamp: new Date().toISOString(),
    operations: [createData, updateData, deleteData].filter(Boolean),
    changes: [...(createData?.changes || []), ...(updateData?.changes || []), ...(deleteData?.changes || [])],
    operationStatus: {
      create: createData?.status || 'no_data',
      update: updateData?.status || 'no_data',
      delete: deleteData?.status || 'no_data',
    },
  };

  const toggleTable = (tableName) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'insert':
        return <Plus className='w-4 h-4' />;
      case 'update':
        return <Edit className='w-4 h-4' />;
      case 'delete':
        return <Minus className='w-4 h-4' />;
      default:
        return <Database className='w-4 h-4' />;
    }
  };

  const renderValue = (value) => {
    if (value && typeof value === 'object' && value.hasOwnProperty('old') && value.hasOwnProperty('new')) {
      return (
        <div className='space-y-1'>
          <div>
            <span className='text-sm text-gray-600'>Old: </span>
            <span className='line-through text-gray-500'>{renderSingleValue(value.old)}</span>
          </div>
          <div>
            <span className='text-sm text-gray-600'>New: </span>
            <span className='font-medium'>{renderSingleValue(value.new)}</span>
          </div>
        </div>
      );
    }

    return renderSingleValue(value);
  };

  const renderSingleValue = (value) => {
    if (value === null || value === undefined) {
      return <span className='text-gray-400 italic'>null</span>;
    }
    if (typeof value === 'boolean') {
      return <span>{value ? 'true' : 'false'}</span>;
    }
    if (typeof value === 'number') {
      return <span>{value.toLocaleString()}</span>;
    }
    if (typeof value === 'string' && (value.includes('T') || value.includes('+') || value.includes(':'))) {
      return <span className='text-gray-600'>{value}</span>;
    }
    if (Array.isArray(value)) {
      return <span>[{value.length} items]</span>;
    }
    if (typeof value === 'object') {
      return <span>{JSON.stringify(value)}</span>;
    }
    return <span>{String(value)}</span>;
  };

  const isFieldUpdated = (value) => {
    return value && typeof value === 'object' && value.hasOwnProperty('old') && value.hasOwnProperty('new');
  };

  const renderTable = (change) => {
    if (!change.records || change.records.length === 0) {
      return <div className='text-gray-500 italic p-8 text-center border rounded'>No records to display</div>;
    }

    const allColumns = [...new Set(change.records.flatMap((record) => Object.keys(record)))];

    return (
      <div className='border rounded overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              {allColumns.map((column) => (
                <TableHead
                  key={column}
                  className='font-medium text-black border-r border-gray-300 last:border-r-0 px-4 py-3 text-left'
                >
                  {column.replace(/_/g, ' ').toUpperCase()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {change.records.map((record, index) => (
              <TableRow key={index} className='border-b border-gray-200 last:border-b-0'>
                {allColumns.map((column) => {
                  const isUpdated = isFieldUpdated(record[column]);
                  return (
                    <TableCell
                      key={column}
                      className={`border-r border-gray-200 last:border-r-0 px-4 py-3 ${isUpdated ? 'bg-gray-50' : ''}`}
                    >
                      {renderValue(record[column])}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const getTotalChanges = () => {
    if (!combinedData?.changes) return 0;
    return combinedData.changes.reduce((total, change) => total + change.records.length, 0);
  };

  const downloadPDF = () => {
    // create a new window for printing
    const printWindow = window.open('', '_blank');

    // generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Changes Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
          .header { border-bottom: 2px solid #000; padding: 20px 0; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 16px; color: #666; }
          .stats { display: flex; gap: 20px; margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
          .stat { text-align: center; }
          .stat-number { font-size: 18px; font-weight: bold; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .change-section { margin: 20px 0; border: 1px solid #ccc; }
          .change-header { padding: 15px; background: #f5f5f5; border-bottom: 1px solid #ccc; }
          .change-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .change-type { display: inline-block; padding: 5px 10px; background: #e0e0e0; border-radius: 3px; font-size: 12px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 15px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          .updated-field { background: #f9f9f9; }
          .old-value { text-decoration: line-through; color: #999; }
          .new-value { font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${combinedData.title}</div>
          <div class="subtitle">${combinedData.subtitle}</div>
          <div style="margin-top: 10px; font-size: 14px; color: #666;">
            Generated: ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="stats">
          ${['insert', 'update', 'delete']
            .map((type) => {
              const typeChanges = combinedData.changes.filter((c) => c.changeType === type);
              const recordCount = typeChanges.reduce((sum, c) => sum + c.records.length, 0);
              return `
              <div class="stat">
                <div class="stat-number">${recordCount}</div>
                <div class="stat-label">${type}s</div>
              </div>
            `;
            })
            .join('')}
          <div class="stat">
            <div class="stat-number">${new Set(combinedData.changes.map((c) => c.tableName)).size}</div>
            <div class="stat-label">Tables Affected</div>
          </div>
        </div>
        
        ${combinedData.changes
          .map(
            (change, index) => `
          <div class="change-section">
            <div class="change-header">
              <div class="change-title">${change.tableName}</div>
              <span class="change-type">${change.changeType}</span>
              <span style="margin-left: 10px; font-size: 14px; color: #666;">
                ${change.records.length} record${change.records.length !== 1 ? 's' : ''}
              </span>
            </div>
            ${
              change.records.length > 0
                ? `
              <table>
                <thead>
                  <tr>
                    ${[...new Set(change.records.flatMap((record) => Object.keys(record)))]
                      .map((column) => `<th>${column.replace(/_/g, ' ').toUpperCase()}</th>`)
                      .join('')}
                  </tr>
                </thead>
                <tbody>
                  ${change.records
                    .map(
                      (record) => `
                    <tr>
                      ${[...new Set(change.records.flatMap((record) => Object.keys(record)))]
                        .map((column) => {
                          const value = record[column];
                          const isUpdated =
                            value &&
                            typeof value === 'object' &&
                            value.hasOwnProperty('old') &&
                            value.hasOwnProperty('new');

                          if (isUpdated) {
                            return `
                            <td class="updated-field">
                              <div>Old: <span class="old-value">${value.old || 'null'}</span></div>
                              <div>New: <span class="new-value">${value.new || 'null'}</span></div>
                            </td>
                          `;
                          }

                          return `<td>${value !== null && value !== undefined ? value : 'null'}</td>`;
                        })
                        .join('')}
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            `
                : '<div style="padding: 20px; text-align: center; color: #666;">No records</div>'
            }
          </div>
        `
          )
          .join('')}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const renderMainContent = () => {
    // show loading during initial load or manual refresh
    if ((isLoading && !hasInitialLoad) || isManualLoading) {
      return (
        <LoadingState />
      );
    }

    // show error only if there is an issue when loading
    if (error) {
      return (
        <ErrorState />
      );
    }

    // show no data state if no changes found
    if (!combinedData || !combinedData.changes || combinedData.changes.length === 0) {
      return (
        <div className='max-w-full mx-auto p-6 bg-white min-h-screen'>
          <div className='bg-white border border-gray-300 p-8'>
            <div className='text-center'>
              <Database className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <h2 className='text-xl font-medium mb-2'>No Database Changes</h2>
              <p className='mb-6 text-gray-600'>No changes detected in any database operations.</p>
              <button
                onClick={() => fetchAllOperations()}
                disabled={isManualLoading}
                className='px-6 py-3 bg-black text-white border border-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <RefreshCw className={`w-5 h-5 inline mr-2 ${isManualLoading ? 'animate-spin' : ''}`} />
                {isManualLoading ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='w-full h-full overflow-hidden'>
        <div className='w-full max-w-none mx-auto p-6 bg-white min-h-screen overflow-x-hidden'>
          <div className='bg-white border border-gray-300 w-full max-w-full'>
            {/* header */}
            <div className='px-8 py-6 border-b-2 border-gray-300 bg-white'>
              <div className='flex items-center justify-between'>
                <div className='flex-1 min-w-0 mr-4'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <Database className='w-6 h-6 flex-shrink-0' />
                    <h1 className='text-xl font-medium truncate'>{combinedData.title}</h1>
                  </div>
                  {combinedData.subtitle && <p className='text-gray-600 truncate'>{combinedData.subtitle}</p>}
                </div>
                <div className='text-right flex-shrink-0'>
                  <div className='text-sm text-gray-600 mb-2'>
                    Generated: {new Date(combinedData.timestamp).toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600 mb-3'>Total Changes: {getTotalChanges()}</div>

                  {/* action buttons */}
                  <div className='flex space-x-2'>
                    <button
                      onClick={fetchAllOperations}
                      disabled={isManualLoading}
                      className='px-4 py-2 bg-black text-white border border-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <RefreshCw className={`w-4 h-4 inline mr-2 ${isManualLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>

                    <button
                      onClick={downloadPDF}
                      className='px-4 py-2 bg-white text-black border rounded-md border-gray-300 hover:bg-gray-50'
                    >
                      <Download className='w-4 h-4 inline mr-2' />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* statistics */}
            <div className='px-8 py-4 bg-gray-50 border-b border-gray-200'>
              <div className='grid grid-cols-4 gap-4'>
                {['insert', 'update', 'delete'].map((type) => {
                  const typeChanges = combinedData.changes.filter((c) => c.changeType === type);
                  const recordCount = typeChanges.reduce((sum, c) => sum + c.records.length, 0);

                  return (
                    <div key={type} className='text-center'>
                      <div className='text-lg font-medium'>{recordCount}</div>
                      <div className='text-xs text-gray-600 uppercase'>{type}s</div>
                    </div>
                  );
                })}
                <div className='text-center'>
                  <div className='text-lg font-medium'>{new Set(combinedData.changes.map((c) => c.tableName)).size}</div>
                  <div className='text-xs text-gray-600 uppercase'>Tables Affected</div>
                </div>
              </div>
            </div>

            {/* changes list */}
            <div className='divide-y divide-gray-200'>
              {combinedData.changes.map((change, index) => {
                const isExpanded = expandedTables.has(change.tableName + index);

                return (
                  <div key={`${change.tableName}-${index}`} className='border-l-4 border-gray-400'>
                    <div
                      className='px-8 py-6 cursor-pointer bg-white hover:bg-gray-50'
                      onClick={() => toggleTable(change.tableName + index)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-4 flex-1 min-w-0'>
                          {getChangeIcon(change.changeType)}
                          <div className='min-w-0 flex-1'>
                            <h2 className='text-lg font-medium truncate'>{change.tableName}</h2>
                            <div className='flex items-center space-x-3 mt-1'>
                              <span className='px-3 py-1 text-xs border border-gray-300 bg-gray-100 uppercase whitespace-nowrap'>
                                {change.changeType}
                              </span>
                              <span className='text-sm text-gray-600 whitespace-nowrap'>
                                {change.records.length} record{change.records.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='flex-shrink-0 ml-4'>
                          {isExpanded ? (
                            <ChevronDown className='w-5 h-5 text-gray-500' />
                          ) : (
                            <ChevronRight className='w-5 h-5 text-gray-500' />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='border-t border-gray-100'>
                        <div className='px-8 pb-8 pt-4'>
                          <div className='overflow-x-auto'>
                            {renderTable(change)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1 overflow-hidden'>
          <AppSidebar />
          <SidebarInset className='flex-1 overflow-hidden'>
            {renderMainContent()}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DynamicDatabaseChangesReport;

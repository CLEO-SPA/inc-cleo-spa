import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription
} from '@/components/ui/exportDataCard';
import { api } from "@/interceptors/axios";
import Navbar from '@/components/Navbar';

// Helper function to determine column type
const getColumnType = (value) => {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) return 'number';
  if (typeof value === 'string' && !isNaN(Date.parse(value))) {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.includes('-')) { // Ensures proper date format like "YYYY-MM-DD"
      return 'datetime';
    }
  }
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
};

const extractColumns = (data) => {
  console.log(data);

  if (!data) return [];

  // Handle array of objects (most APIs)
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    
    // Take the first object as sample and extract its properties
    const sampleObject = data[0];
    return Object.entries(sampleObject).map(([key, value]) => ({
      name: key,
      type: getColumnType(value),
      nullable: value === null,
      section: 'Main'
    }));
  }
  
  console.log("Array checked");

  // Handle member details object (with nested arrays)
  if (typeof data === 'object') {
    const columns = [];
    
    // Process main level properties (excluding transactions and invoices arrays)
    Object.entries(data).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        columns.push({
          name: key,
          type: getColumnType(value),
          nullable: value === null,
          section: 'Main'
        });
      }
    });

    console.log("Checked Object");

    // Process transactions if they exist
    if (data.transactions && data.transactions.length > 0) {
      const transactionColumns = Object.entries(data.transactions[0]).map(([key, value]) => ({
        name: key,
        type: getColumnType(value),
        nullable: value === null,
        section: 'Transactions'
      }));
      columns.push(...transactionColumns);
    }

    console.log("Checked transaction");

    // Process invoices if they exist
    if (data.invoices && data.invoices.length > 0) {
      const invoiceColumns = Object.entries(data.invoices[0]).map(([key, value]) => ({
        name: key,
        type: getColumnType(value),
        nullable: value === null,
        section: 'Invoices'
      }));
      columns.push(...invoiceColumns);
    }

    return columns;
  }

  return [];
};

// Helper function to determine column badge color based on type
const getColumnBadgeColor = (column) => {
  switch (column.type) {
    case 'number':
      return 'bg-green-50 border-green-200';
    case 'datetime':
      return 'bg-yellow-50 border-yellow-200';
    case 'boolean':
      return 'bg-orange-50 border-orange-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const convertToJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

const convertToCSV = (data, columns) => {
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""'); // Escape double quotes
    return `"${str}"`; // Ensure proper CSV formatting
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => 
      current ? current[key] : '', obj);
  };

  const sections = [...new Set(columns.map(col => col.section))];
  const mainColumns = columns.filter(col => col.section === 'Main');
  
  if (Array.isArray(data)) {
    // Handle the flat data such as plain objects
    const headers = columns.map(col => col.name).join(',');
    const rows = data.map(row => 
      columns.map(col => escapeCSVValue(row[col.name])).join(',')
    );
    return [headers, ...rows].join('\n');
  } else {
    // Handle nested data such as member details with transactions and invoices
    let csvRows = [];
    
    const mainHeaders = mainColumns.map(col => col.name);
    
    // Add nested data headers for each section
    sections.forEach(section => {
      if (section !== 'Main') {
        const sectionColumns = columns.filter(col => col.section === section);
        const sectionData = data[section.toLowerCase()];
        if (sectionData && sectionData.length > 0) {
          sectionColumns.forEach(col => {
            mainHeaders.push(`${section}_${col.name}`);
          });
        }
      }
    });
    
    csvRows.push(mainHeaders.join(','));

    // Create rows by combining main data with the nested data
    const mainData = mainColumns.map(col => escapeCSVValue(data[col.name]));
    
    const nestedArrays = sections
      .filter(section => section !== 'Main')
      .map(section => {
        const sectionData = data[section.toLowerCase()];
        return sectionData || [];
      });
    
    const maxNestedLength = Math.max(...nestedArrays.map(arr => arr.length));
    
    if (maxNestedLength === 0) {
      // If there's no nested data, output just the main data
      csvRows.push(mainData.join(','));
    } else {

      for (let i = 0; i < maxNestedLength; i++) {
        let row = [...mainData];
        
        sections.forEach(section => {
          if (section !== 'Main') {
            const sectionColumns = columns.filter(col => col.section === section);
            const sectionData = data[section.toLowerCase()];
            
            sectionColumns.forEach(col => {
              const value = sectionData && sectionData[i] 
                ? escapeCSVValue(sectionData[i][col.name]) 
                : '""';
              row.push(value);
            });
          }
        });
        
        csvRows.push(row.join(','));
      }
    }
    
    return csvRows.join('\n');
  }
};

const ExportData = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [memberStatsSelected, setMemberStatsSelected] = useState(false);
  const [columns, setColumns] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [member, setMember] = useState([]);
  const [error, setError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedTable && selectedTable !== "md") {
      setMemberStatsSelected(false);
      fetchListOfData(selectedTable);
    } else if(selectedTable === "md"){
      setColumns([]);
      setSelectedMember('');
      setMemberStatsSelected(true);
    }
  }, [selectedTable]);

  useEffect(() => {
    if(selectedMember){
      fetchSelectedMemberTransaction(selectedMember);
    } else {
      setColumns([]);
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/ed/mid`);
      setMember(response.data.data);
    } catch (error) {
      setError(`Failed to get members`);
      console.error(`Error fetching data:`, error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const fetchSelectedMemberTransaction = async (member) => {
    setIsLoadingColumns(true);
    try {
      const response = await api.get(`/ed/md/${member}`);
      const extractedColumns = extractColumns(response.data);
      setColumns(extractedColumns);
      setTables(response.data);
    } catch (error) {
      setError(`Failed to get member data`);
      console.error(`Error fetching data: `, error);
      setColumns([]);
    } finally {
      setIsLoadingColumns(false);
    }
  }

  const fetchListOfData = async (tablelink) => {
    setIsLoadingColumns(true);
    try {
      const response = await api.get(`/ed/${tablelink}`);
      console.log(response.data);
      const extractedColumns = extractColumns(response.data.data);
      setColumns(extractedColumns);
      setTables(response.data);
    } catch (error) {
      setError(`Failed to get data`);
      console.error(`Error fetching data: `, error);
      setColumns([]);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleExport = () => {
    if (!selectedTable || !exportFormat || !tables) return;
    
    setIsExporting(true);
    setError('');
    setExportSuccess(false);

    try {
      let content;
      const data = memberStatsSelected ? tables : tables.data;
      
      switch (exportFormat) {
        case 'json':
          content = convertToJSON(data);
          break;
        case 'csv':
          content = convertToCSV(data, columns);
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      // Create and trigger download for the file
      const blob = new Blob([content], { 
        type: exportFormat === 'json' 
          ? 'application/json' 
          : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `export_${selectedTable}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      setError('Failed to export data. Please try again.');
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Updated format options removing Excel
  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' }
  ];

  return (
    <div>
      <Navbar />
      <Card className="w-full m-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {exportSuccess && (
            <Alert>
              <AlertDescription>Export completed successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="table-select">
                Select Table
              </label>
              <select
                id="table-select"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an data to export</option>
                <option value="m">All member and their details</option>
                <option value="md">Member statistics</option>
                <option value="tl">Transaction logs</option>
                <option value="il">Invoice logs</option>
              </select>
            </div>

            {memberStatsSelected && (
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="member-select">
                  Choose a Member
                </label>
                <select
                  id="member-select"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a member</option>
                  {member.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.member_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTable && (
              <div>
                <h3 className="text-sm font-medium mb-2">Table Columns</h3>
                {isLoadingColumns ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                ) : columns.length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded-md border">
                    <div className="grid gap-2">
                      {columns.map((column, index) => (
                        <div 
                          key={index} 
                          className={`text-sm p-2 rounded border ${getColumnBadgeColor(column)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{column.name}</span>
                            <span className="text-xs">{column.type}</span>
                          </div>
                          <div className="text-xs mt-1">
                            {column.nullable && <span>Optional</span>}
                            {column.section !== 'Main' && (
                              <span className="ml-2">{column.section}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No columns found for this table</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="format-select">
                Export Format
              </label>
              <select
                id="format-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {formatOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              data-testid="export-data-button"
              onClick={handleExport}
              disabled={!selectedTable || !exportFormat || isExporting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                       disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isExporting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Exporting...
                </span>
              ) : (
                'Export Data'
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
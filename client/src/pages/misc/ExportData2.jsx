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
import Navbar from '@/components/Navbar';
import { exportService } from './exportDataApi';

// Helper function to determine column type
const getColumnType = (value) => {
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) return 'number';
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        const date = new Date(value);
        if (!isNaN(date.getTime()) && value.includes('-')) {
            return 'datetime';
        }
    }
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
};

const extractColumns = (data) => {
    if (!data || !Array.isArray(data)) return [];
    if (data.length === 0) return [];

    const sampleObject = data[0];
    return Object.entries(sampleObject).map(([key, value]) => ({
        name: key,
        type: getColumnType(value),
        nullable: value === null,
        section: 'Main'
    }));
}; 

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
    if (!Array.isArray(data) || data.length === 0) return '';

    const escapeCSVValue = (value) => {
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
    };

    const headers = columns.map(col => col.name).join(',');
    const rows = data.map(row =>
        columns.map(col => escapeCSVValue(row[col.name])).join(',')
    );

    return [headers, ...rows].join('\n');
};

const ExportDataContinuation = () => {
    const [selectedDataType, setSelectedDataType] = useState('');
    const [columns, setColumns] = useState([]);
    const [exportFormat, setExportFormat] = useState('json');
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [exportSuccess, setExportSuccess] = useState(false);
    const [data, setData] = useState(null);

    const dataTypes = [
        { value: 'employees', label: 'Employees', endpoint: 'employees' },
        { value: 'services', label: 'Services', endpoint: 'services' },
        { value: 'products', label: 'Products', endpoint: 'products' }
    ];

    useEffect(() => {
        if (selectedDataType) {
            fetchData(selectedDataType);
        }
    }, [selectedDataType]);

    const fetchData = async (type) => {
        setIsLoading(true);
        setError('');
        try {
            let response;
            switch (type) {
                case 'employees':
                    response = await exportService.exportEmployees();
                    break;
                case 'services':
                    response = await exportService.exportServices();
                    break;
                case 'products':
                    response = await exportService.exportProducts();
                    break;
                default:
                    throw new Error('Invalid data type');
            }

            const extractedColumns = extractColumns(response.data || response);
            setColumns(extractedColumns);
            setData(response.data || response);
        } catch (error) {
            setError(`Failed to fetch ${type}: ${error.message}`);
            console.error(`Error fetching ${type}:`, error);
            setColumns([]);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (!selectedDataType || !exportFormat || !data) return;

        setIsExporting(true);
        setError('');
        setExportSuccess(false);

        try {
            let content;
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

            const blob = new Blob([content], {
                type: exportFormat === 'json' ? 'application/json' : 'text/csv'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export_${selectedDataType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;

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
                            <label className="block text-sm font-medium mb-2" htmlFor="data-type-select">
                                Select Data Type
                            </label>
                            <select
                                id="data-type-select"
                                value={selectedDataType}
                                onChange={(e) => setSelectedDataType(e.target.value)}
                                className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select data type to export</option>
                                {dataTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedDataType && (
                            <div>
                                <h3 className="text-sm font-medium mb-2">Available Fields</h3>
                                {isLoading ? (
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
                                                    {column.nullable && (
                                                        <div className="text-xs mt-1">Optional</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No fields available</p>
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
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                            </select>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={!selectedDataType || !exportFormat || isExporting || !data}
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

export default ExportDataContinuation;
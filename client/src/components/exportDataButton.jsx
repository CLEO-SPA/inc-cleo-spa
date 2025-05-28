import useDataExportStore from "@/stores/useDataExportStore";
import * as XLSX from "xlsx";
import { Loader2 } from 'lucide-react';

// Assuming that the data is like this: 
/* const data: [
    {
        member_name: value,
        contact: value,
        email: value,
        days_since_use: value,
    }, 
 ...
] 
 */

const convertToExcel = (data, selectedTable) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(worksheet, workbook, selectedTable);

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return wbout;
}

const convertToJSON = (data) => {
    return JSON.stringify(data, null, 2);
};

const convertToCSV = (data, columns) => {
    let csv = '';

    csv = columns.join(',') + '\n';

    data.forEach((object) => {
        const row = columns.map(col => {
            const value = String(object[col] || '');
            return value.includes(',') ? `"${value}"` : value;
        }).join(',');
        csv += row + '\n';
    });
    
    return csv;
};

const ExportDataButton = () => {

    const {
        loading,
        selectedTable,
        timeInput,
        exportFormat,
        columns,

        setErrorMessage,
        setLoading,
        getDataToExport
    } = useDataExportStore();

    const handleExport = async () => {
        if (!selectedTable || !exportFormat) return;

        if (selectedTable === 'unused-member-voucher' || selectedTable === 'unused-member-care-package') {
            if (!timeInput) return;
        }

        try {
            setLoading(true);
            await getDataToExport();

            let content;
            let fileType;

            const { dataExportList } = useDataExportStore.getState();
            const data = dataExportList;

            switch (exportFormat) {
                case "json":
                    content = convertToJSON(data);
                    fileType = "application/json";
                    break;
                case "csv":
                    content = convertToCSV(data, columns);
                    fileType = "text/csv";
                    break;
                case "excel":
                    content = convertToExcel(data, selectedTable);
                    fileType = "application/octet-stream";
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            // Create and trigger download for the file
            const blob = new Blob([content], {
                type: fileType
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
        } catch (error) {
            setErrorMessage('Failed to export data. Please try again.');
            setLoading(false);
            console.error('Error exporting data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            data-testid="export-data-button"
            onClick={handleExport}
            disabled={!selectedTable || !exportFormat || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                               disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {loading ? (
                <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Exporting...
                </span>
            ) : (
                'Export Data'
            )}
        </button>
    )
};

export default ExportDataButton;
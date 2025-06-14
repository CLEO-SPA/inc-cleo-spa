import useDataExportStore from "@/stores/DataExport/useDataExportStore";
import * as XLSX from "xlsx";
import { Loader2 } from 'lucide-react';
import { handleApiError } from "@/utils/errorHandlingUtils";
import { validateForm } from "@/utils/validationUtils";
import useAuth from '@/hooks/useAuth';


const convertToExcel = (data, selectedTable) => {
    const worksheet = XLSX.utils.json_to_sheet(data.dataToExportList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable ? selectedTable : "");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return wbout;
}

const convertToJSON = (data) => {
    return JSON.stringify(data, null, 2);
};

const convertToCSV = (data, columns) => {
    let csv = '';

    csv = columns.join(',') + '\n';

    data.dataToExportList.forEach((object) => {
        const row = columns.map(col => {
            const value = String(object[col] || '');
            return value.includes(',') ? `"${value}"` : value;
        }).join(',');
        csv += row + '\n';
    });

    return csv;
};

const ExportDataButton = () => {
    const { user } = useAuth();

    const {
        loading,
        selectedTable,
        timeInput,
        exportFormat,
        columns,
        openTimeInput,

        setError,
        setErrorMessage,
        setLoading,
        getDataToExport,
        clearDataToExportList
    } = useDataExportStore();

    const canDownload = user?.role === 'super_admin' || user?.role === 'data_admin';

    const handleExport = async () => {
        const validate = validateForm(
            selectedTable,
            exportFormat,
            openTimeInput,
            timeInput
        );

        if (!validate.isValid) {
            setError(true);
            setErrorMessage(validate.error);
            return;
        }

        try {
            const result = await getDataToExport();

            if (!result) {
                return;
            }

            let content;
            let fileType;
            let fileExtension;

            const { dataExportList } = useDataExportStore.getState();
            const data = dataExportList;

            if (data === null) {
                throw new Error('No data available for export');
            }

            switch (exportFormat) {
                case "json":
                    content = convertToJSON(data);
                    fileType = "application/json";
                    fileExtension = "json";
                    break;
                case "csv":
                    content = convertToCSV(data, columns);
                    fileType = "text/csv";
                    fileExtension = "csv";
                    break;
                case "excel":
                    content = convertToExcel(data, selectedTable);
                    fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // ✅ FIX: Proper MIME type
                    fileExtension = "xlsx";
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            // Create and trigger download for the file
            const blob = new Blob([content], { type: fileType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.style.display = 'none';


            link.download = `export_${selectedTable}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

            document.body.appendChild(link);
            link.click();


            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                clearDataToExportList();
            }, 100);

        } catch (error) {
            const errorMessage = error.message;
            setError(true);
            setErrorMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div>
            <button
                data-testid="export-data-button"
                onClick={handleExport}
                disabled={!selectedTable || !exportFormat || loading || !canDownload}
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
            {!canDownload && (
                <p className="text-sm text-red-600 mt-2 text-center">
                    You don't have permission to export data. Contact an administrator.
                </p>
            )}
        </div>
    )
};

export default ExportDataButton;
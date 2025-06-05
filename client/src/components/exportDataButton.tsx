import useDataExportStore from "@/stores/useDataExportStore";
import * as XLSX from "xlsx";
import { Loader2 } from 'lucide-react';
import { DataToExportList } from '../types/dataExport';
import { handleApiError } from "@/utils/errorHandlingUtils";
import { validateForm } from "@/utils/validationUtils";

const convertToExcel = (data: DataToExportList<any>, selectedTable: string | null) => {
    const worksheet = XLSX.utils.json_to_sheet(data.dataToExportList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable ? selectedTable : "");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return wbout;
}

const convertToJSON = (data: DataToExportList<any>) => {
    return JSON.stringify(data, null, 2);
};

const convertToCSV = (data: DataToExportList<any>, columns: string[]) => {
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

    const {
        loading,
        selectedTable,
        timeInput,
        exportFormat,
        columns,
        isSelectingUnusedMemberCarePackage,
        isSelectingUnusedMemberVoucher,

        setError,
        setErrorMessage,
        setLoading,
        getDataToExport
    } = useDataExportStore();

    const handleExport = async () => {

        const validate = validateForm(
            selectedTable,
            exportFormat, 
            isSelectingUnusedMemberVoucher, 
            isSelectingUnusedMemberCarePackage, 
            timeInput
        );

        if (!validate.isValid) {
            setError(true);
            setErrorMessage(validate.error); 
            return;
        }

        try {
            const result = await getDataToExport();

            if(!result) {
                return;
            }

            let content;
            let fileType;

            const { dataExportList } = useDataExportStore.getState();
            const data = dataExportList;

            if (data === null) {
                throw new Error('No data available for export');
            }

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
            const errorMessage = handleApiError(error);
            setError(true);
            setErrorMessage(errorMessage);
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
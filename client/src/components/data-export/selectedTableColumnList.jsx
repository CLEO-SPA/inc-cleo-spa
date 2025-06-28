import useDataExportStore from "@/stores/DataExport/useDataExportStore";

const SelectedTableColumnList = () => {

    const {
        selectedTable,
        columns
    } = useDataExportStore();

    if (!selectedTable) return null;

    return (
        <div>
            <h3 className="text-sm font-medium mb-2">Table Columns</h3>
            <div className="bg-gray-50 p-3 rounded-md border">
                <div className="grid gap-2">
                    {columns.map((column) => (
                        <div key={column} className="flex items-center justify-between">
                            <span className="font-medium">{column}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SelectedTableColumnList;
import * as React from 'react';

import useDataExportStore from '@/stores/useDataExportStore';
import SelectedTableColumnList from '@/components/selectedTableColumnList';
import ExportDataButton from '@/components/exportDataButton';

const DataExport = () => {

    const {
        success,
        error,
        selectedTable,
        exportFormat,
        timeInput,
        isSelectingUnusedMemberVoucher,
        isSelectingUnusedMemberCarePackage,
        
        setSelectedTable,
        setTimeInput,
        setExportFormat
    } = useDataExportStore();

    return (
        <div>
            <div className="w-full m-6 mx-auto">
                <div className="p-6 border-b">
                    <div className=" flex items-center justify-between">
                        Data Export Form
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-800 border-red-200">
                            <p className="text-sm">
                                An error has occurred. Please wait for a few minutes before exporting again.
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-800 border-green-200">
                            <p className="text-sm">
                                Data Export was a success!
                            </p>
                        </div>
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
                                <option value="member-details">Member Details</option>
                                <option value="unused-member-voucher">Unused Member Voucher</option>
                                <option value="unused-member-care-package">Unused Member Care Package</option>
                            </select>
                        </div>

                        {(isSelectingUnusedMemberVoucher || isSelectingUnusedMemberCarePackage) && (
                            <div>
                                <label className="block text-sm font-medium mb-2" htmlFor="unused-days-input">
                                    Minimum Time Since Use (Days)
                                </label>
                                <input id="unused-days-input" 
                                 type="number"
                                 min="0"
                                 value={timeInput}
                                 onChange={(e) => setTimeInput(e.target.value)}
                                 required
                                 />
                            </div>
                        )}

                        {selectedTable && <SelectedTableColumnList />}

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
                                <option value="">Select an export format</option>
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                                <option value="excel">EXCEL</option>
                            </select>
                        </div>

                        <ExportDataButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;
import useDataExportStore from '@/stores/DataExport/useDataExportStore';
import SelectedTableColumnList from '@/components/data-export/selectedTableColumnList';
import ExportDataButton from '@/components/data-export/exportDataButton';
import ErrorAlert from '@/components/ui/errorAlert';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataExportPage = () => {

    const {
        success,
        error,
        errorMessage,
        selectedTable,
        exportFormat,
        timeInput,
        openTimeInput,

        clearError,
        setSelectedTable,
        setTimeInput,
        setExportFormat
    } = useDataExportStore();

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='container mx-auto p-4 space-y-6'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Export</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <div className="w-full m-6 mx-auto">
                                        {error && <ErrorAlert
                                            error={error}
                                            errorMessage={errorMessage}
                                            onClose={clearError} />
                                        }
                                        <div className="p-6 space-y-6">
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
                                                        {/* <option value="unused-member-care-package">Unused Member Care Package</option> */}
                                                    </select>
                                                </div>
                                                {openTimeInput && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2" htmlFor="unused-days-input">
                                                            Minimum Time Since Use (Days)
                                                        </label>
                                                        <input
                                                            id="unused-days-input"
                                                            type="number"
                                                            value={timeInput || ''}
                                                            onChange={(e) => {
                                                                const value = Number(e.target.value);
                                                                setTimeInput(value);
                                                            }}
                                                            className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // ✅ ADD: Missing styles
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
                                </CardContent>
                            </Card>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default DataExportPage;
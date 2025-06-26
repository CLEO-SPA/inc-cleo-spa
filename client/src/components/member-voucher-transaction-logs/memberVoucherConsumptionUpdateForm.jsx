import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';
import ErrorAlert from '@/components/ui/errorAlert';

const TransactionLogUpdateForm = () => {
    const {
        updateFormFieldData,
        isUpdating,
        selectedTransactionLogId,
        error,
        errorMessage,

        clearError,
        updateUpdateFormField,
        clearUpdateFormData,
        setStoreFormData,
        setIsUpdating,
        setIsConfirming
    } = useMemberVoucherTransactionStore();

    const handleInputChange = (field, value) => {
        updateUpdateFormField(field, value);
    };

    const handleSubmit = () => {
        if (setStoreFormData(updateFormFieldData)) {
            setIsUpdating(true);
            setIsConfirming(true);
        };
    };

    const handleClear = () => {
        clearUpdateFormData();
    };

    const handleClose = () => {
        setIsUpdating(false);
    };

    if (!isUpdating) return null;

    if (!selectedTransactionLogId) {
        return (
            <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="bg-white p-6 rounded">
                    <p>Loading Transaction Log data...</p>
                    <button onClick={() => setIsUpdating(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Error Alert */}
                {error && <ErrorAlert
                    error={error}
                    errorMessage={errorMessage}
                    onClose={clearError}
                />}
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Update Transaction Log</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="consumptionValue" className="block mb-2">Consumption value</Label>
                        <Input
                            id="consumptionValue"
                            type="number"
                            value={updateFormFieldData.consumptionValue}
                            onChange={(e) => handleInputChange('consumptionValue', e.target.value)}
                            placeholder="Enter consumption value"
                        />
                    </div>

                    <div>
                        <Label htmlFor="remarks" className="block mb-2">Remarks</Label>
                        <textarea
                            id="remarks"
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            value={updateFormFieldData.remarks}
                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                            placeholder="Enter remarks"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="date" className="block mb-2">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={updateFormFieldData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="time" className="block mb-2">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={updateFormFieldData.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="type" className="block mb-2">Type</Label>
                        <Select
                            value={updateFormFieldData.type}
                            onValueChange={(value) => handleInputChange('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CONSUMPTION">Consumption</SelectItem>
                                <SelectItem value="FOC">Free Of Charge</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="createdBy" className="block mb-2">Created By</Label>
                        <Input
                            id="createdBy"
                            value={updateFormFieldData.createdBy}
                            onChange={(e) => handleInputChange('createdBy', e.target.value)}
                            placeholder="Enter creator name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="handledBy" className="block mb-2">Handled By</Label>
                        <Input
                            id="handledBy"
                            value={updateFormFieldData.handledBy}
                            onChange={(e) => handleInputChange('handledBy', e.target.value)}
                            placeholder="Enter handler name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="lastUpdatedBy" className="block mb-2">Last Updated By</Label>
                        <Input
                            id="lastUpdatedBy"
                            value={updateFormFieldData.lastUpdatedBy}
                            onChange={(e) => handleInputChange('lastUpdatedBy', e.target.value)}
                            placeholder="Enter updator name"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={handleClear} className="flex-1">
                            Clear
                        </Button>

                        <Button onClick={handleSubmit} className="flex-1">
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionLogUpdateForm;
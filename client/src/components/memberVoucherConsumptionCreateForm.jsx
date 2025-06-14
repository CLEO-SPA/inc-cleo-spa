import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';

const MemberVoucherConsumptionForm = () => {
  const { user } = useAuth();
  const {
    createFormFieldData,

    updateCreateFormField,
    clearCreateFormData,
    setStoreFormData,
    setIsCreating,
    setIsConfirming
  } = useMemberVoucherTransactionStore();

  const handleInputChange = (field, value) => {
    updateCreateFormField(field, value);
  };

  const handleSubmit = () => {
    if (setStoreFormData(createFormFieldData)) {
      setIsCreating(true);
      setIsConfirming(true);
    };
  };

  const handleClear = () => {
    clearCreateFormData();
  };

  const canAdd = user?.role === 'super_admin' || user?.role === 'data_admin';

  return (
    <div className="bg-gray mr-5 my-2 rounded-lg">
      <div className="space-y-4">
        <div>
          <Label htmlFor="consumptionValue" className="block mb-2">Consumption value</Label>
          <Input
            id="consumptionValue"
            type={"number"}
            value={createFormFieldData.consumptionValue}
            onChange={(e) => handleInputChange('consumptionValue', e.target.value)}
            placeholder="Enter consumption value"
          />
        </div>

        <div>
          <Label htmlFor="remarks" className="block mb-2">Remarks</Label>
          <textarea
            id="remarks"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            value={createFormFieldData.remarks}
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
              value={createFormFieldData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="time" className="block mb-2">Time</Label>
            <Input
              id="time"
              type="time"
              value={createFormFieldData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="type" className="block mb-2">Type</Label>
          <Select
            value={createFormFieldData.type}
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
            value={createFormFieldData.createdBy}
            onChange={(e) => handleInputChange('createdBy', e.target.value)}
            placeholder="Enter creator name"
          />
        </div>

        <div>
          <Label htmlFor="handledBy" className="block mb-2">Handled By</Label>
          <Input
            id="handledBy"
            value={createFormFieldData.handledBy}
            onChange={(e) => handleInputChange('handledBy', e.target.value)}
            placeholder="Enter handler name"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!canAdd}>
            Submit
          </Button>
        </div>
        {!canAdd && (
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to create transactions
          </p>
        )}
      </div>
    </div>
  );
};

export default MemberVoucherConsumptionForm;
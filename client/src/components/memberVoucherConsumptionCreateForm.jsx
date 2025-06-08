import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

// Import your UI components (assuming they're available)
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

const MemberVoucherConsumptionForm = () => {
  const [formData, setFormData] = useState({
    consumptionValue: '',
    remarks: '',
    date: '',
    time: '12:00',
    type: '',
    createdBy: '',
    handledBy: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Add your submit logic here
  };

  const handleClear = () => {
    setFormData({
      consumptionValue: '',
      remarks: '',
      date: '',
      time: '12:00',
      type: '',
      createdBy: '',
      handledBy: ''
    });
  };

  return (
    <div className="bg-gray mr-5 my-2 rounded-lg">
      <div className="space-y-4">
        <div>
          <Label htmlFor="consumptionValue" className="block mb-2">Consumption value</Label>
          <Input
            id="consumptionValue"
            value={formData.consumptionValue}
            onChange={(e) => handleInputChange('consumptionValue', e.target.value)}
            placeholder="Enter consumption value"
          />
        </div>

        <div>
          <Label htmlFor="remarks" className="block mb-2">Remarks</Label>
          <textarea
            id="remarks"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            value={formData.remarks}
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
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="time" className="block mb-2">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="type" className="block mb-2">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consumption">Consumption</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="createdBy" className="block mb-2">Created By</Label>
          <Input
            id="createdBy"
            value={formData.createdBy}
            onChange={(e) => handleInputChange('createdBy', e.target.value)}
            placeholder="Enter creator name"
          />
        </div>

        <div>
          <Label htmlFor="handledBy" className="block mb-2">Handled By</Label>
          <Input
            id="handledBy"
            value={formData.handledBy}
            onChange={(e) => handleInputChange('handledBy', e.target.value)}
            placeholder="Enter handler name"
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
  );
};

export default MemberVoucherConsumptionForm;
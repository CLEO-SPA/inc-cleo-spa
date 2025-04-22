import React, { useState } from 'react';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/interceptors/axios';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Draft', description: 'Package is being created or modified', color: 'text-yellow-500' },
  { label: 'Active', description: 'Package is available for sale', color: 'text-green-500' },
  { label: 'Suspended', description: 'Temporarily unavailable', color: 'text-orange-500' },
  { label: 'Discontinued', description: 'No longer available for new purchases', color: 'text-red-500' },
  { label: 'Expired', description: 'Package has reached end date', color: 'text-gray-500' },
  { label: 'Inactive', description: 'Not available for sale', color: 'text-red-500' },
  { label: 'Archived', description: 'Permanently retired', color: 'text-gray-500' },
];

const EditStatusDialog = ({ isOpen, onClose, carePackage, onStatusUpdate }) => {

  const [status, setStatus] = useState(carePackage?.cs_status.status_name || 'Draft');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.label === status);

  const handleClose = () => {
    setStatus(carePackage?.cs_status.status_name || 'Draft'); // reset status
    setMessage({ type: '', content: '' }); // clear message
    onClose();
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setMessage({ type: '', content: '' });
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await api.put(`/cp/update-cp-status/${carePackage?.care_package_id}`, {
        status: status,
      });

      if (!response.data.success) {
        throw new Error('Failed to update status');
      }

      setMessage({
        type: 'success',
        content: 'Status updated successfully!',
      });

      onStatusUpdate(carePackage.care_package_id, status);
      setTimeout(() => handleClose(), 1000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({
        type: 'error',
        content: 'Failed to update status. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white text-gray-900 border border-gray-300 shadow-xl p-6">
        <DialogHeader className="border-b border-gray-300 pb-4 flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Edit Package Status
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* package info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <label className="text-sm text-gray-500">Current Package</label>
            <p className="text-lg font-medium mt-1">{carePackage?.care_package_name || 'N/A'}</p>
          </div>

          {/* status selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Select Status</label>
            <select
              data-testid="status-select"
              value={status}
              onChange={handleStatusChange}
              className="w-full bg-white text-gray-900 rounded-lg p-3 border border-gray-300 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
                appearance-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>

            {selectedStatus && (
              <div className={`mt-2 text-sm ${selectedStatus.color} flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${selectedStatus.color.replace('text', 'bg')}`} />
                {selectedStatus.description}
              </div>
            )}
          </div>

          {/* status */}
          {message.content && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg text-sm
              ${message.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              {message.content}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-300 pt-4 gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUpdating}
            className="bg-transparent border-gray-400 hover:bg-gray-200 hover:text-gray-900 
              transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={`min-w-[100px] ${isUpdating
              ? 'bg-blue-400/50 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              } transition-colors duration-200`}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default EditStatusDialog;

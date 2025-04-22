import React, { useState } from 'react';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/interceptors/axios';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Invoice_Unpaid', description: 'Package is Unpaid', color: 'text-yellow-500' },
  { label: 'Invoice_Paid', description: 'Package is Paid and can be consume', color: 'text-green-500' },
  { label: 'Invoice_Partially_Paid', description: 'Package is Partially Paid and can be consume', color: 'text-yellow-500' },
];

const EditMemberCarePackageStatusDialog = ({ isOpen, onClose, memberCarePackage, onStatusUpdate }) => {
  // console.log(memberCarePackage);
  const [status, setStatus] = useState(memberCarePackage?.cs_status.status_name || 'Invoice_Unpaid');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.label === status);

  const handleClose = () => {
    setStatus(memberCarePackage?.cs_status?.status_name);
    setMessage({ type: '', content: '' });
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
      const response = await api.put(`/mcp/update-mcp-status/${memberCarePackage?.member_care_package_id}`, {
        status,
      });

      if (!response.data.success) {
        throw new Error('Failed to update status');
      }

      setMessage({
        type: 'success',
        content: 'Status updated successfully!',
      });

      onStatusUpdate(memberCarePackage.member_care_package_id, status);
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
            Update Member Package Status
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
          {/* package details */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div>
              <label className="text-sm text-gray-500">Package Name</label>
              <p className="text-lg font-medium mt-1">{memberCarePackage?.care_package_name || 'N/A'}</p>
            </div>
          </div>

          {/* status selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Update Status</label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="w-full bg-white text-gray-900 rounded-lg p-3 border border-gray-300 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
                appearance-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
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

          {/* status message */}
          {message.content && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg text-sm
              ${message.type === 'success'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
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

        <DialogFooter className="border-t border-gray-800 pt-4 gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUpdating}
            className="bg-transparent border-gray-700 hover:bg-gray-800 hover:text-white 
              transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={`min-w-[100px] ${isUpdating
              ? 'bg-blue-600/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } transition-colors duration-200`}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default EditMemberCarePackageStatusDialog;
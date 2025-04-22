import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LuX, LuCalendar } from 'react-icons/lu';
import { Separator } from '@/components/ui/separator';

const STATUS_MAPPINGS = {
  Draft: 'bg-yellow-100 text-yellow-700',
  Active: 'bg-green-100 text-green-700',
  Suspended: 'bg-orange-100 text-orange-700',
  Discontinued: 'bg-red-100 text-red-700',
  Expired: 'bg-gray-100 text-gray-700',
  Inactive: 'bg-red-100 text-red-700',
  Archived: 'bg-gray-100 text-gray-700',
};

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 shadow-lg transform transition-all duration-300 ease-in-out border border-gray-300"
      >
        {children}
      </div>
    </div>
  );
};

const CarePackageDetails = ({ isOpen, onClose, selectedPackage }) => {
  const getStatusStyle = (status) => {
    return STATUS_MAPPINGS[status] || 'bg-gray-100 text-gray-700';
  };

  if (!selectedPackage) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-6 text-gray-900 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">{selectedPackage.care_package_name}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LuX className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
          <div className="mt-3 space-y-2">
            <p className="text-gray-800">
              <strong>Price:</strong>{' '}
              <span className="text-blue-600">${Number(selectedPackage.care_package_price).toFixed(2)}</span>
            </p>
            <p className="text-gray-800">
              <strong>Status:</strong>{' '}
              <span className={`px-2 py-1 rounded-full ${getStatusStyle(selectedPackage.cs_status?.status_name)}`}>
                {selectedPackage.cs_status?.status_name}
              </span>
            </p>
            <p className="text-gray-800">
              <strong>Remarks:</strong> {selectedPackage.care_package_remarks}
            </p>
          </div>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900">Included Services</h3>
          <div className="mt-3 space-y-3">
            {selectedPackage.cs_care_package_item_details.map((item, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                <p className="text-gray-800">
                  <strong>Service Name:</strong> {item.cs_service?.service_name}
                </p>
                <p className="text-gray-800">
                  <strong>Sessions:</strong> {item.care_package_item_details_quantity}
                </p>
                <p className="text-gray-800">
                  <strong>Discount:</strong>{' '}
                  <span className="text-blue-600">{item.care_package_item_details_discount}%</span>
                </p>
                <p className="text-gray-800">
                  <strong>Price per Session:</strong>{' '}
                  <span className="text-green-600">${Number(item.care_package_item_details_price) / item.care_package_item_details_quantity}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-200" />

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <LuCalendar className="w-4 h-4" />
              <span>Created On: {new Date(selectedPackage.care_package_created_at).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-1">
              <LuCalendar className="w-4 h-4" />
              <span>Last Updated: {new Date(selectedPackage.care_package_updated_at).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CarePackageDetails;

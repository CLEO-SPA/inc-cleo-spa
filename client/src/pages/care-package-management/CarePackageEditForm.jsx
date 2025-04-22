import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import { X, Plus } from 'lucide-react';
import { api } from '@/interceptors/axios';

const CarePackageEditForm = ({ isOpen, onClose, carePackage, onUpdate }) => {
  const [formData, setFormData] = useState({
    creationDate: new Date(),
    care_package_name: '',
    care_package_price: '',
    care_package_remarks: '',
    services: [],
  });
  const [availableServices, setAvailableServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/service/getAllSerO');
        if (response.statusText !== 'OK') {
          throw new Error('Failed to fetch services');
        }
        setAvailableServices(response.data);
      } catch (err) {
        setError('Error loading services. Please try again later.');
        console.error('Error fetching services:', err);
      }
    };
    fetchServices();
  }, []);

  const handleDateTimeChange = (dateTime) => {
    let parsedDate;

    if (dateTime instanceof Date) {
      parsedDate = dateTime;
    } else if (typeof dateTime === 'string') {
      parsedDate = new Date(dateTime);
    } else {
      console.error('Invalid date format:', dateTime);
      return;
    }

    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date value');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      creationDate: parsedDate,
    }));
  };

  useEffect(() => {
    if (carePackage && isOpen) {
      const creationDate = carePackage.care_package_created_at
        ? new Date(carePackage.care_package_created_at)
        : new Date();

      setFormData({
        creationDate: creationDate,
        care_package_name: carePackage.care_package_name || '',
        care_package_price: carePackage.care_package_price || '',
        care_package_remarks: carePackage.care_package_remarks || '',
        services:
          carePackage.cs_care_package_item_details?.map((item) => ({
            service_id: item.cs_service?.service_id,
            service_name: item.cs_service?.service_name,
            quantity: item.care_package_item_details_quantity,
            price: item.care_package_item_details_price,
            discount: item.care_package_item_details_discount,
          })) || [],
      });
    }
  }, [carePackage, isOpen]);

  const handleAddService = () => {
    if (!selectedService) return;
    const serviceToAdd = availableServices.find((s) => s.service_id === selectedService);
    if (!serviceToAdd) return;

    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          service_id: serviceToAdd.service_id,
          service_name: serviceToAdd.service_name,
          quantity: 1,
          price: serviceToAdd.default_price || 0,
          discount: 0,
        },
      ],
    }));
    setSelectedService('');
  };

  const handleRemoveService = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formDataToSend = {
        packageName: formData.care_package_name,
        price: parseInt(formData.care_package_price),
        remarks: formData.care_package_remarks,
        createdDate: formData.creationDate.toISOString(),
        services: formData.services.map((service) => ({
          serviceId: service.service_id,
          quantity: service.quantity,
          price: parseInt(service.price),
          discount: parseInt(service.discount),
        })),
      };

      const response = await api.put(`/cp/update-cp/${carePackage.care_package_id}`, formDataToSend);

      if (response.status !== 200) {
        // Check status instead of statusText
        throw new Error('Failed to update care package');
      }
      onUpdate(response.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update care package');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !carePackage) return null;

  return (
    <DialogRoot open={isOpen}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogContent className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader className="flex items-center justify-between p-5 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Care Package Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </Button>
            </DialogHeader>
            <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Creation Date</label>
                <input
                  type="datetime-local"
                  value={formData.creationDate.toISOString().slice(0, 16)}
                  onChange={(e) => handleDateTimeChange(new Date(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name</label>
                <input
                  type="text"
                  value={formData.care_package_name}
                  onChange={(e) => setFormData({ ...formData, care_package_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Price ($)</label>
                <input
                  type="number"
                  value={formData.care_package_price}
                  onChange={(e) => setFormData({ ...formData, care_package_price: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={formData.care_package_remarks}
                  onChange={(e) => setFormData({ ...formData, care_package_remarks: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Services</label>
                <div className="flex gap-2">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Select a service</option>
                    {availableServices.map((service) => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.service_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={handleAddService}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {formData.services.map((service, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-medium text-gray-900">{service.service_name}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveService(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Quantity</label>
                          <input
                            type="number"
                            value={service.quantity}
                            onChange={(e) => {
                              const newServices = [...formData.services];
                              newServices[index].quantity = parseInt(e.target.value);
                              setFormData({ ...formData, services: newServices });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Price ($)</label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => {
                              const newServices = [...formData.services];
                              newServices[index].price = parseFloat(e.target.value);
                              setFormData({ ...formData, services: newServices });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Discount (%)</label>
                          <input
                            type="number"
                            value={service.discount}
                            onChange={(e) => {
                              const newServices = [...formData.services];
                              newServices[index].discount = parseFloat(e.target.value);
                              setFormData({ ...formData, services: newServices });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
            </div>

            <DialogFooter className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </div>
    </DialogRoot>
  );
};

export default CarePackageEditForm;

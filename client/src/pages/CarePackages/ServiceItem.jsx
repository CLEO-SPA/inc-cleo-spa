import React, { useState } from 'react';
import { Trash2, Edit3, Save, X } from 'lucide-react';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import { FormProvider, useForm } from 'react-hook-form';

const ServiceItem = ({ service, index, isEditing, onEdit, onSave, onCancel, onRemove }) => {
  const [editData, setEditData] = useState({
    quantity: service.quantity,
    price: service.price,
    discount: service.discount,
    service_id: service.id,
  });

  // form methods for ServiceSelect
  const methods = useForm({
    defaultValues: {
      service_id: service.id,
    },
  });

  const handleSave = () => {
    const formData = methods.getValues();
    onSave({
      ...editData,
      service_id: formData.service_id,
    });
  };

  const handleCancel = () => {
    setEditData({
      quantity: service.quantity,
      price: service.price,
      discount: service.discount,
      service_id: service.id,
    });
    methods.reset({ service_id: service.id });
    onCancel();
  };

  // handle service selection from ServiceSelect
  const handleServiceSelect = (serviceDetails) => {
    if (serviceDetails) {
      setEditData((prev) => ({
        ...prev,
        price: serviceDetails.price || prev.price,
      }));
    }
  };

  // calculate subtotal for edit mode based on current editData
  const priceInEdit = parseFloat(editData.price) || 0;
  const discountDecimal = parseFloat(editData.discount) || 0;

  // apply discount formula where discount represents the remaining percentage
  // final Price = Service Price × Discount (where 0.3 = 30% remaining = 70% discount)
  const discountedUnitPrice = priceInEdit * discountDecimal;

  // calculate subtotal for display mode
  const priceInDisplay = parseFloat(service.price) || 0;
  const discountDecimalDisplay = parseFloat(service.discount) || 0;
  const quantityInDisplay = parseInt(service.quantity, 10) || 0;
  const discountedUnitPriceDisplay = priceInDisplay * discountDecimalDisplay;

  return (
    <FormProvider {...methods}>
      <div className='border border-gray-200 rounded-lg p-4 bg-white shadow-sm'>
        {/* header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <h4 className='text-sm font-semibold text-gray-900'>{service.name}</h4>
            <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>ID: {service.id}</span>
          </div>

          {/* action buttons */}
          <div className='flex space-x-1'>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className='p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
                >
                  <Save className='h-4 w-4' />
                </button>
                <button
                  onClick={handleCancel}
                  className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                >
                  <X className='h-4 w-4' />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                >
                  <Edit3 className='h-4 w-4' />
                </button>
                <button
                  onClick={onRemove}
                  className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </>
            )}
          </div>
        </div>

        {/* service details */}
        {isEditing ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            <div className='xl:col-span-2'>
              <ServiceSelect name='service_id' label='Service *' onSelectFullDetails={handleServiceSelect} />
            </div>

            {/* original price (read-only) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Original Price</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                ${priceInEdit.toFixed(2)}
              </div>
            </div>

            {/* custom price (editable) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Custom Price</label>
              <input
                type='number'
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='0'
                step='0.01'
              />
            </div>

            {/* discount */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Discount</label>
              <input
                type='number'
                value={editData.discount}
                onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='0'
                max='5'
                step='0.001'
                placeholder='0.3'
              />
              <div className='text-xs text-gray-500 mt-1'>e.g., 0.3 = 70% discount</div>
            </div>

            {/* quantity */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Quantity</label>
              <input
                type='number'
                value={editData.quantity}
                onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='1'
              />
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            {/* service name (read-only) */}
            <div className='xl:col-span-2'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Service *</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                {service.name}
              </div>
            </div>

            {/* original price */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Original Price</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                ${priceInDisplay.toFixed(2)}
              </div>
            </div>

            {/* custom price */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Custom Price</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                ${priceInDisplay.toFixed(2)}
              </div>
            </div>

            {/* discount */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Discount</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                {discountDecimal}
              </div>
            </div>

            {/* quantity */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Quantity</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                {quantityInDisplay}
              </div>
            </div>
          </div>
        )}

        {/* summary */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Final Price</label>
            <div className='w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-medium text-blue-700'>
              ${isEditing ? discountedUnitPrice.toFixed(2) : discountedUnitPriceDisplay.toFixed(2)}
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Duration (min)</label>
            <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
              {service.duration || 45}
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Service Name</label>
            <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
              {service.name}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default ServiceItem;

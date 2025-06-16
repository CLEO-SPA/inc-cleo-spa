import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, Save, X, Clock, Tag } from 'lucide-react';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import { FormProvider, useForm } from 'react-hook-form';

const ServiceItem = ({ service, index, isEditing, onEdit, onSave, onCancel, onRemove }) => {
  const [editData, setEditData] = useState({
    quantity: service.quantity,
    price: service.price, 
    discount: service.discount,
    service_id: service.id,
  });

  const originalServicePrice = service.originalPrice || service.service_price || service.price;
  const methods = useForm({
    defaultValues: {
      service_id: service.id,
    },
  });

  // reset editData when service prop changes or when starting to edit
  useEffect(() => {
    if (isEditing) {
      setEditData({
        quantity: service.quantity,
        price: service.price,
        discount: service.discount,
        service_id: service.id,
      });
      methods.reset({ service_id: service.id });
    }
  }, [isEditing, service, methods]);

  const handleSave = () => {
    const formData = methods.getValues();
    onSave({
      ...editData,
      service_id: formData.service_id,
      price: parseFloat(editData.price) || 0, 
      quantity: parseInt(editData.quantity) || 1,
      discount: parseFloat(editData.discount) || 1, 
      originalPrice: originalServicePrice,
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
      const newServicePrice = parseFloat(serviceDetails.service_price || serviceDetails.price || 0);

      setEditData((prev) => ({
        ...prev,
        price: prev.service_id !== serviceDetails.id ? newServicePrice : prev.price,
        service_id: serviceDetails.id,
      }));
    }
  };

  // handle input changes with proper type conversion
  const handleEditDataChange = (field, value) => {
    if (field === 'quantity') {
      const processedValue = value === '' ? '' : parseInt(value, 10) || '';
      setEditData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
    } else if (field === 'price') {
      const processedValue = value === '' ? '' : parseFloat(value) || '';
      setEditData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
    } else if (field === 'discount') {
      if (value === '') {
        setEditData((prev) => ({
          ...prev,
          [field]: '',
        }));
      } else {
        const numValue = parseFloat(value);
        const processedValue = !isNaN(numValue) ? numValue : value;
        setEditData((prev) => ({
          ...prev,
          [field]: processedValue,
        }));
      }
    } else {
      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // handle blur events to set defaults if needed
  const handleBlur = (field, value) => {
    if (field === 'quantity') {
      if (value === '' || parseInt(value, 10) <= 0) {
        setEditData((prev) => ({
          ...prev,
          [field]: 1,
        }));
      }
    } else if (field === 'price') {
      if (value === '') {
        setEditData((prev) => ({
          ...prev,
          [field]: 0,
        }));
      }
    } else if (field === 'discount') {
      if (value === '') {
        setEditData((prev) => ({
          ...prev,
          [field]: 1, // Default to 1 (no discount)
        }));
      }
    }
  };

  // calculate display values for edit mode
  const customPriceInEdit = parseFloat(editData.price) || 0; 
  const discountFactor = parseFloat(editData.discount) || 1;
  const quantityInEdit = parseInt(editData.quantity) || 0;

  // final unit price = custom price × discount factor (frontend calculation)
  const finalUnitPriceInEdit = customPriceInEdit * discountFactor;
  const totalLineAmountInEdit = quantityInEdit * finalUnitPriceInEdit;

  // calculate display values for display mode
  const customPriceInDisplay = parseFloat(service.price) || 0; 
  const discountFactorDisplay = parseFloat(service.discount) || 1;
  const quantityInDisplay = parseInt(service.quantity, 10) || 0;

  // final unit price = custom price × discount factor (for created service)
  const finalUnitPriceInDisplay = customPriceInDisplay * discountFactorDisplay;
  const totalLineAmountInDisplay = quantityInDisplay * finalUnitPriceInDisplay;

  // helper function to calculate discount percentage for display
  const getDiscountPercentage = (discountFactor) => {
    if (!discountFactor || discountFactor === '') return '0';
    const factor = parseFloat(discountFactor);
    if (isNaN(factor)) return '0';
    const discountPercent = (1 - factor) * 100;
    return Math.max(0, discountPercent).toFixed(1);
  };

  // format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <FormProvider {...methods}>
      <div className='border border-gray-200 rounded-lg p-4 bg-white shadow-sm'>
        {/* header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <h4 className='text-sm font-semibold text-gray-900'>{service.name}</h4>
            <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>ID: {service.id}</span>
            {service.service_category_name && (
              <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center'>
                <Tag className='h-3 w-3 mr-1' />
                {service.service_category_name}
              </span>
            )}
          </div>

          {/* action buttons */}
          <div className='flex space-x-1'>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className='p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
                  title='Save changes'
                >
                  <Save className='h-4 w-4' />
                </button>
                <button
                  onClick={handleCancel}
                  className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                  title='Cancel editing'
                >
                  <X className='h-4 w-4' />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                  title='Edit service'
                >
                  <Edit3 className='h-4 w-4' />
                </button>
                <button
                  onClick={onRemove}
                  className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                  title='Remove service'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </>
            )}
          </div>
        </div>

        {/* service metadata */}
        {service.updated_at && (
          <div className='mb-4 p-2 bg-gray-50 rounded-md'>
            <div className='flex items-center text-xs text-gray-600'>
              <Clock className='h-3 w-3 mr-1' />
              Service last updated: {formatDate(service.updated_at)}
              {service.updated_by_name && ` by ${service.updated_by_name}`}
            </div>
          </div>
        )}

        {/* service details */}
        {isEditing ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            <div className='xl:col-span-2'>
              <ServiceSelect name='service_id' label='Service *' onSelectFullDetails={handleServiceSelect} />
            </div>

            {/* original price (read-only - service's base price from database) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>
                Original Price
                <span className='text-xs text-gray-400 ml-1'>(from service)</span>
              </label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-700'>
                ${parseFloat(originalServicePrice).toFixed(2)}
              </div>
            </div>

            {/* custom price (editable - stored in database WITHOUT discount applied) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>
                Custom Price
                <span className='text-xs text-gray-400 ml-1'>(before discount)</span>
              </label>
              <input
                type='number'
                value={editData.price !== undefined ? editData.price : ''}
                onChange={(e) => handleEditDataChange('price', e.target.value)}
                onBlur={(e) => handleBlur('price', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='0'
                step='0.01'
                placeholder='Enter price before discount'
              />
            </div>

            {/* discount factor */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Discount Factor</label>
              <input
                type='number'
                value={editData.discount !== undefined ? editData.discount : ''}
                onChange={(e) => handleEditDataChange('discount', e.target.value)}
                onBlur={(e) => handleBlur('discount', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='0'
                max='1'
                step='0.01'
                placeholder='1.0'
              />
              <div className='text-xs text-gray-500 mt-1'>
                {editData.discount
                  ? `${getDiscountPercentage(editData.discount)}% off`
                  : '1.0 = full price, 0.5 = half price'}
              </div>
            </div>

            {/* quantity */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Quantity</label>
              <input
                type='number'
                value={editData.quantity !== undefined ? editData.quantity : ''}
                onChange={(e) => handleEditDataChange('quantity', e.target.value)}
                onBlur={(e) => handleBlur('quantity', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='1'
                placeholder='Enter quantity'
              />
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            {/* service name (read-only) */}
            <div className='xl:col-span-2'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Service</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                {service.name}
              </div>
            </div>

            {/* original price (read-only) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>
                Original Price
                <span className='text-xs text-gray-400 ml-1'>(from service)</span>
              </label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-700'>
                ${parseFloat(originalServicePrice).toFixed(2)}
              </div>
            </div>

            {/* custom price (read-only - stored price WITHOUT discount) */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>
                Custom Price
                <span className='text-xs text-gray-400 ml-1'>(before discount)</span>
              </label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                ${customPriceInDisplay.toFixed(2)}
              </div>
            </div>

            {/* discount factor */}
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Discount Factor</label>
              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                {discountFactorDisplay} ({getDiscountPercentage(discountFactorDisplay)}% off)
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
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>
              Final Unit Price
              <span className='text-xs text-gray-400 ml-1'>(calculated)</span>
            </label>
            <div className='w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-medium text-blue-700'>
              ${isEditing ? finalUnitPriceInEdit.toFixed(2) : finalUnitPriceInDisplay.toFixed(2)}
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              ${isEditing ? customPriceInEdit.toFixed(2) : customPriceInDisplay.toFixed(2)} ×{' '}
              {isEditing ? discountFactor : discountFactorDisplay}
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>
              Total Line Amount
              <span className='text-xs text-gray-400 ml-1'>(calculated)</span>
            </label>
            <div className='w-full px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm font-medium text-green-700'>
              ${isEditing ? totalLineAmountInEdit.toFixed(2) : totalLineAmountInDisplay.toFixed(2)}
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {isEditing ? quantityInEdit : quantityInDisplay} × $
              {isEditing ? finalUnitPriceInEdit.toFixed(2) : finalUnitPriceInDisplay.toFixed(2)}
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Duration (min)</label>
            <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
              {service.service_duration || service.duration || 45}
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Pricing Model</label>
            <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
              {customPriceInDisplay !== parseFloat(originalServicePrice) ? 'Custom' : 'Standard'}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default ServiceItem;
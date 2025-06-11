import React, { useState } from 'react';
import { Trash2, Edit3, Save, X } from 'lucide-react';

const ServiceItem = ({ service, index, isEditing, onEdit, onSave, onCancel, onRemove }) => {
  const [editData, setEditData] = useState({
    quantity: service.quantity,
    price: service.price,
    discount: service.discount,
  });

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData({
      quantity: service.quantity,
      price: service.price,
      discount: service.discount,
    });
    onCancel();
  };

  // calculate subtotal for edit mode based on current editData
  const priceInEdit = parseFloat(editData.price) || 0;
  const discountDecimal = parseFloat(editData.discount) || 0; // Already in decimal form (0.153)
  const quantityInEdit = parseInt(editData.quantity, 10) || 0;

  // apply discount formula: Final Price = Quantity × (1 - Discount) × Service Price
  // where discount is already in decimal form (e.g., 0.153 for 15.3%)
  const discountedUnitPrice = priceInEdit * (1 - discountDecimal);
  const subtotalInEditMode = quantityInEdit * discountedUnitPrice;

  // calculate subtotal for display mode
  const priceInDisplay = parseFloat(service.price) || 0;
  const discountDecimalDisplay = parseFloat(service.discount) || 0; // Already in decimal form
  const quantityInDisplay = parseInt(service.quantity, 10) || 0;

  // apply same discount formula for display
  const discountedUnitPriceDisplay = priceInDisplay * (1 - discountDecimalDisplay);
  const subtotalInDisplayMode = quantityInDisplay * discountedUnitPriceDisplay;

  // Convert decimal to percentage for display purposes
  const discountPercentageForDisplay = (discountDecimalDisplay * 100).toFixed(1);

  return (
    <div className='border border-gray-200 rounded p-3 bg-gray-50/30'>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-sm font-semibold text-gray-900'>
          Service {index + 1}: {service.name}
        </h4>
        <span className='text-xs text-gray-500 bg-white px-2 py-1 rounded border'>ID: {service.id}</span>
      </div>

      {isEditing ? (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY</label>
            <input
              type='number'
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
              className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
              min='1'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE (PER UNIT)</label>
            <input
              type='number'
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
              className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
              min='0'
              step='0.01'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT (DECIMAL)</label>
            <div className='relative'>
              <input
                type='number'
                value={editData.discount}
                onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 0 })}
                className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                min='0'
                max='1'
                step='0.001'
                placeholder='0.153'
              />
            </div>
            <div className='text-xs text-gray-500 mt-1'>e.g., 0.50 = 50%</div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>FINAL UNIT PRICE</label>
            <div className='text-gray-700 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm'>
              ${discountedUnitPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>SUBTOTAL</label>
            <div className='text-gray-900 font-semibold px-2 py-1 bg-white rounded border text-sm'>
              ${subtotalInEditMode.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY</label>
            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>{service.quantity}</div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>ORIGINAL PRICE</label>
            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
              ${(parseFloat(service.price) || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT</label>
            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
              {discountPercentageForDisplay}% ({(parseFloat(service.discount) || 0).toFixed(3)})
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>FINAL UNIT PRICE</label>
            <div className='text-gray-700 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm'>
              ${discountedUnitPriceDisplay.toFixed(2)}
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>SUBTOTAL</label>
            <div className='text-gray-900 font-semibold px-2 py-1 bg-white rounded border text-sm'>
              ${subtotalInDisplayMode.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-end space-x-1 mt-3'>
        {isEditing ? (
          <>
            <button onClick={handleSave} className='p-1 text-green-600 hover:text-green-800 focus:outline-none'>
              <Save className='h-4 w-4' />
            </button>
            <button onClick={handleCancel} className='p-1 text-gray-600 hover:text-gray-800 focus:outline-none'>
              <X className='h-4 w-4' />
            </button>
          </>
        ) : (
          <>
            <button onClick={onEdit} className='p-1 text-gray-600 hover:text-gray-800 focus:outline-none'>
              <Edit3 className='h-4 w-4' />
            </button>
            <button onClick={onRemove} className='p-1 text-red-600 hover:text-red-800 focus:outline-none'>
              <Trash2 className='h-4 w-4' />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceItem;

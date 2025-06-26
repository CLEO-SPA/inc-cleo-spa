import React, { useState } from 'react';
import { Plus, X, Search, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useServiceStore from '@/stores/useServiceStore';

const ServiceSelection = ({
  serviceForm,
  serviceOptions = [],
  isLoading = false,
  onServiceSelect,
  onFieldUpdate,
  onAddService,
  onClearForm,
  calculateServiceTotal,
  showOriginalPrice = false, // keeping for backward compatibility
  getDiscountPercentage,
  className = '',
}) => {
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [priceError, setPriceError] = useState('');
  const fetchServiceDetails = useServiceStore((state) => state.fetchServiceDetails);

  // filter service options based on search input
  const filteredServiceOptions = serviceOptions.filter(
    (option) =>
      option.service_name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      option.label?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      option.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      option.service_category_name?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // handle service selection from dropdown
  const handleServiceSelect = async (service) => {
    try {
      console.log('Selected service:', service);
      // fetch full service details including correct duration
      const fullServiceData = await fetchServiceDetails(service.id);

      const servicePrice = parseFloat(fullServiceData.service_price || 0);

      const normalizedService = {
        id: fullServiceData.id,
        name: fullServiceData.service_name,
        label: fullServiceData.service_name,
        price: servicePrice,
        service_name: fullServiceData.service_name,
        service_price: servicePrice,
        originalPrice: servicePrice,
        service_description: fullServiceData.service_description,
        service_remarks: fullServiceData.service_remarks,
        duration: parseInt(fullServiceData.service_duration || 0), 
        service_duration: fullServiceData.service_duration,
        updated_at: fullServiceData.updated_at,
        created_at: fullServiceData.created_at,
        service_category_id: fullServiceData.service_category_id,
        service_category_name: fullServiceData.service_category_name,
        created_by_name: fullServiceData.created_by_name,
        updated_by_name: fullServiceData.updated_by_name,
      };

      onServiceSelect(normalizedService);
      setShowServiceDropdown(false);
      setServiceSearch('');
    } catch (error) {
      console.error('Failed to fetch service details:', error);
      // fallback to basic service data if API fails
      const servicePrice = parseFloat(service.service_price || 0);
      const normalizedService = {
        id: service.id,
        name: service.service_name || service.label || service.name,
        price: servicePrice,
        duration: 45, // use 45 as fallback
        // ... other basic fields
      };
      onServiceSelect(normalizedService);
      setShowServiceDropdown(false);
      setServiceSearch('');
    }
  };

  // handle adding service
  const handleAddService = () => {
    const hasValidId = serviceForm.id && serviceForm.id !== '';
    const hasValidName = serviceForm.name && serviceForm.name !== '';
    const hasValidQuantity = serviceForm.quantity && serviceForm.quantity > 0;

    if (hasValidId && hasValidName && hasValidQuantity) {
      onAddService();
    } else {
      console.log('Cannot add service - missing required fields:', {
        id: serviceForm.id,
        name: serviceForm.name,
        quantity: serviceForm.quantity,
        checks: { hasValidId, hasValidName, hasValidQuantity },
      });
    }
  };

  // always use the 6-column layout (edit mode layout)
  const gridCols = 'md:grid-cols-6';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {/* service selection dropdown - spans 2 columns */}
        <div className='md:col-span-2 relative'>
          <label className='block text-xs font-medium text-gray-600 mb-1'>SELECT SERVICE *</label>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className='w-full px-2 py-1 border border-gray-200 rounded bg-white text-left focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent flex items-center justify-between text-sm'
              disabled={isLoading}
            >
              <span className={serviceForm.name ? 'text-gray-900' : 'text-gray-400'}>
                {serviceForm.name || 'Choose a service...'}
              </span>
              <ChevronDown className='h-4 w-4 text-gray-400' />
            </button>

            {showServiceDropdown && (
              <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg'>
                <div className='p-2'>
                  <div className='relative'>
                    <Search className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
                    <input
                      type='text'
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder='Search services...'
                      className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-500'
                    />
                  </div>
                </div>
                <div className='max-h-40 overflow-y-auto'>
                  {filteredServiceOptions.map((option) => {
                    // get the display name and price with fallbacks for both formats
                    const displayName = option.service_name || option.label || option.name || 'Unknown Service';
                    const displayPrice = parseFloat(option.service_price || option.originalPrice || 0);
                    const updatedDate = option.updated_at ? new Date(option.updated_at).toLocaleDateString() : '';

                    return (
                      <button
                        key={option.id}
                        type='button'
                        onClick={() => handleServiceSelect(option)}
                        className='w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs'
                      >
                        <div className='font-medium text-gray-900'>{displayName}</div>
                        <div className='text-gray-500'>
                          ID: {option.id} | Price: ${displayPrice.toFixed(2)}
                          {updatedDate && ` | Updated: ${updatedDate}`}
                        </div>
                        {option.service_category_name && (
                          <div className='text-gray-400 text-xs'>Category: {option.service_category_name}</div>
                        )}
                      </button>
                    );
                  })}
                  {filteredServiceOptions.length === 0 && (
                    <div className='px-3 py-2 text-xs text-gray-500'>No services found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* original price - always shown */}
        <div>
          <label className='block text-xs font-medium text-gray-600 mb-1'>
            ORIGINAL PRICE
            <span className='text-xs text-gray-400 ml-1'>(from service)</span>
          </label>
          <div className='w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-gray-700'>
            ${(serviceForm.originalPrice || serviceForm.price || 0).toFixed(2)}
          </div>
        </div>

        {/* custom price - always shown */}
        <div>
          <label className='block text-xs font-medium text-gray-600 mb-1'>
            CUSTOM PRICE
            <span className='text-xs text-gray-400 ml-1'>(package-specific)</span>
          </label>
          <div className='relative'>
            <DollarSign className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
            <input
              type='number'
              value={serviceForm.price || ''}
              onChange={(e) => {
                const value = e.target.value;

                if (value === '') {
                  onFieldUpdate('price', '');
                  setPriceError('');
                } else {
                  const numValue = parseFloat(value);

                  if (isNaN(numValue)) {
                    setPriceError('Please enter a valid number');
                    return;
                  }

                  if (numValue < 0) {
                    setPriceError('Price cannot be negative');
                    return;
                  }

                  // valid price (0 or positive)
                  setPriceError('');
                  onFieldUpdate('price', numValue);
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || value === null || value === undefined) {
                  onFieldUpdate('price', 0);
                  setPriceError('');
                }
              }}
              className={`w-full pl-7 pr-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                priceError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-500'
              }`}
              min='0'
              step='0.01'
              placeholder='Enter custom price'
            />
          </div>
          <div className='text-xs mt-1'>
            {priceError ? (
              <span className='text-red-600'>{priceError}</span>
            ) : serviceForm.price !== undefined && serviceForm.price !== null && serviceForm.price !== '' ? (
              serviceForm.originalPrice && parseFloat(serviceForm.price) !== parseFloat(serviceForm.originalPrice) ? (
                <span className='text-gray-500'>Using custom pricing</span>
              ) : (
                <span className='text-gray-500'>Using standard pricing</span>
              )
            ) : (
              <span className='text-gray-500'>Enter 0 or positive amount</span>
            )}
          </div>
        </div>

        {/* discount factor */}
        <div>
          <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT FACTOR</label>
          <div className='relative'>
            <input
              type='number'
              value={serviceForm.discount !== undefined && serviceForm.discount !== null ? serviceForm.discount : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onFieldUpdate('discount', '');
                  setDiscountError('');
                } else {
                  const numValue = parseFloat(value);
                  if (isNaN(numValue)) {
                    setDiscountError('Please enter a valid number');
                    return;
                  }

                  if (numValue < 0) {
                    setDiscountError('Discount factor cannot be negative');
                    const clampedValue = 0;
                    onFieldUpdate('discount', clampedValue);
                  } else if (numValue > 1) {
                    setDiscountError('Discount factor cannot exceed 1.0 (use 0.5 for 50% off)');
                    const clampedValue = 1;
                    onFieldUpdate('discount', clampedValue);
                  } else {
                    setDiscountError('');
                    onFieldUpdate('discount', numValue);
                  }
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || value === null || value === undefined) {
                  onFieldUpdate('discount', 1);
                  setDiscountError('');
                }
              }}
              className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                discountError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-500'
              }`}
              min='0'
              max='1'
              step='0.01'
              placeholder='1.0'
            />
            <div className='text-xs mt-1'>
              {discountError ? (
                <span className='text-red-600'>{discountError}</span>
              ) : serviceForm.discount !== undefined && serviceForm.discount !== null && serviceForm.discount !== '' ? (
                <span className='text-gray-500'>{((1 - parseFloat(serviceForm.discount)) * 100).toFixed(1)}% off</span>
              ) : (
                <span className='text-gray-500'>Enter factor between 0.0-1.0 (1.0 = full price, 0.0 = 100% off)</span>
              )}
            </div>
          </div>
        </div>

        {/* quantity */}
        <div>
          <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY *</label>
          <input
            type='number'
            value={serviceForm.quantity || ''}
            onChange={(e) => {
              const value = e.target.value;
              onFieldUpdate('quantity', value === '' ? '' : parseInt(value, 10) || 0);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '' || parseInt(value, 10) <= 0) {
                onFieldUpdate('quantity', 1);
              }
            }}
            className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
            min='1'
            placeholder='Enter quantity'
          />
        </div>
      </div>

      {/* action buttons */}
      <div className='flex space-x-2'>
        <Button
          type='button'
          onClick={handleAddService}
          disabled={!serviceForm.id || !serviceForm.name || serviceForm.quantity <= 0}
          className='bg-gray-900 hover:bg-black text-white text-sm px-3 py-1 disabled:bg-gray-300 disabled:cursor-not-allowed'
        >
          <Plus className='h-4 w-4 mr-1' />
          Add Service
        </Button>

        <Button type='button' onClick={onClearForm} variant='outline' className='text-sm px-3 py-1'>
          <X className='h-4 w-4 mr-1' />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelection;

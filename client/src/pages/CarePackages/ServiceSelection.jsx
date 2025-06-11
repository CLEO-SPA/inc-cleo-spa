import React, { useState } from 'react';
import { Plus, X, Search, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ServiceSelection = ({
  serviceForm,
  serviceOptions = [],
  isLoading = false,
  onServiceSelect,
  onFieldUpdate,
  onAddService,
  onClearForm,
  calculateServiceTotal,
  showOriginalPrice = false, // for edit mode
  getDiscountPercentage, // for create mode (discount factor display)
  className = "",
}) => {
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  // filter service options based on search input
  const filteredServiceOptions = serviceOptions.filter((option) =>
    option.label.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // handle service selection from dropdown
  const handleServiceSelect = (service) => {
    onServiceSelect(service);
    setShowServiceDropdown(false);
    setServiceSearch('');
  };

  // handle adding service
  const handleAddService = () => {
    if (serviceForm.id && serviceForm.name && serviceForm.quantity > 0) {
      onAddService();
    }
  };
  const gridCols = showOriginalPrice ? 'md:grid-cols-6' : 'md:grid-cols-5';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {/* service selection dropdown */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">SELECT SERVICE *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className="w-full px-2 py-1 border border-gray-200 rounded bg-white text-left focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent flex items-center justify-between text-sm"
              disabled={isLoading}
            >
              <span className={serviceForm.name ? 'text-gray-900' : 'text-gray-400'}>
                {serviceForm.name || 'Choose a service...'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showServiceDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                <div className="p-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Search services..."
                      className="w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredServiceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleServiceSelect(option)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs"
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      {showOriginalPrice && (
                        <div className="text-gray-500">
                          ID: {option.id} | Price: ${option.price}
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredServiceOptions.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">No services found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* quantity */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">QUANTITY</label>
          <input
            type="number"
            value={serviceForm.quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (showOriginalPrice) {
                // edit mode - allow empty values
                onFieldUpdate('quantity', value === '' ? '' : parseInt(value, 10) || 0);
              } else {
                // create mode - ensure valid values
                if (value === '' || (!isNaN(value) && parseInt(value, 10) >= 0)) {
                  onFieldUpdate('quantity', value === '' ? '' : parseInt(value, 10) || 1);
                }
              }
            }}
            onBlur={(e) => {
              if (!showOriginalPrice) {
                const value = e.target.value;
                if (value === '' || parseInt(value, 10) <= 0) {
                  onFieldUpdate('quantity', 1);
                }
              }
            }}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            min="1"
            placeholder="Enter quantity"
          />
        </div>

        {/* original price (edit mode only) */}
        {showOriginalPrice && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ORIGINAL PRICE
              <span className="text-xs text-gray-400 ml-1">(from service)</span>
            </label>
            <div className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-gray-700">
              ${(serviceForm.originalPrice || 0).toFixed(2)}
            </div>
          </div>
        )}

        {/* price */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {showOriginalPrice ? (
              <>
                CUSTOM PRICE
                <span className="text-xs text-gray-400 ml-1">(package-specific)</span>
              </>
            ) : (
              'PRICE PER UNIT'
            )}
          </label>
          <div className="relative">
            <DollarSign className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              value={serviceForm.price}
              onChange={(e) => onFieldUpdate('price', parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              min="0"
              step="0.01"
              placeholder={showOriginalPrice ? "Enter custom price" : "0.00"}
            />
          </div>
          {showOriginalPrice && (
            <div className="text-xs text-gray-500 mt-1">
              {serviceForm.price &&
              serviceForm.originalPrice &&
              parseFloat(serviceForm.price) !== parseFloat(serviceForm.originalPrice)
                ? 'Using custom pricing'
                : 'Using standard pricing'}
            </div>
          )}
        </div>

        {/* discount */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">DISCOUNT FACTOR</label>
          <div className="relative">
            <input
              type="number"
              value={serviceForm.discount}
              onChange={(e) => {
                if (showOriginalPrice) {
                  onFieldUpdate('discount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0);
                } else {
                  onFieldUpdate('discount', e.target.value);
                }
              }}
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              min="0"
              max="1"
              step="0.01"
              placeholder="1.0"
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {showOriginalPrice ? (
              serviceForm.discount
                ? `${((1 - parseFloat(serviceForm.discount)) * 100).toFixed(1)}% off`
                : '1.0 = full price, 0.5 = half price'
            ) : (
              serviceForm.discount && serviceForm.discount !== '' && getDiscountPercentage
                ? `${getDiscountPercentage(serviceForm.discount)}% off`
                : 'Enter factor (1.0 = full price, 0.5 = half price)'
            )}
          </div>
        </div>

        {/* service total */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">SERVICE TOTAL</label>
          <div className="text-gray-900 font-semibold px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
            ${calculateServiceTotal().toFixed(2)}
          </div>
        </div>
      </div>

      {/* action buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={handleAddService}
          disabled={!serviceForm.id || !serviceForm.name || serviceForm.quantity <= 0}
          className="bg-gray-900 hover:bg-black text-white text-sm px-3 py-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Service
        </Button>

        <Button 
          type="button" 
          onClick={onClearForm} 
          variant="outline" 
          className="text-sm px-3 py-1"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelection;
import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Package, DollarSign, Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCpFormStore } from '@/stores/useCpFormStore';
import { Textarea } from '@/components/ui/textarea';
import ServiceItem from '@/pages/CarePackages/ServiceItem';

const CarePackageCreateForm = () => {
  const {
    mainFormData,
    serviceForm,
    serviceOptions,
    isLoading,
    error,
    updateMainField,
    resetMainForm,
    updateServiceFormField,
    selectService,
    resetServiceForm,
    addServiceToPackage,
    removeServiceFromPackage,
    updateServiceInPackage,
    fetchServiceOptions,
    submitPackage,
  } = useCpFormStore();

  const [editingService, setEditingService] = useState(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // fetch services
  useEffect(() => {
    fetchServiceOptions();
  }, [fetchServiceOptions]);

  // filter service options based on search input
  const filteredServiceOptions = serviceOptions.filter((option) =>
    option.label.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // calculate total package price using discount factor
  const calculateTotalPrice = () => {
    return mainFormData.services.reduce((total, service) => {
      const price = parseFloat(service.price) || 0;
      const quantity = parseInt(service.quantity, 10) || 0;

      let discountFactor = parseFloat(service.discount);
      if (
        isNaN(discountFactor) ||
        service.discount === '' ||
        service.discount === null ||
        service.discount === undefined
      ) {
        discountFactor = 1; // Full price when empty
      }

      // apply discount factor: Final Price = Quantity × Discount Factor × Service Price
      const discountedUnitPrice = price * discountFactor;
      const serviceTotal = quantity * discountedUnitPrice;

      return total + serviceTotal;
    }, 0);
  };

  // calculate the current service total in the form
  const calculateCurrentServiceTotal = () => {
    const price = parseFloat(serviceForm.price) || 0;
    const quantity = parseInt(serviceForm.quantity, 10) || 0;

    // handle discount factor - default to 1 (full price) if empty/invalid
    let discountFactor = parseFloat(serviceForm.discount);
    if (
      isNaN(discountFactor) ||
      serviceForm.discount === '' ||
      serviceForm.discount === null ||
      serviceForm.discount === undefined
    ) {
      discountFactor = 1; // full price when empty
    }

    const discountedUnitPrice = price * discountFactor;
    const serviceTotal = quantity * discountedUnitPrice;

    return serviceTotal;
  };

  // helper function to convert discount factor to percentage for display
  const getDiscountPercentage = (discountFactor) => {
    // handle empty/null/undefined values
    if (discountFactor === '' || discountFactor === null || discountFactor === undefined) {
      return '0';
    }

    const factor = parseFloat(discountFactor);

    // handle invalid numbers
    if (isNaN(factor)) {
      return '0';
    }

    // calculate discount percentage: (1 - factor) * 100
    // factor = 1.0 means 0% off (full price)
    // factor = 0.5 means 50% off (half price)
    // factor = 0.0 means 100% off (free)
    const discountPercent = (1 - factor) * 100;

    // ensure we don't show negative discounts
    return Math.max(0, discountPercent).toFixed(1);
  };

  // handle service selection from dropdown
  const handleServiceSelect = (service) => {
    selectService(service);
    setShowServiceDropdown(false);
    setServiceSearch('');
  };

  // handle adding service to package
  const handleAddService = () => {
    if (serviceForm.id && serviceForm.name && serviceForm.quantity > 0) {
      addServiceToPackage();
    }
  };

  // handle editing service in package
  const handleEditService = (index) => {
    setEditingService(index);
  };

  // handle saving edited service
  const handleSaveEditedService = (index, updatedData) => {
    updateServiceInPackage(index, updatedData);
    setEditingService(null);
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        package_name: mainFormData.package_name,
        package_remarks: mainFormData.package_remarks || '',
        package_price: mainFormData.package_price > 0 ? mainFormData.package_price : calculateTotalPrice(),
        customizable: mainFormData.customizable,
        employee_id: mainFormData.employee_id || null,
        services: mainFormData.services.map((service) => ({
          service_id: service.id,
          quantity: parseInt(service.quantity, 10),
          price: parseFloat(service.price),
          discount_factor: parseFloat(service.discount), // Store as discount factor
          final_price: parseFloat(service.price) * parseFloat(service.discount),
        })),
        total_price: mainFormData.package_price > 0 ? mainFormData.package_price : calculateTotalPrice(),
      };
      console.log('Submitting package payload:', payload);

      if (submitPackage) {
        await submitPackage(payload);
      }
      handleReset();
    } catch (error) {
      console.error('Error submitting package:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle form reset
  const handleReset = () => {
    resetMainForm();
    resetServiceForm();
    setEditingService(null);
  };

  const renderMainContent = () => {
    return (
      <div className='min-h-screen bg-gray-50'>
        {/* header */}
        <div className='bg-white border-b border-gray-200 px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Button
                variant='ghost'
                onClick={() => window.history.back()}
                className='flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1'
              >
                <ArrowLeft className='w-4 h-4 mr-1' />
                Back
              </Button>
              <h1 className='text-lg font-semibold text-gray-900'>Create Care Package</h1>
            </div>
            <div className='flex space-x-2'>
              <Button onClick={handleReset} variant='outline' className='flex items-center text-sm px-3 py-2'>
                <X className='w-4 h-4 mr-1' />
                Reset
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!mainFormData.package_name || mainFormData.services.length === 0 || isSubmitting}
                className='flex items-center bg-gray-900 hover:bg-black text-white text-sm px-3 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                <Save className='w-4 h-4 mr-1' />
                {isSubmitting ? 'Creating...' : 'Create Package'}
              </Button>
            </div>
          </div>
        </div>

        {/* error display */}
        {error && (
          <div className='max-w-7xl mx-auto px-4 py-2'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          </div>
        )}

        {/* main content */}
        <div className='max-w-7xl mx-auto px-4 py-2'>
          <div className='space-y-3'>
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='flex items-center text-gray-900 text-base font-semibold'>
                  <Package className='w-4 h-4 text-gray-700 mr-2' />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE NAME *</label>
                    <Input
                      type='text'
                      value={mainFormData.package_name}
                      onChange={(e) => updateMainField('package_name', e.target.value)}
                      className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      placeholder='Enter package name'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE PRICE</label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
                      <Input
                        type='number'
                        value={mainFormData.package_price}
                        onChange={(e) => updateMainField('package_price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        placeholder='0.00'
                        step='0.01'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CUSTOMIZABLE</label>
                    <select
                      value={mainFormData.customizable ? 'yes' : 'no'}
                      onChange={(e) => updateMainField('customizable', e.target.value === 'yes')}
                      className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                    >
                      <option value='no'>No</option>
                      <option value='yes'>Yes</option>
                    </select>
                  </div>
                </div>

                {mainFormData.services.length > 0 && (
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>CALCULATED TOTAL</label>
                        <div className='text-gray-900 font-semibold px-2 py-1 bg-green-50 border border-green-200 rounded text-sm'>
                          ${calculateTotalPrice().toFixed(2)}
                        </div>
                      </div>
                      {mainFormData.package_price > 0 && mainFormData.package_price !== calculateTotalPrice() && (
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE OVERRIDE</label>
                          <div className='text-gray-700 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs'>
                            Override: ${mainFormData.package_price.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className='mt-4'>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE REMARKS</label>
                  <Textarea
                    value={mainFormData.package_remarks || ''}
                    onChange={(e) => updateMainField('package_remarks', e.target.value)}
                    rows={3}
                    className='w-full px-2 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                    placeholder='Add any additional notes or remarks about this package...'
                  />
                </div>
              </CardContent>
            </Card>

            {/* service selection */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='text-gray-900 text-base font-semibold'>Add Services</CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
                  {/* dropdown */}
                  <div className='relative'>
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
                                className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                              />
                            </div>
                          </div>
                          <div className='max-h-40 overflow-y-auto'>
                            {filteredServiceOptions.map((option) => (
                              <button
                                key={option.id}
                                type='button'
                                onClick={() => handleServiceSelect(option)}
                                className='w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs'
                              >
                                <div className='font-medium text-gray-900'>{option.label}</div>
                              </button>
                            ))}
                            {filteredServiceOptions.length === 0 && (
                              <div className='px-3 py-2 text-xs text-gray-500'>No services found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* quantity */}
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY</label>
                    <Input
                      type='number'
                      value={serviceForm.quantity}
                      onChange={(e) => updateServiceFormField('quantity', parseInt(e.target.value) || 1)}
                      className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      min='1'
                    />
                  </div>

                  {/* price */}
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE PER UNIT</label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
                      <Input
                        type='number'
                        value={serviceForm.price}
                        onChange={(e) => updateServiceFormField('price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        min='0'
                        step='0.01'
                      />
                    </div>
                  </div>

                  {/* discount factor */}
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT FACTOR</label>
                    <div className='relative'>
                      <Input
                        type='number'
                        value={serviceForm.discount}
                        onChange={(e) => {
                          // Allow the raw value to be set directly for better typing experience
                          updateServiceFormField('discount', e.target.value);
                        }}
                        className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        min='0'
                        max='1'
                        step='0.01'
                        placeholder='1.0'
                      />
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {serviceForm.discount && serviceForm.discount !== ''
                        ? `${getDiscountPercentage(serviceForm.discount)}% off`
                        : 'Enter factor (1.0 = full price, 0.5 = half price)'}
                    </div>
                  </div>

                  {/* service total preview */}
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>SERVICE TOTAL</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm'>
                      ${calculateCurrentServiceTotal().toFixed(2)}
                    </div>
                  </div>
                </div>

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

                  <Button type='button' onClick={resetServiceForm} variant='outline' className='text-sm px-3 py-1'>
                    <X className='h-4 w-4 mr-1' />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* services list*/}
            {mainFormData.services.length > 0 && (
              <Card className='border-gray-200 shadow-sm'>
                <CardHeader className='border-b border-gray-100 px-4 py-1'>
                  <CardTitle className='text-gray-900 text-base font-semibold'>Package Services</CardTitle>
                </CardHeader>
                <CardContent className='p-3'>
                  <div className='space-y-3'>
                    {mainFormData.services.map((service, index) => (
                      <ServiceItem
                        key={index}
                        service={service}
                        index={index}
                        isEditing={editingService === index}
                        onEdit={() => handleEditService(index)}
                        onSave={(updatedData) => handleSaveEditedService(index, updatedData)}
                        onCancel={() => setEditingService(null)}
                        onRemove={() => removeServiceFromPackage(index)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>{renderMainContent()}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CarePackageCreateForm;

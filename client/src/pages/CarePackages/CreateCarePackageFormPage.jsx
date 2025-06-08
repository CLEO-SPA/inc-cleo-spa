import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, Package, DollarSign, Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCpFormStore } from '@/stores/useCpFormStore';
import { Textarea } from '@/components/ui/textarea';

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
  } = useCpFormStore();

  const [editingService, setEditingService] = useState(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  // fetch services
  useEffect(() => {
    fetchServiceOptions();
  }, [fetchServiceOptions]);

  // filter service options based on search input
  const filteredServiceOptions = serviceOptions.filter((option) =>
    option.label.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // calculate total package price
  const calculateTotalPrice = () => {
    return mainFormData.services.reduce((total, service) => {
      const finalPrice = parseFloat(service.finalPrice) || 0;
      const quantity = parseInt(service.quantity, 10) || 0;
      const serviceTotal = finalPrice * quantity;
      return total + serviceTotal;
    }, 0);
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
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting package:', {
      ...mainFormData,
      total_price: calculateTotalPrice(),
    });
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
                disabled={!mainFormData.package_name || mainFormData.services.length === 0}
                className='flex items-center bg-gray-900 hover:bg-black text-white text-sm px-3 py-2'
              >
                <Save className='w-4 h-4 mr-1' />
                Create Package
              </Button>
            </div>
          </div>
        </div>

        {/* error display still loading the form */}
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

                {mainFormData.package_remarks && (
                  <div className='mt-4'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE REMARKS</label>
                    <Textarea
                      value={mainFormData.package_remarks}
                      onChange={(e) => updateMainField('package_remarks', e.target.value)}
                      rows={3}
                      className='w-full px-2 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      placeholder='Add any additional notes or remarks about this package...'
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* service selection */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='text-gray-900 text-base font-semibold'>Add Services</CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
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
                                key={option.value}
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

                  {/* discount */}
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT</label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
                      <Input
                        type='number'
                        value={serviceForm.discount}
                        onChange={(e) => updateServiceFormField('discount', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        min='0'
                        step='0.01'
                      />
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

const ServiceItem = ({ service, index, isEditing, onEdit, onSave, onCancel, onRemove }) => {
  const [editData, setEditData] = useState({
    quantity: service.quantity,
    price: service.price, // User can customize this
    discount: service.discount, // User can customize this (it's the factor)
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

  // Calculate subtotal for edit mode based on current editData
  const priceInEdit = parseFloat(editData.price) || 0;
  const discountFactorInEdit = parseFloat(editData.discount) || 0; // This is the factor
  const quantityInEdit = parseInt(editData.quantity, 10) || 0;
  const finalUnitPriceInEdit = priceInEdit * discountFactorInEdit;
  const subtotalInEditMode = finalUnitPriceInEdit * quantityInEdit;

  // Calculate subtotal for display mode (using service data from props, which has pre-calculated finalPrice from store)
  const finalPriceInDisplay = parseFloat(service.finalPrice) || 0;
  const quantityInDisplay = parseInt(service.quantity, 10) || 0;
  const subtotalInDisplayMode = finalPriceInDisplay * quantityInDisplay;

  return (
    <div className='border border-gray-200 rounded p-3 bg-gray-50/30'>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-sm font-semibold text-gray-900'>
          Service {index + 1}: {service.name}
        </h4>
        <span className='text-xs text-gray-500 bg-white px-2 py-1 rounded border'>ID: {service.id}</span>
      </div>

      {isEditing ? (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
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
            {/* Ensure this label and input reflect that 'discount' is a factor */}
            <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT FACTOR</label>
            <input
              type='number'
              value={editData.discount}
              onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 1 })}
              className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
              min='0' // e.g., 0 for 100% discount
              max='1' // e.g., 1 for 0% discount (pays 100%)
              step='0.01'
              placeholder='e.g., 0.9 (pays 90%)'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>SUBTOTAL</label>
            <div className='text-gray-900 font-semibold px-2 py-1 bg-white rounded border text-sm'>
              ${subtotalInEditMode.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
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
            <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT FACTOR</label>
            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
              {(parseFloat(service.discount) || 0).toFixed(2)}
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

export default CarePackageCreateForm;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Package,
  DollarSign,
  Search,
  ChevronDown,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCpFormStore } from '@/stores/useCpFormStore';
import { useCpSpecificStore } from '@/stores/useCpSpecificStore';
import { NotFoundState } from '@/components/NotFoundState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import ServiceItem from '@/pages/CarePackages/ServiceItem';

const EditCarePackagePage = () => {
  const { id: packageId } = useParams();

  const {
    mainFormData,
    serviceForm,
    serviceOptions,
    isLoading: formLoading,
    error: formError,
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

  const {
    currentPackage,
    isLoading: packageLoading,
    error: packageError,
    fetchPackageById,
    updatePackage,
    clearCurrentPackage,
    clearError,
  } = useCpSpecificStore();

  const [editingService, setEditingService] = useState(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // combined loading and error states
  const isLoading = formLoading || packageLoading;
  const error = formError || packageError;

  // Helper function to populate form with package data
  const populateFormWithPackageData = useCallback(
    (packageData) => {
      const pkg = packageData.package;
      const details = packageData.details || [];

      // update main form fields with correct field names from the API response
      updateMainField('package_name', pkg.care_package_name || '');
      updateMainField('package_price', parseFloat(pkg.care_package_price) || '');
      updateMainField('customizable', pkg.care_package_customizable || false);
      updateMainField('package_remarks', pkg.care_package_remarks || '');

      // transform package details to match the form store structure
      const transformedServices = details.map((detail) => {
        return {
          id: detail.service_id,
          name: `Service ${detail.service_id}`,
          quantity: parseInt(detail.care_package_item_details_quantity) || 1,
          price: parseFloat(detail.care_package_item_details_price) || 0,
          discount: parseFloat(detail.care_package_item_details_discount) || 0, // Keep as decimal
          finalPrice:
            (parseFloat(detail.care_package_item_details_price) || 0) *
            (1 - (parseFloat(detail.care_package_item_details_discount) || 0)), // Calculate using decimal discount
          remarks: detail.care_package_item_details_remarks || '',
        };
      });

      // update services array
      updateMainField('services', transformedServices);
    },
    [updateMainField]
  );

  // load package data and service options on component mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        clearError();
        await fetchServiceOptions();

        if (packageId && !isInitialized && isMounted) {
          const packageData = await fetchPackageById(packageId);

          if (packageData && isMounted) {
            setOriginalData(JSON.parse(JSON.stringify(packageData)));
            populateFormWithPackageData(packageData);
            setIsInitialized(true);
          } else {
            console.log('No package data returned');
          }
        } else {
          if (!packageId) console.log('   - No packageId provided');
          if (isInitialized) console.log('   - Already initialized');
        }
      } catch (error) {
        console.error('Error in loadData:', error);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [packageId, fetchServiceOptions, fetchPackageById, clearError, populateFormWithPackageData, isInitialized]);

  useEffect(() => {
    return () => {
      clearCurrentPackage();
      resetMainForm();
    };
  }, [clearCurrentPackage, resetMainForm]);

  // enhanced function to get service names for display
  const getServiceDisplayName = useCallback(
    (serviceId) => {
      const service = serviceOptions.find((opt) => opt.id === serviceId);
      return service ? service.label : `Service ${serviceId}`;
    },
    [serviceOptions]
  );

  // track changes to detect unsaved modifications
  useEffect(() => {
    if (originalData && currentPackage && isInitialized) {
      const currentFormData = {
        package_name: mainFormData.package_name,
        package_price: mainFormData.package_price,
        customizable: mainFormData.customizable,
        package_remarks: mainFormData.package_remarks,
        services: mainFormData.services,
      };

      const pkg = originalData.package;
      const details = originalData.details || [];

      const originalFormData = {
        package_name: pkg.care_package_name || '',
        package_price: parseFloat(pkg.care_package_price) || 0,
        customizable: pkg.care_package_customizable || false,
        package_remarks: pkg.care_package_remarks || '',
        services: details.map((detail) => ({
          id: detail.service_id,
          name: getServiceDisplayName(detail.service_id),
          quantity: parseInt(detail.care_package_item_details_quantity) || 1,
          price: parseFloat(detail.care_package_item_details_price) || 0,
          discount: parseFloat(detail.care_package_item_details_discount) || 0,
          finalPrice:
            (parseFloat(detail.care_package_item_details_price) || 0) *
            (1 - (parseFloat(detail.care_package_item_details_discount) || 0)),
        })),
      };

      const hasChanges = JSON.stringify(currentFormData) !== JSON.stringify(originalFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [mainFormData, originalData, currentPackage, isInitialized, getServiceDisplayName]);

  // filter service options based on search input
  const filteredServiceOptions = serviceOptions.filter((option) =>
    option.label.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // calculate total package price using decimal discount
  const calculateTotalPrice = () => {
    return mainFormData.services.reduce((total, service) => {
      const price = parseFloat(service.price) || 0;
      const discountDecimal = parseFloat(service.discount) || 0; // Already a decimal (0.153 for 15.3%)
      const quantity = parseInt(service.quantity, 10) || 0;
      
      // apply discount formula: Final Price = Quantity × (1 - Discount) × Service Price
      // where discount is already in decimal form
      const discountedUnitPrice = price * (1 - discountDecimal);
      const serviceTotal = quantity * discountedUnitPrice;
      
      return total + serviceTotal;
    }, 0);
  };

  // calculate the current service total in the form
  const calculateCurrentServiceTotal = () => {
    const price = parseFloat(serviceForm.price) || 0;
    const discountDecimal = parseFloat(serviceForm.discount) || 0; // Already a decimal
    const quantity = parseInt(serviceForm.quantity, 10) || 0;
    
    // apply discount formula with decimal discount
    const discountedUnitPrice = price * (1 - discountDecimal);
    const serviceTotal = quantity * discountedUnitPrice;
    
    return serviceTotal;
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

  // handle form submission (update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // transform form data to match API expected format
      const updatedPackageData = {
        care_package_name: mainFormData.package_name,
        care_package_price: mainFormData.package_price,
        care_package_customizable: mainFormData.customizable,
        care_package_remarks: mainFormData.package_remarks,
        services: mainFormData.services.map((service) => ({
          service_id: service.id,
          care_package_item_details_price: service.price,
          care_package_item_details_discount: service.discount, // Store as decimal
          care_package_item_details_quantity: service.quantity,
          care_package_item_details_remarks: service.remarks || '',
        })),
        total_price: calculateTotalPrice(),
      };

      const updatedPackage = await updatePackage(packageId, updatedPackageData);
      // update original data to reflect the saved state
      setOriginalData(JSON.parse(JSON.stringify(updatedPackage)));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating package:', error);
    }
  };

  // handle form reset to original values
  const handleReset = () => {
    if (originalData) {
      populateFormWithPackageData(originalData);
      resetServiceForm();
      setEditingService(null);
      setHasUnsavedChanges(false);
    }
  };

  // handle navigation with unsaved changes warning
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  // show error if no packageId is found
  if (!packageId) {
    return <NotFoundState />;
  }

  const renderMainContent = () => {
    if (isLoading && !currentPackage) {
      return <LoadingState />;
    }

    if (error && !currentPackage) {
      return <ErrorState />;
    }

    return (
      <div className='min-h-screen bg-gray-50'>
        {/* header */}
        <div className='bg-white border-b border-gray-200 px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Button
                variant='ghost'
                onClick={handleBack}
                className='flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1'
              >
                <ArrowLeft className='w-4 h-4 mr-1' />
                Back
              </Button>
              <div>
                <h1 className='text-lg font-semibold text-gray-900'>Edit Care Package</h1>
                {hasUnsavedChanges && <p className='text-xs text-amber-600 mt-1'>• Unsaved changes</p>}
              </div>
            </div>
            <div className='flex space-x-2'>
              <Button
                onClick={handleReset}
                variant='outline'
                className='flex items-center text-sm px-3 py-2'
                disabled={!hasUnsavedChanges}
              >
                <X className='w-4 h-4 mr-1' />
                Reset Changes
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!mainFormData.package_name || mainFormData.services.length === 0 || isLoading}
                className='flex items-center bg-gray-900 hover:bg-black text-white text-sm px-3 py-2 disabled:bg-gray-300'
              >
                {isLoading ? <Loader className='w-4 h-4 mr-1 animate-spin' /> : <Save className='w-4 h-4 mr-1' />}
                Update Package
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
                <CardTitle className='flex items-center justify-between text-gray-900 text-base font-semibold'>
                  <div className='flex items-center'>
                    <Package className='w-4 h-4 text-gray-700 mr-2' />
                    Package Information
                  </div>
                  {packageId && (
                    <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>ID: {packageId}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE NAME *</label>
                    <input
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
                      <input
                        type='number'
                        value={mainFormData.package_price}
                        onChange={(e) => updateMainField('package_price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        placeholder='0.00'
                        min='0'
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
                  <textarea
                    value={mainFormData.package_remarks || ''}
                    onChange={(e) => updateMainField('package_remarks', e.target.value)}
                    rows={3}
                    className='w-full px-2 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                    placeholder='Add any additional notes or remarks about this package...'
                  />
                </div>
              </CardContent>
            </Card>

            {/* service selection card */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='text-gray-900 text-base font-semibold'>Add Services</CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
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
                                className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-500'
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
                                <div className='text-gray-500'>ID: {option.id}</div>
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

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY</label>
                    <input
                      type='number'
                      value={serviceForm.quantity}
                      onChange={(e) => updateServiceFormField('quantity', parseInt(e.target.value) || 1)}
                      className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      min='1'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE PER UNIT</label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2' />
                      <input
                        type='number'
                        value={serviceForm.price}
                        onChange={(e) => updateServiceFormField('price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        min='0'
                        step='0.01'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT (DECIMAL)</label>
                    <div className='relative'>
                      <input
                        type='number'
                        value={serviceForm.discount}
                        onChange={(e) => updateServiceFormField('discount', parseFloat(e.target.value) || 0)}
                        className='w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        min='0'
                        max='1'
                        step='0.001'
                        placeholder='0.153'
                      />
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Enter as decimal (e.g., 0.50 for 50% discount)
                    </div>
                  </div>

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

            {/* services List */}
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
                        service={{
                          ...service,
                          name: getServiceDisplayName(service.id),
                        }}
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

export default EditCarePackagePage;
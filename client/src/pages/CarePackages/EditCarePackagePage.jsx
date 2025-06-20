import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Package, DollarSign, ArrowLeft, Loader, User, AlertCircle } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCpFormStore } from '@/stores/CarePackage/useCpFormStore';
import { useCpSpecificStore } from '@/stores/CarePackage/useCpSpecificStore';
import { NotFoundState } from '@/components/NotFoundState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import ServiceItem from '@/pages/CarePackages/ServiceItem';
import ServiceSelection from '@/pages/CarePackages/ServiceSelection';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import { FormProvider, useForm } from 'react-hook-form';
import useAuth from '@/hooks/useAuth';

const EditCarePackagePage = () => {
  const { id: packageId } = useParams();
  const { user } = useAuth();

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [employeeError, setEmployeeError] = useState('');

  // form methods for employee selection
  const methods = useForm({
    defaultValues: {
      employee_id: mainFormData.employee_id || user?.id || '',
    },
  });

  useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name === 'employee_id') {
        updateMainField('employee_id', value.employee_id);
        if (value.employee_id) {
          setEmployeeError('');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateMainField]);

  useEffect(() => {
    methods.setValue('employee_id', mainFormData.employee_id || user?.id || '');
  }, [mainFormData.employee_id, methods, user?.id]);

  // combined loading and error states
  const isLoading = formLoading || packageLoading;
  const error = formError || packageError;

  // get service display name helper
  const getServiceDisplayName = useCallback(
    (serviceId) => {
      const serviceIdString = String(serviceId);
      const service = serviceOptions.find((opt) => String(opt.id) === serviceIdString);
      return service ? service.label : `Service ${serviceId}`;
    },
    [serviceOptions]
  );

  // get original service price helper
  const getOriginalServicePrice = useCallback(
    (serviceId) => {
      let service = serviceOptions.find((opt) => opt.id === serviceId);
      if (!service) {
        service = serviceOptions.find((opt) => String(opt.id) === String(serviceId));
      }
      return service ? service.price : null;
    },
    [serviceOptions]
  );

  // employee validation
  const validateEmployee = () => {
    if (!mainFormData.employee_id || mainFormData.employee_id === '') {
      setEmployeeError('Please select an employee');
      return false;
    }
    setEmployeeError('');
    return true;
  };

  // calculate total package price
  const calculateTotalPrice = () => {
    return mainFormData.services.reduce((total, service) => {
      const customPrice = parseFloat(service.price) || 0;
      const quantity = parseInt(service.quantity, 10) || 0;
      const discountFactor = parseFloat(service.discount) || 1;

      // ensure discount factor is valid (between 0 and 1)
      const validDiscountFactor = Math.max(0, Math.min(1, discountFactor));
      const finalUnitPrice = customPrice * validDiscountFactor;
      const lineTotal = quantity * finalUnitPrice;

      return total + lineTotal;
    }, 0);
  };

  // calculate current service total in form
  const calculateCurrentServiceTotal = () => {
    const customPrice = parseFloat(serviceForm.price) || 0;
    const quantity = parseInt(serviceForm.quantity, 10) || 0;
    const discountFactor = parseFloat(serviceForm.discount) || 1;

    // ensure discount factor is valid
    const validDiscountFactor = Math.max(0, Math.min(1, discountFactor));
    const finalUnitPrice = customPrice * validDiscountFactor;
    const lineTotal = quantity * finalUnitPrice;

    return lineTotal;
  };

  // helper to convert discount factor to percentage for display
  const getDiscountPercentage = (discountFactor) => {
    if (discountFactor === '' || discountFactor === null || discountFactor === undefined) {
      return '0';
    }

    const factor = parseFloat(discountFactor);
    if (isNaN(factor)) {
      return '0';
    }

    const discountPercent = (1 - factor) * 100;
    return Math.max(0, discountPercent).toFixed(1);
  };

  // populate form with package data
  const populateFormWithPackageData = useCallback(
    (packageData) => {
      if (!packageData || !packageData.package) {
        console.warn('Invalid packageData:', packageData);
        return;
      }
      if (!serviceOptions || serviceOptions.length === 0) {
        console.warn('serviceOptions not loaded yet, skipping populate');
        return;
      }

      const pkg = packageData.package;
      const details = packageData.details || [];

      // safely access package properties with fallbacks
      const packageName = pkg.care_package_name || pkg.package_name || '';
      const packagePrice = parseFloat(pkg.care_package_price || pkg.package_price || 0);
      const isCustomizable = Boolean(pkg.care_package_customizable || pkg.is_customizable);
      const packageRemarks = pkg.care_package_remarks || pkg.package_remarks || '';
      const employeeId = pkg.created_by || pkg.last_updated_by || user?.id || '';

      // update main form fields
      updateMainField('package_name', packageName);
      updateMainField('package_price', packagePrice);
      updateMainField('customizable', isCustomizable);
      updateMainField('package_remarks', packageRemarks);
      updateMainField('employee_id', employeeId);
      methods.setValue('employee_id', employeeId);

      // transform services with proper data structure
      const transformedServices = details.map((detail) => {
        const serviceId = detail.service_id;
        const serviceName = getServiceDisplayName(serviceId);
        const originalServicePrice = getOriginalServicePrice(serviceId);

        const customPrice = parseFloat(detail.care_package_item_details_price) || 0;
        const discountFactor = parseFloat(detail.care_package_item_details_discount) || 1;

        return {
          id: String(serviceId),
          name: serviceName,
          quantity: parseInt(detail.care_package_item_details_quantity) || 1,
          price: customPrice,
          originalPrice: originalServicePrice || customPrice,
          discount: discountFactor,
          remarks: detail.care_package_item_details_remarks || '',
        };
      });
      updateMainField('services', transformedServices);
    },
    [updateMainField, getServiceDisplayName, getOriginalServicePrice, serviceOptions, user?.id, methods]
  );

  // load package data and service options on mount
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
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [packageId, fetchServiceOptions, fetchPackageById, clearError, isInitialized]);

  // populate form when both data and service options are ready
  useEffect(() => {
    if (originalData && serviceOptions.length > 0 && isInitialized) {
      populateFormWithPackageData(originalData);
    }
  }, [originalData, serviceOptions, isInitialized, populateFormWithPackageData]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentPackage();
      resetMainForm();
    };
  }, [clearCurrentPackage, resetMainForm]);

  // track changes for unsaved changes warning
  useEffect(() => {
    if (originalData && originalData.package && isInitialized && serviceOptions.length > 0) {
      // normalize current form data
      const currentFormData = {
        package_name: (mainFormData.package_name || '').trim(),
        package_price: Number(mainFormData.package_price) || 0,
        customizable: Boolean(mainFormData.customizable),
        package_remarks: (mainFormData.package_remarks || '').trim(),
        employee_id: mainFormData.employee_id || '',
        services: (mainFormData.services || [])
          .map((service) => ({
            id: String(service.id),
            name: service.name || '',
            quantity: Number(service.quantity) || 0,
            price: Number(service.price) || 0,
            discount: Number(service.discount) || 1,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      };

      const pkg = originalData.package;
      const details = originalData.details || [];

      // normalize original form data
      const originalFormData = {
        package_name: (pkg.care_package_name || pkg.package_name || '').trim(),
        package_price: Number(pkg.care_package_price || pkg.package_price || 0),
        customizable: Boolean(pkg.care_package_customizable || pkg.is_customizable),
        package_remarks: (pkg.care_package_remarks || pkg.package_remarks || '').trim(),
        employee_id: pkg.created_by || pkg.last_updated_by || '',
        services: details
          .map((detail) => ({
            id: String(detail.service_id),
            name: getServiceDisplayName(detail.service_id),
            quantity: Number(detail.care_package_item_details_quantity) || 0,
            price: Number(detail.care_package_item_details_price) || 0,
            discount: Number(detail.care_package_item_details_discount) || 1,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      };

      const hasChanges = JSON.stringify(currentFormData) !== JSON.stringify(originalFormData);

      if (hasChanges !== hasUnsavedChanges) {
        setHasUnsavedChanges(hasChanges);
      }
    } else {
      if (hasUnsavedChanges !== false) {
        setHasUnsavedChanges(false);
      }
    }
  }, [
    mainFormData.package_name,
    mainFormData.package_price,
    mainFormData.customizable,
    mainFormData.package_remarks,
    mainFormData.employee_id,
    mainFormData.services,
    originalData,
    isInitialized,
    getServiceDisplayName,
    serviceOptions.length,
    hasUnsavedChanges,
  ]);

  // handle service selection from dropdown
  const handleServiceSelect = (service) => {
    if (!service || !service.id) {
      console.error('Invalid service object:', service);
      return;
    }

    const servicePrice = parseFloat(service.service_price || service.originalPrice || 0);

    // create normalized service object
    const serviceToSelect = {
      id: service.id,
      name: service.service_name || service.name || service.label || 'Unknown Service',
      label: service.service_name || service.name || service.label || 'Unknown Service',
      price: servicePrice,
      originalPrice: servicePrice,
      service_name: service.service_name || service.name || service.label,
      service_price: servicePrice,
      service_description: service.service_description,
      service_remarks: service.service_remarks,
      duration: parseInt(service.service_duration || service.duration || 45),
      service_duration: service.service_duration || service.duration,
      updated_at: service.updated_at,
      created_at: service.created_at,
      service_category_id: service.service_category_id,
      service_category_name: service.service_category_name,
      created_by_name: service.created_by_name,
      updated_by_name: service.updated_by_name,
    };

    selectService(serviceToSelect);
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

  // handle saving edited service with proper data structure
  const handleSaveEditedService = (index, updatedData) => {
    const processedData = {
      ...updatedData,
      price: parseFloat(updatedData.price) || 0,
      quantity: parseInt(updatedData.quantity) || 1,
      discount: parseFloat(updatedData.discount) || 1,
    };

    updateServiceInPackage(index, processedData);
    setEditingService(null);
  };

  // handle form submission with proper price validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // check for changes
    if (!hasUnsavedChanges) {
      console.log('No changes detected, skipping submit');
      return;
    }

    // validate employee
    if (!validateEmployee()) {
      console.log('Employee validation failed');
      return;
    }

    // validate required fields
    if (!mainFormData.package_name?.trim()) {
      console.log('Package name validation failed');
      alert('Package name is required');
      return;
    }

    if (!mainFormData.services || mainFormData.services.length === 0) {
      console.log('Services validation failed - no services');
      alert('At least one service is required');
      return;
    }

    try {
      // process services with proper validation and fallbacks
      const processedServices = mainFormData.services.map((service, index) => {
        const serviceName = service.name || `Service ${service.id}`;
        const serviceId = service.id;
        const serviceQuantity = Math.max(1, parseInt(service.quantity) || 1);
        const customPrice = Math.max(0, parseFloat(service.price) || 0);

        // ensure discount factor is valid (0-1 range)
        let discountFactor = parseFloat(service.discount);
        if (isNaN(discountFactor) || discountFactor < 0 || discountFactor > 1) {
          discountFactor = 1; // default to no discount if invalid
        }

        return {
          id: serviceId,
          name: serviceName,
          quantity: serviceQuantity,
          price: customPrice, // store original custom price
          discount: discountFactor,
          finalPrice: customPrice, // final price after discount
        };
      });
      const packagePrice = parseFloat(mainFormData.package_price) || 0;

      // create proper payload structure with validated data
      const updatedPackageData = {
        care_package_id: packageId,
        package_name: mainFormData.package_name.trim(),
        package_remarks: (mainFormData.package_remarks || '').trim(),
        package_price: packagePrice, // ensure positive price
        is_customizable: Boolean(mainFormData.customizable),
        employee_id: mainFormData.employee_id,
        services: processedServices.map((service) => ({
          id: service.id,
          name: service.name,
          quantity: service.quantity,
          price: service.price, // original custom price (before discount)
          discount: service.discount, // discount factor (0-1)
          finalPrice: service.finalPrice, // final calculated price
        })),
        updated_at: new Date().toISOString(),
      };

      const updateResponse = await updatePackage(packageId, updatedPackageData);

      if (updateResponse) {
        setTimeout(async () => {
          try {
            const updatedPackageDataResponse = await fetchPackageById(packageId);

            if (updatedPackageDataResponse) {
              setOriginalData(JSON.parse(JSON.stringify(updatedPackageDataResponse)));
              setHasUnsavedChanges(false);
              alert('Package updated successfully!');
            } else {
              alert('Package was updated but failed to refresh data. Please reload the page.');
            }
          } catch (fetchError) {
            console.error('Error fetching updated data:', fetchError);
            alert('Package was updated but failed to refresh data. Please reload the page.');
          }
        }, 500);
      } else {
        alert('Update response was unexpected. Please check if changes were saved.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = 'Failed to update package';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      alert(errorMessage);
    }
  };

  const handleRemoveService = (index) => {
    removeServiceFromPackage(index);
  };

  // handle form reset
  const handleReset = () => {
    if (originalData) {
      populateFormWithPackageData(originalData);
      resetServiceForm();
      setEditingService(null);
      setHasUnsavedChanges(false);
      setEmployeeError('');
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
                disabled={
                  !mainFormData.package_name?.trim() ||
                  !mainFormData.services?.length ||
                  isLoading ||
                  !hasUnsavedChanges ||
                  !mainFormData.employee_id
                }
                className={`flex items-center text-sm px-3 py-2 ${
                  hasUnsavedChanges &&
                  mainFormData.employee_id &&
                  mainFormData.package_name?.trim() &&
                  mainFormData.services?.length
                    ? 'bg-gray-900 hover:bg-black text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={
                  !hasUnsavedChanges
                    ? 'No changes to save'
                    : !mainFormData.employee_id
                    ? 'Please select an employee'
                    : !mainFormData.package_name?.trim()
                    ? 'Package name is required'
                    : !mainFormData.services?.length
                    ? 'At least one service is required'
                    : 'Save changes'
                }
              >
                {isLoading ? <Loader className='w-4 h-4 mr-1 animate-spin' /> : <Save className='w-4 h-4 mr-1' />}
                {hasUnsavedChanges ? 'Update Package' : 'No Changes to Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* error displays */}
        {error && (
          <div className='max-w-7xl mx-auto px-4 py-2'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          </div>
        )}

        {employeeError && (
          <div className='max-w-7xl mx-auto px-4 py-2'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{employeeError}</AlertDescription>
            </Alert>
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
              <CardContent className='p-6'>
                {/* employee selection */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2 flex items-center'>
                      <User className='w-4 h-4 mr-2' />
                      UPDATED BY *
                    </label>
                    <FormProvider {...methods}>
                      <div className={employeeError ? 'border border-red-300 rounded bg-red-50' : ''}>
                        <EmployeeSelect name='employee_id' label='' />
                      </div>
                    </FormProvider>
                    {employeeError && <p className='text-red-600 text-xs mt-1'>{employeeError}</p>}
                  </div>
                </div>

                {/* package details */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE NAME *</label>
                    <Input
                      type='text'
                      value={mainFormData.package_name || ''}
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
                        value={mainFormData.package_price || 0}
                        onChange={(e) => updateMainField('package_price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-7 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        placeholder='0.00'
                        min='0'
                        step='0.01'
                      />
                    </div>
                    <div className='flex justify-between text-xs mt-1'>
                      <span className='text-gray-500'>Calculated: ${calculateTotalPrice().toFixed(2)}</span>
                      <button
                        type='button'
                        onClick={() => updateMainField('package_price', calculateTotalPrice())}
                        className='text-blue-600 hover:text-blue-800 underline'
                      >
                        Use Calculated
                      </button>
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

                {mainFormData.services && mainFormData.services.length > 0 && (
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>CALCULATED TOTAL</label>
                        <div className='text-gray-900 font-semibold px-2 py-1 bg-green-50 border border-green-200 rounded text-sm'>
                          ${calculateTotalPrice().toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>TOTAL SERVICES</label>
                        <div className='text-gray-700 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm'>
                          {mainFormData.services.length} service{mainFormData.services.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* package remarks */}
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
                <ServiceSelection
                  serviceForm={serviceForm}
                  serviceOptions={serviceOptions}
                  isLoading={isLoading}
                  onServiceSelect={handleServiceSelect}
                  onFieldUpdate={updateServiceFormField}
                  onAddService={handleAddService}
                  onClearForm={resetServiceForm}
                  calculateServiceTotal={calculateCurrentServiceTotal}
                  showOriginalPrice={true}
                  getDiscountPercentage={getDiscountPercentage}
                />
              </CardContent>
            </Card>

            {/* services list */}
            {mainFormData.services && mainFormData.services.length > 0 && (
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
                        onRemove={() => handleRemoveService(index)}
                      />
                    ))}
                  </div>

                  {/* service summary */}
                  <div className='mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                      <div>
                        <div className='text-xs text-gray-600 mb-1'>TOTAL SERVICES</div>
                        <div className='text-lg font-semibold text-gray-900'>{mainFormData.services.length}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-600 mb-1'>TOTAL SESSIONS</div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {mainFormData.services.reduce(
                            (total, service) => total + (parseInt(service.quantity) || 0),
                            0
                          )}
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-600 mb-1'>BEFORE DISCOUNTS</div>
                        <div className='text-lg font-semibold text-gray-900'>
                          $
                          {mainFormData.services
                            .reduce((total, service) => {
                              const price = parseFloat(service.price) || 0;
                              const quantity = parseInt(service.quantity) || 0;
                              return total + price * quantity;
                            }, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-600 mb-1'>FINAL TOTAL</div>
                        <div className='text-lg font-bold text-green-600'>${calculateTotalPrice().toFixed(2)}</div>
                      </div>
                    </div>
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

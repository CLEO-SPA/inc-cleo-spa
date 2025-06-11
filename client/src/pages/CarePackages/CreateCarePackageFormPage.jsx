import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Package, DollarSign, Search, ChevronDown, ArrowLeft, User, Calendar } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCpFormStore } from '@/stores/useCpFormStore';
import { Textarea } from '@/components/ui/textarea';
import ServiceItem from '@/pages/CarePackages/ServiceItem';
import ServiceSelection from '@/pages/CarePackages/ServiceSelection';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import { FormProvider, useForm } from 'react-hook-form';

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
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const methods = useForm({
    defaultValues: {
      employee_id: mainFormData.employee_id || '',
    },
  });

  useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name === 'employee_id') {
        updateMainField('employee_id', value.employee_id);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateMainField]);

  // update form when store data changes
  useEffect(() => {
    methods.setValue('employee_id', mainFormData.employee_id || '');
  }, [mainFormData.employee_id, methods]);

  // initialize created_at with current datetime if not set
  useEffect(() => {
    if (!mainFormData.created_at) {
      const now = new Date();
      const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      updateMainField('created_at', localISOTime);
    }
  }, [mainFormData.created_at, updateMainField]);

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
    setSubmitStatus({ type: '', message: '' });

    try {
      const payload = {
        package_name: mainFormData.package_name,
        package_remarks: mainFormData.package_remarks || '',
        package_price: mainFormData.package_price > 0 ? mainFormData.package_price : calculateTotalPrice(),
        is_customizable: mainFormData.customizable,
        employee_id: mainFormData.employee_id || null,
        created_at: mainFormData.created_at,
        updated_at: mainFormData.created_at,
        services: mainFormData.services.map((service) => ({
          id: service.id,
          name: service.name,
          quantity: parseInt(service.quantity, 10),
          price: parseFloat(service.price),
          finalPrice: parseFloat(service.price) * parseFloat(service.discount),
          discount: parseFloat(service.discount),
        })),
      };
      console.log('Submitting package payload:', payload);

      if (submitPackage) {
        await submitPackage(payload);
        setSubmitStatus({
          type: 'success',
          message: 'Care package created successfully!',
        });

        // reset form after a brief delay to show the success message
        setTimeout(() => {
          handleReset();
          setSubmitStatus({ type: '', message: '' });
        }, 2000); // 2 second delay
      }
    } catch (error) {
      console.error('Error submitting package:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to create care package. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle form reset
  const handleReset = () => {
    resetMainForm();
    resetServiceForm();
    setEditingService(null);
    // reset created_at to current time
    const now = new Date();
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateMainField('created_at', localISOTime);
    // reset form context
    methods.reset({ employee_id: '' });
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

        {/* submit status display */}
        {submitStatus.message && (
          <div className='max-w-7xl mx-auto px-4 py-2'>
            <div
              className={`border rounded-lg p-4 ${
                submitStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}
              >
                {submitStatus.message}
              </p>
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
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2 flex items-center'>
                      <Calendar className='w-4 h-4 mr-2' />
                      CREATION DATE & TIME *
                    </label>
                    <Input
                      type='datetime-local'
                      value={mainFormData.created_at || ''}
                      onChange={(e) => updateMainField('created_at', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2 flex items-center'>
                      <User className='w-4 h-4 mr-2' />
                      ASSIGNED EMPLOYEE *
                    </label>
                    <FormProvider {...methods}>
                      <EmployeeSelect name='employee_id' label='' />
                    </FormProvider>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mt-6'>
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>PACKAGE NAME *</label>
                    <Input
                      type='text'
                      value={mainFormData.package_name}
                      onChange={(e) => updateMainField('package_name', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                      placeholder='Enter package name'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>PACKAGE PRICE</label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
                      <Input
                        type='number'
                        value={mainFormData.package_price}
                        onChange={(e) => updateMainField('package_price', parseFloat(e.target.value) || 0)}
                        className='w-full pl-10 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                        placeholder='0.00'
                        step='0.01'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>CUSTOMIZABLE</label>
                    <select
                      value={mainFormData.customizable ? 'yes' : 'no'}
                      onChange={(e) => updateMainField('customizable', e.target.value === 'yes')}
                      className='w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                    >
                      <option value='no'>No</option>
                      <option value='yes'>Yes</option>
                    </select>
                  </div>
                </div>

                {/* service */}
                {mainFormData.services.length > 0 && (
                  <div className='mt-6 pt-6 border-t border-gray-200'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-2'>CALCULATED TOTAL</label>
                        <div className='text-gray-900 font-semibold px-3 py-2 bg-green-50 border border-green-200 rounded text-sm'>
                          ${calculateTotalPrice().toFixed(2)}
                        </div>
                      </div>
                      {mainFormData.package_price > 0 && mainFormData.package_price !== calculateTotalPrice() && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-2'>PRICE OVERRIDE</label>
                          <div className='text-gray-700 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm'>
                            Override: ${mainFormData.package_price.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* package remarks */}
                <div className='mt-6'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>PACKAGE REMARKS</label>
                  <Textarea
                    value={mainFormData.package_remarks || ''}
                    onChange={(e) => updateMainField('package_remarks', e.target.value)}
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent'
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
                <ServiceSelection
                  serviceForm={serviceForm}
                  serviceOptions={serviceOptions}
                  isLoading={isLoading}
                  onServiceSelect={handleServiceSelect}
                  onFieldUpdate={updateServiceFormField}
                  onAddService={handleAddService}
                  onClearForm={resetServiceForm}
                  calculateServiceTotal={calculateCurrentServiceTotal}
                  getDiscountPercentage={getDiscountPercentage}
                />
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

import React, { useState, useEffect } from 'react';
import { Save, X, Package, DollarSign, ArrowLeft, User, Calendar, AlertCircle } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCpFormStore } from '@/stores/CarePackage/useCpFormStore';
import { Textarea } from '@/components/ui/textarea';
import ServiceItem from '@/pages/CarePackages/ServiceItem';
import ServiceSelection from '@/pages/CarePackages/ServiceSelection';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import { FormProvider, useForm } from 'react-hook-form';
import useServiceStore from '@/stores/useServiceStore';

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
  // const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  // const [serviceSearch, setServiceSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [employeeError, setEmployeeError] = useState('');
  const [packagePriceError, setPackagePriceError] = useState('');
  const fetchServiceDetails = useServiceStore((state) => state.fetchServiceDetails);

  const methods = useForm({
    defaultValues: {
      employee_id: mainFormData.employee_id || '',
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

  // employee validation function
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
      const discountFactor =
        service.discount !== undefined && service.discount !== null && service.discount !== ''
          ? parseFloat(service.discount)
          : 1;

      const finalUnitPrice = customPrice * discountFactor;
      const lineTotal = quantity * finalUnitPrice;
      return total + lineTotal;
    }, 0);
  };

  // calculate current service total in form
  const calculateCurrentServiceTotal = () => {
    const customPrice = parseFloat(serviceForm.price) || 0;
    const quantity = parseInt(serviceForm.quantity, 10) || 0;
    const discountFactor =
      serviceForm.discount !== undefined && serviceForm.discount !== null && serviceForm.discount !== ''
        ? parseFloat(serviceForm.discount)
        : 1;

    const finalUnitPrice = customPrice * discountFactor;
    const lineTotal = quantity * finalUnitPrice;

    return lineTotal;
  };

  // helper function to convert discount factor to percentage for display
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

  // handle service selection from dropdown
  const handleServiceSelect = async (service) => {
    if (!service || !service.id) {
      console.error('Invalid service object:', service);
      return;
    }

    try {
      // fetch full service details including correct duration
      const fullServiceData = await fetchServiceDetails(service.id);

      const serviceToSelect = {
        id: fullServiceData.id,
        name: fullServiceData.service_name || 'Unknown Service',
        label: fullServiceData.service_name || 'Unknown Service',
        price: parseFloat(fullServiceData.service_price || 0),
        originalPrice: parseFloat(fullServiceData.service_price || 0),
        service_name: fullServiceData.service_name,
        service_price: parseFloat(fullServiceData.service_price || 0),
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

      selectService(serviceToSelect);
    } catch (error) {
      console.error('Failed to fetch service details:', error);
      // fallback to basic service data if API fails
      const servicePrice = parseFloat(service.service_price || 0);
      const serviceToSelect = {
        id: service.id.toString(),
        name: service.service_name || service.name || 'Unknown Service',
        price: servicePrice,
        duration: 45, // only use 45 as absolute fallback
      };
      selectService(serviceToSelect);
    }
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
    const processedData = {
      ...updatedData,
      price: parseFloat(updatedData.price) || 0,
      quantity: parseInt(updatedData.quantity) || 1,
      discount:
        updatedData.discount !== undefined && updatedData.discount !== null && updatedData.discount !== ''
          ? parseFloat(updatedData.discount)
          : 1,
    };

    updateServiceInPackage(index, processedData);
    setEditingService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    if (!validateEmployee()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please select an employee before creating the package.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const processedServices = mainFormData.services.map((service, index) => {
        // validate service fields
        if (!service.id) {
          throw new Error(`Service ${index + 1}: Missing service ID`);
        }
        if (!service.name) {
          throw new Error(`Service ${index + 1}: Missing service name`);
        }
        const quantity = parseInt(service.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Service ${index + 1}: Invalid quantity (${service.quantity})`);
        }
        const price = parseFloat(service.price);
        // ensure custom price is not negative
        if (isNaN(price) || price < 0) {
          throw new Error(`Service ${index + 1}: Invalid price (${service.price}). Price must be 0 or positive.`);
        }
        const finalPrice = parseFloat(service.finalPrice);
        // ensure custom price is not negative
        if (isNaN(finalPrice) || price < 0) {
          throw new Error(`Service ${index + 1}: Invalid price (${service.finalPrice}). Price must be 0 or positive.`);
        }
        let discountFactor;
        if (service.discount === undefined || service.discount === null || service.discount === '') {
          discountFactor = 1;
        } else {
          discountFactor = parseFloat(service.discount);
          if (isNaN(discountFactor) || discountFactor < 0) {
            throw new Error(`Service ${index + 1}: Invalid discount (${service.discount})`);
          }
        }
        return {
          id: service.id.toString(),
          name: service.name,
          quantity: quantity,
          price: price,
          discount: discountFactor,
          finalPrice: finalPrice,
        };
      });

      // validate main form fields
      if (!mainFormData.package_name || mainFormData.package_name.trim() === '') {
        throw new Error('Package name is required');
      }
      if (!mainFormData.employee_id) {
        throw new Error('Employee selection is required');
      }
      if (!mainFormData.created_at) {
        throw new Error('Creation date is required');
      }

      // calculate package price and ensure it's not negative
      const calculatedTotal = calculateTotalPrice();
      let finalPackagePrice = calculatedTotal;

      if (
        mainFormData.package_price &&
        mainFormData.package_price !== '' &&
        !isNaN(parseFloat(mainFormData.package_price))
      ) {
        const overridePrice = parseFloat(mainFormData.package_price);
        if (overridePrice < 0) {
          throw new Error('Package price cannot be negative');
        }
        finalPackagePrice = overridePrice;
      }

      const payload = {
        package_name: mainFormData.package_name.trim(),
        package_remarks: mainFormData.package_remarks || '',
        package_price: finalPackagePrice,
        is_customizable: Boolean(mainFormData.customizable),
        employee_id: mainFormData.employee_id.toString(),
        created_at: mainFormData.created_at,
        updated_at: mainFormData.created_at,
        services: processedServices,
      };

      if (submitPackage) {
        await submitPackage(payload);
        setSubmitStatus({
          type: 'success',
          message: 'Care package created successfully!',
        });

        setTimeout(() => {
          handleReset();
          setSubmitStatus({ type: '', message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error details:', error);

      setSubmitStatus({
        type: 'error',
        message: `Failed to create care package: ${error.message}`,
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
    setEmployeeError('');
    const now = new Date();
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateMainField('created_at', localISOTime);
    methods.reset({ employee_id: '' });
  };

  // helper function to check if form is valid for submission
  const isFormValid = () => {
    return (
      mainFormData.package_name &&
      mainFormData.package_name.trim() !== '' &&
      mainFormData.employee_id &&
      mainFormData.employee_id !== '' &&
      mainFormData.services &&
      mainFormData.services.length > 0
    );
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
                disabled={!isFormValid() || isSubmitting}
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

        {/* employee error display */}
        {employeeError && (
          <div className='max-w-7xl mx-auto px-4 py-2'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{employeeError}</AlertDescription>
            </Alert>
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
                      <div className={employeeError ? 'border border-red-300 rounded bg-red-50' : ''}>
                        <EmployeeSelect name='employee_id' label='' />
                      </div>
                    </FormProvider>
                    {employeeError && <p className='text-red-600 text-xs mt-1'>{employeeError}</p>}
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
                    <label className='block text-sm font-medium text-gray-600 mb-2'>
                      PACKAGE PRICE
                      <span className='text-xs text-gray-400 ml-1'>
                        (leave empty for auto-calculated: ${calculateTotalPrice().toFixed(2)})
                      </span>
                    </label>
                    <div className='relative'>
                      <DollarSign className='h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
                      <Input
                        type='number'
                        value={mainFormData.package_price || ''}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === '') {
                            updateMainField('package_price', '');
                            setPackagePriceError('');
                          } else {
                            const numValue = parseFloat(value);

                            if (isNaN(numValue)) {
                              setPackagePriceError('Please enter a valid number');
                              return;
                            }

                            if (numValue < 0) {
                              setPackagePriceError('Package price cannot be negative');
                              return;
                            }

                            // valid price (0 or positive)
                            setPackagePriceError('');
                            updateMainField('package_price', value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== '' && (parseFloat(value) < 0 || isNaN(parseFloat(value)))) {
                            updateMainField('package_price', '');
                            setPackagePriceError('');
                          }
                        }}
                        className={`w-full pl-10 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                          packagePriceError
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-gray-500'
                        }`}
                        placeholder={calculateTotalPrice().toFixed(2)}
                        min='0'
                        step='0.01'
                      />
                    </div>
                    <div className='text-xs mt-1'>
                      {packagePriceError ? (
                        <span className='text-red-600'>{packagePriceError}</span>
                      ) : !mainFormData.package_price || mainFormData.package_price === '' ? (
                        <span className='text-gray-500'>
                          Will use calculated total: ${calculateTotalPrice().toFixed(2)}
                        </span>
                      ) : parseFloat(mainFormData.package_price) === calculateTotalPrice() ? (
                        <span className='text-gray-500'>Matches calculated total</span>
                      ) : (
                        <span className='text-gray-500'>
                          Override: ${parseFloat(mainFormData.package_price || 0).toFixed(2)}
                          (vs calculated: ${calculateTotalPrice().toFixed(2)})
                        </span>
                      )}
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

                {/* pricing summary */}
                {mainFormData.services.length > 0 && (
                  <div className='mt-6 pt-6 border-t border-gray-200'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-2'>
                          CALCULATED TOTAL
                          <span className='text-xs text-gray-400 ml-1'>(frontend calculation)</span>
                        </label>
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

            {/* services list */}
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
                              const price = parseFloat(service.price) || 0; // Custom price WITHOUT discount
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

export default CarePackageCreateForm;

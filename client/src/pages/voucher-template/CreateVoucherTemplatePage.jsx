// pages/CreateVoucherTemplatePage.jsx
import { useForm, FormProvider } from 'react-hook-form';
import { useVoucherTemplateFormStore } from '@/stores/useVoucherTemplateFormStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import useServiceStore from '@/stores/useServiceStore';

// Import extracted components
import {
  ServiceRow,
  ServicesTable,
  AddServiceForm,
  TemplateInfoForm,
  SuccessDialog
} from '@/components/voucher/VoucherTemplateComponents';

const CreateVoucherTemplatePage = () => {
  // Store hooks
  const {
    mainFormData,
    serviceForm,
    isCreating,
    error,
    updateMainField,
    updateServiceFormField,
    selectService,
    addServiceToTemplate,
    removeServiceFromTemplate,
    updateServiceInTemplate,
    fetchServiceOptions,
    createVoucherTemplate,
    resetMainForm,
    clearError,
  } = useVoucherTemplateFormStore();

  // Local state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState(null);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [serviceSelectKey, setServiceSelectKey] = useState(0);
  
  const navigate = useNavigate();

  // Service store
  const { services: serviceOptions, loading: servicesLoading, error: servicesError } = useServiceStore();

  // Form configuration
  const defaultValues = useMemo(() => ({
    created_at: '',
    voucher_template_name: '',
    default_starting_balance: 0,
    default_free_of_charge: 0,
    default_total_price: 0,
    remarks: '',
    status: 'is_enabled',
    created_by: '',
    created_at: '',
  }), []);

  const methods = useForm({ defaultValues });
  const { register, handleSubmit, reset, formState: { errors } } = methods;

  // Event handlers
  const handleServiceSelect = useCallback(async (serviceData) => {
    try {
      await selectService(serviceData);
    } catch (error) {
      console.error('Error selecting service:', error);
    }
  }, [selectService]);

  const handleAddService = useCallback(() => {
    if (!serviceForm.service_id) {
      alert('Please select a service first.');
      return;
    }
    addServiceToTemplate();
  }, [serviceForm.service_id, addServiceToTemplate]);

  const handleServiceFieldChange = useCallback((index, field, value) => {
    const updatedData = { [field]: value };
    
    if (field === 'custom_price' || field === 'discount') {
      const service = mainFormData.details[index];
      const customPrice = field === 'custom_price' ? value : service.custom_price;
      const discount = field === 'discount' ? value : service.discount;
      updatedData.final_price = customPrice - (customPrice * discount / 100);
    }
    
    updateServiceInTemplate(index, updatedData);
  }, [mainFormData.details, updateServiceInTemplate]);

  const handleUpdateService = useCallback((index) => {
    setEditingServiceIndex(current => current === index ? null : index);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    updateMainField(field, value);
    console.log(`Field ${field} updated to:`, value);
  }, [updateMainField]);

  const handleServiceFormFieldChange = useCallback((field, value) => {
    updateServiceFormField(field, value);
  }, [updateServiceFormField]);

  // Effects
  useEffect(() => {
    fetchServiceOptions();
  }, [fetchServiceOptions]);

  useEffect(() => {
    if (serviceOptions.length > 0 && !servicesLoading) {
      setServiceSelectKey(prev => prev + 1);
    }
  }, [serviceOptions.length, servicesLoading]);

  // Form submission
  const onSubmit = useCallback(async (data) => {
    clearError();
      const createdAtIso = new Date(data.created_at).toISOString();

    if (mainFormData.details.length === 0) {
      alert('Please add at least one service to the voucher template.');
      return;
    }
    console.log('Submitting voucher template with data:', data);
    const templateData = {
      ...data,
      default_total_price: mainFormData.default_total_price,
          created_at: createdAtIso,
    updated_at: new Date().toISOString(),
      details: mainFormData.details.map(detail => ({
        service_id: detail.service_id,
        service_name: detail.service_name,
        original_price: detail.original_price,
        custom_price: detail.custom_price,
        discount: detail.discount,
        final_price: detail.final_price,
        duration: detail.duration,
        service_category_id: detail.service_category_id,
      })),
    };
    console.log('Template data to be created:', templateData);

    const result = await createVoucherTemplate(templateData);

    if (result.success) {
      setCreatedTemplate(templateData);
      setShowSuccessDialog(true);
      reset();
      resetMainForm();
    }
  }, [mainFormData.details, clearError, createVoucherTemplate, reset, resetMainForm]);

  // Dialog handlers
  const handleCloseDialog = useCallback(() => {
    setShowSuccessDialog(false);
    setCreatedTemplate(null);
  }, []);

  const handleGoToTemplates = useCallback(() => {
    setShowSuccessDialog(false);
    navigate('/voucher-templates');
  }, [navigate]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className="w-full max-w-none p-6">
              {/* Header Section */}
              <div className="flex items-center gap-3 mb-6">
                <Link to="/voucher-templates">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Create Voucher Template
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new voucher template with services
                  </p>
                </div>
              </div>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">
                        Template Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <TemplateInfoForm
                        register={register}
                        errors={errors}
                        mainFormData={mainFormData}
                        onFieldChange={handleFieldChange}
                      />

                      {/* Additional fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Status
                          </Label>
                          <Select
                            onValueChange={(val) => handleFieldChange('status', val)}
                            defaultValue="is_enabled"
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="is_enabled">Enabled</SelectItem>
                              <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <EmployeeSelect name="created_by" label="Created By *" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
                          Remarks
                        </Label>
                        <Textarea
                          id="remarks"
                          placeholder="Enter any additional remarks"
                          {...register("remarks")}
                          onChange={(e) => handleFieldChange('remarks', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">
                        Template Services
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Note that the services added here only acts as system driven remarks and does not affect the actual service data.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AddServiceForm
                        serviceForm={serviceForm}
                        serviceOptions={serviceOptions}
                        servicesLoading={servicesLoading}
                        servicesError={servicesError}
                        serviceSelectKey={serviceSelectKey}
                        onServiceSelect={handleServiceSelect}
                        onFieldChange={handleServiceFormFieldChange}
                        onAddService={handleAddService}
                        onRetryServices={fetchServiceOptions}
                      />

                      <ServicesTable
                        services={mainFormData.details}
                        editingIndex={editingServiceIndex}
                        onEdit={handleUpdateService}
                        onFieldChange={handleServiceFieldChange}
                        onRemove={removeServiceFromTemplate}
                      />
                    </CardContent>
                  </Card>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      All fields marked with * are required
                    </div>
                    <Button
                      type="submit"
                      disabled={isCreating || servicesLoading}
                      className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base disabled:opacity-50"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating Template...
                        </>
                      ) : (
                        "Create Template"
                      )}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </div>
          </SidebarInset>
        </div>

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={handleCloseDialog}
          onGoToTemplates={handleGoToTemplates}
          createdTemplate={createdTemplate}
          mainFormData={mainFormData}
        />
      </SidebarProvider>
    </div>
  );
};

export default CreateVoucherTemplatePage;
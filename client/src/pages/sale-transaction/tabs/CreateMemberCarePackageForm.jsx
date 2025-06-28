import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ShoppingCart, Package } from 'lucide-react';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import CarePackageSelect from '@/components/ui/forms/CarePackageSelect';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const CreateMemberCarePackageForm = () => {
  const {
    mainFormData,
    serviceForm,
    employeeOptions,
    serviceOptions,
    packageOptions,
    isCustomizable,
    isLoading,
    error,
    updateMainField,
    resetMainForm,
    updateServiceFormField,
    selectService,
    addServiceToPackage,
    removeServiceFromPackage,
    updateServiceInPackage,
    resetServiceForm,
    fetchEmployeeOptions,
    fetchServiceOptions,
    fetchCarePackageOptions,
    selectCarePackage,
    addMcpToCreationQueue,
    setBypassMode,
  } = useMcpFormStore();

  const { selectedMember, addCartItem } = useTransactionCartStore();

  const [bypassPackage, setBypassPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  useEffect(() => {
    fetchEmployeeOptions();
    fetchServiceOptions();
    fetchCarePackageOptions();
  }, [fetchEmployeeOptions, fetchServiceOptions, fetchCarePackageOptions]);

  useEffect(() => {
    if (!mainFormData.package_name) {
      setSelectedPackageId(null);
    }
  }, [mainFormData.package_name]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedMember) {
      alert('Please select a member first');
      return;
    }

    if (!mainFormData.employee_id) {
      alert('Please select an employee');
      return;
    }

    if (bypassPackage && !mainFormData.package_name) {
      alert('Please enter a package name');
      return;
    }

    if (mainFormData.services.length === 0) {
      alert('Please add at least one service');
      return;
    }

    const mcpId = crypto.randomUUID();

    const cartPackageData = {
      id: mcpId,
      ...mainFormData,
      name: mainFormData.package_name,
      price: mainFormData.package_price,
      description: mainFormData.package_remarks,
      member_id: selectedMember.id,
      is_custom: bypassPackage,
      template_package_id: selectedPackageId,
    };

    addCartItem({
      id: mcpId,
      type: 'package',
      data: cartPackageData,
    });

    addMcpToCreationQueue(cartPackageData);

    alert('Member care package added to cart successfully!');
    resetMainForm();
    setSelectedPackageId(null);
    setBypassPackage(false);
  };

  const handleBypassToggle = (checked) => {
    setBypassPackage(checked);
    setBypassMode(checked);

    if (checked) {
      if (mainFormData.package_name && mainFormData.services.length > 0) {
        const keepTemplate = confirm(
          'You have a template selected. Would you like to keep its services as a starting point for your custom package?'
        );

        if (!keepTemplate) {
          resetMainForm();
          setSelectedPackageId(null);
        }
      }
    } else {
      if (!mainFormData.package_name) {
        resetMainForm();
        setSelectedPackageId(null);
      }
    }
  };

  const handlePackageSelect = (pkg) => {
    if (pkg) {
      setSelectedPackageId(pkg.id);
      selectCarePackage(pkg);
    } else {
      resetMainForm();
      setSelectedPackageId(null);
    }
  };

  return (
    <div className='space-y-6'>
      {/* member selection */}
      {!selectedMember && (
        <Card className='border-orange-200 bg-orange-50'>
          <CardContent className='pt-4'>
            <p className='text-orange-800 text-sm'>Please select a member first before creating a care package.</p>
          </CardContent>
        </Card>
      )}

      {selectedMember && (
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='pt-4'>
            <p className='text-green-800 text-sm'>
              Creating care package for: <strong>{selectedMember.name}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* package configuration */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Package className='h-5 w-5' />
              <span>Care Package Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Switch id='bypass-package' checked={bypassPackage} onCheckedChange={handleBypassToggle} />
              <Label htmlFor='bypass-package' className='text-sm font-medium text-gray-700'>
                Create Custom Care Package (Bypass Template)
              </Label>
            </div>

            <div className='space-y-4'>
              <div className='space-y-1'>
                <CarePackageSelect
                  label={`Care Package Template ${bypassPackage ? '(Optional)' : ''}`}
                  value={selectedPackageId}
                  onSelect={handlePackageSelect}
                  options={packageOptions}
                  isLoading={isLoading}
                  error={error}
                />
                <p className='text-xs text-gray-500'>
                  {bypassPackage
                    ? 'You can still select a template for reference or as a starting point'
                    : 'Select a template to use its predefined services and pricing'}
                </p>
              </div>

              {/* show selected package info */}
              {mainFormData.package_name && (
                <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <h4 className='font-medium text-blue-900'>
                        {bypassPackage ? 'Reference Template:' : 'Selected Template:'} {mainFormData.package_name}
                      </h4>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handlePackageSelect(null)}
                        className='text-blue-600 hover:text-blue-700'
                      >
                        Clear
                      </Button>
                    </div>
                    {mainFormData.package_remarks && (
                      <p className='text-sm text-blue-700'>{mainFormData.package_remarks}</p>
                    )}
                    <div className='text-sm text-blue-600'>Customizable: {isCustomizable ? 'Yes' : 'No'}</div>
                    {bypassPackage && (
                      <div className='text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200'>
                        Template loaded for reference. You can modify services freely in bypass mode.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* custom package name (only in bypass mode) */}
              {bypassPackage && (
                <div className='space-y-1'>
                  <Label htmlFor='package_name' className='text-sm font-medium text-gray-700'>
                    Custom Care Package Name *
                  </Label>
                  <Input
                    id='package_name'
                    placeholder='Enter custom care package name'
                    value={mainFormData.package_name || ''}
                    onChange={(e) => updateMainField('package_name', e.target.value)}
                    className='h-9'
                  />
                  <p className='text-xs text-gray-500'>This will be the name of your custom care package</p>
                </div>
              )}
            </div>

            {/* services section */}
            <ServicesSection
              mainFormData={mainFormData}
              serviceForm={serviceForm}
              serviceOptions={serviceOptions}
              isLoading={isLoading}
              isCustomizable={isCustomizable}
              bypassPackage={bypassPackage}
              updateServiceFormField={updateServiceFormField}
              selectService={selectService}
              addServiceToPackage={addServiceToPackage}
              removeServiceFromPackage={removeServiceFromPackage}
              updateServiceInPackage={updateServiceInPackage}
              resetServiceForm={resetServiceForm}
            />
          </CardContent>
        </Card>

        {/* employee selection */}
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <EmployeeSelect
                  name='employee_id'
                  label='Created By *'
                  value={mainFormData.employee_id}
                  onChange={(employeeId) => updateMainField('employee_id', employeeId)}
                  options={employeeOptions}
                  errors={{}}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='created_at' className='text-sm font-medium pb-1 text-gray-700'>
                  Creation date & time *
                </Label>
                <div></div>
                <Input
                  type='datetime-local'
                  id='created_at'
                  onChange={(e) => {
                    updateMainField('created_at', e.target.value);
                    updateMainField('updated_at', e.target.value);
                  }}
                  step='1'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='package_remarks' className='text-sm font-medium text-gray-700'>
                Package Remarks
              </Label>
              <Textarea
                id='package_remarks'
                placeholder='Enter any additional remarks for this care package'
                value={mainFormData.package_remarks || ''}
                onChange={(e) => updateMainField('package_remarks', e.target.value)}
                rows={2}
                className='min-h-[60px] w-full'
              />
            </div>

            {/* package summary */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-1'>
                  <Label className='text-sm font-medium text-gray-700'>Total Services</Label>
                  <div className='text-lg font-semibold'>{mainFormData.services.length}</div>
                </div>
                <div className='space-y-1'>
                  <Label className='text-sm font-medium text-gray-700'>Total Amount</Label>
                  <div className='text-lg font-semibold text-green-600'>
                    ${(mainFormData.package_price || 0).toFixed(2)}
                  </div>
                </div>
                <div className='space-y-1'>
                  <Label className='text-sm font-medium text-gray-700'>Customizable</Label>
                  <div className='text-lg font-semibold'>{isCustomizable ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* action buttons */}
        <div className='flex justify-between pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              resetMainForm();
              setSelectedPackageId(null);
              setBypassPackage(false);
            }}
            className='px-6 py-2'
          >
            Reset Form
          </Button>

          <Button
            type='submit'
            disabled={!selectedMember || mainFormData.services.length === 0 || !mainFormData.employee_id}
            className='px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50'
          >
            <ShoppingCart className='h-4 w-4 mr-2' />
            Add to Cart
          </Button>
        </div>
      </form>

      {/* error display */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-4'>
            <p className='text-red-800 text-sm'>{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// services section component
const ServicesSection = ({
  mainFormData,
  serviceForm,
  serviceOptions,
  isLoading,
  isCustomizable,
  bypassPackage,
  updateServiceFormField,
  selectService,
  addServiceToPackage,
  removeServiceFromPackage,
  updateServiceInPackage,
  resetServiceForm,
}) => {
  const canModifyServices = bypassPackage || isCustomizable;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium text-gray-700'>Care Package Services</Label>
      </div>

      {/* Service Addition Form */}
      {canModifyServices && (
        <Card className='border-gray-200'>
          <CardContent className='p-4 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='space-y-1'>
                <Label className='text-sm font-medium text-gray-700'>Service</Label>
                <ServiceSelect
                  name='service_select'
                  label=''
                  value={serviceForm.id}
                  onChange={() => {}}
                  onSelectFullDetails={selectService}
                  options={serviceOptions}
                  disabled={isLoading}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-sm font-medium text-gray-700'>Quantity</Label>
                <Input
                  type='number'
                  min='1'
                  value={serviceForm.quantity}
                  onChange={(e) => updateServiceFormField('quantity', parseInt(e.target.value) || 1)}
                  className='h-9'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-sm font-medium text-gray-700'>Price</Label>
                <Input
                  type='number'
                  step='0.01'
                  value={serviceForm.price}
                  onChange={(e) => updateServiceFormField('price', parseFloat(e.target.value) || 0)}
                  className='h-9'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-sm font-medium text-gray-700'>Discount</Label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  max='1'
                  value={serviceForm.discount}
                  onChange={(e) => updateServiceFormField('discount', parseFloat(e.target.value) || 1)}
                  className='h-9'
                />
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <div className='text-sm text-gray-600'>Final Price: ${(serviceForm.finalPrice || 0).toFixed(2)}</div>
              <div className='flex space-x-2'>
                <Button
                  type='button'
                  onClick={addServiceToPackage}
                  disabled={!serviceForm.id || !serviceForm.name}
                  size='sm'
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Add Service
                </Button>
                <Button type='button' variant='outline' onClick={resetServiceForm} size='sm'>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* services list */}
      {mainFormData.services.length > 0 && (
        <div className='space-y-2'>
          {mainFormData.services.map((service, index) => (
            <ServiceRow
              key={index}
              service={service}
              index={index}
              canModify={canModifyServices}
              onUpdate={updateServiceInPackage}
              onRemove={removeServiceFromPackage}
            />
          ))}
        </div>
      )}

      {mainFormData.services.length === 0 && (
        <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200'>
          <Package className='h-12 w-12 mx-auto mb-2 text-gray-400' />
          <p className='text-sm'>No services added yet</p>
          <p className='text-xs'>
            Add services {canModifyServices ? 'using the form above' : 'by selecting a care package'}
          </p>
        </div>
      )}
    </div>
  );
};

// individual service row component
const ServiceRow = ({ service, index, canModify, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(service);

  const handleSave = () => {
    onUpdate(index, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(service);
    setIsEditing(false);
  };

  return (
    <div className='p-3 border rounded-lg bg-white space-y-3'>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Service</Label>
          <div className='text-sm'>{service.name}</div>
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Quantity</Label>
          {isEditing && canModify ? (
            <Input
              type='number'
              min='1'
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
              className='h-8'
            />
          ) : (
            <div className='text-sm'>{service.quantity}</div>
          )}
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Discount</Label>
          {isEditing && canModify ? (
            <Input
              type='number'
              step='0.01'
              min='0'
              max='1'
              value={editData.discount}
              onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 0 })}
              className='h-8'
            />
          ) : (
            <div className='text-sm'>{service.discount.toFixed(2)}</div>
          )}
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Final Price</Label>
          <div className='text-sm font-medium'>${(service.price || 0).toFixed(2)}</div>
        </div>

        <div className='flex space-x-2'>
          {canModify && (
            <>
              {isEditing ? (
                <>
                  <Button size='sm' variant='outline' onClick={handleSave}>
                    Save
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size='sm' variant='outline' onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                onClick={() => onRemove(index)}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMemberCarePackageForm;

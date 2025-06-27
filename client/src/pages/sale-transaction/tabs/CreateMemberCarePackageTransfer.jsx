import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingCart, Trash2, Package } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import CarePackageSelect from '@/components/ui/forms/CarePackageSelect';

const CreateMemberCarePackageTransfer = () => {
  const { selectedMember, addCartItem } = useTransactionCartStore();
  const {
    mainFormData,
    serviceForm,
    serviceOptions,
    employeeOptions,
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
    fetchServiceOptions,
    fetchEmployeeOptions,
    fetchCarePackageOptions,
    selectCarePackage,
    addMcpToTransferQueue,
    fetchMemberCarePackageOptionsByMember,
    memberCarePackageOptions,
    mcpTransferQueue,
  } = useMcpFormStore();

  const [sourceMcpId, setSourceMcpId] = useState('');
  const [destinationMcpId, setDestinationMcpId] = useState('');
  const [isNewDestination, setIsNewDestination] = useState(false);
  const [amount, setAmount] = useState('');
  const [bypassPackage, setBypassPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberCarePackageOptionsByMember(selectedMember.id);
      fetchServiceOptions();
      fetchEmployeeOptions();
      fetchCarePackageOptions();
    }
  }, [
    selectedMember,
    fetchMemberCarePackageOptionsByMember,
    fetchServiceOptions,
    fetchEmployeeOptions,
    fetchCarePackageOptions,
  ]);

  const handlePackageSelect = (pkg) => {
    if (pkg) {
      setSelectedPackageId(pkg.id);
      selectCarePackage(pkg);
    } else {
      resetMainForm();
      setSelectedPackageId(null);
    }
  };

  const handleBypassToggle = (checked) => {
    setBypassPackage(checked);
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

  const handleAddToCart = () => {
    const showMessage = (message) => {
      console.warn(message);
    };

    if (!sourceMcpId) {
      showMessage('Please select a source package.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showMessage('Please enter a valid positive amount to transfer.');
      return;
    }

    const sourcePkg = memberCarePackageOptions.find((p) => p.value === sourceMcpId);
    if (!sourcePkg) {
      showMessage('Source package could not be found.');
      return;
    }

    const alreadyQueuedAmount = mcpTransferQueue
      .filter((item) => item.mcp_id1 === sourceMcpId)
      .reduce((sum, item) => sum + item.amount, 0);

    const availableBalance = sourcePkg.balance - alreadyQueuedAmount;

    if (parsedAmount > availableBalance) {
      showMessage(
        `Transfer amount of $${parsedAmount.toFixed(2)} exceeds remaining balance of $${availableBalance.toFixed(2)}.`
      );
      return;
    }

    let destPkgLabel = '';
    let transferData = { mcp_id1: sourceMcpId, amount: parsedAmount };

    if (isNewDestination) {
      if (bypassPackage && !mainFormData.package_name) {
        showMessage('Please provide a name for the new package.');
        return;
      }
      if (mainFormData.services.length === 0) {
        showMessage('Please add at least one service to the new package.');
        return;
      }
      if (!mainFormData.employee_id) {
        showMessage('Please select an employee creating the package.');
        return;
      }
      transferData.newDestinationData = {
        ...mainFormData,
        member_id: selectedMember.id,
        is_custom: bypassPackage,
        template_package_id: selectedPackageId,
      };
      destPkgLabel = `${mainFormData.package_name} (New)`;
    } else {
      if (!destinationMcpId) {
        showMessage('Please select a destination package.');
        return;
      }
      if (sourceMcpId === destinationMcpId) {
        showMessage('Source and destination packages cannot be the same.');
        return;
      }
      transferData.mcp_id2 = destinationMcpId;
      destPkgLabel = memberCarePackageOptions.find((p) => p.value === destinationMcpId)?.label || 'Unknown';
    }

    const newItemInQueue = addMcpToTransferQueue(transferData);

    if (newItemInQueue) {
      const cartItem = {
        id: newItemInQueue.id,
        type: 'transfer',
        data: {
          name: `MCP Transfer`,
          amount: parseFloat(amount),
          description: `From: ${sourcePkg.label.split(' (')[0]} To: ${
            destPkgLabel.split(' (')[0]
          } for $${parsedAmount.toFixed(2)}`,
          queueItem: newItemInQueue,
        },
      };
      addCartItem(cartItem);

      setSourceMcpId('');
      setDestinationMcpId('');
      setIsNewDestination(false);
      setAmount('');
      resetMainForm();
      setBypassPackage(false);
      setSelectedPackageId(null);
    }
  };

  const sourceOptions = useMemo(() => {
    const queuedAmounts = mcpTransferQueue.reduce((acc, item) => {
      acc[item.mcp_id1] = (acc[item.mcp_id1] || 0) + item.amount;
      return acc;
    }, {});

    return memberCarePackageOptions.filter((opt) => {
      const queuedAmount = queuedAmounts[opt.value] || 0;
      return opt.balance > queuedAmount;
    });
  }, [memberCarePackageOptions, mcpTransferQueue]);

  const remainingBalance = useMemo(() => {
    if (!sourceMcpId) return 0;

    const sourcePackage = memberCarePackageOptions.find((opt) => opt.value === sourceMcpId);
    if (!sourcePackage) return 0;

    const queuedAmount = mcpTransferQueue
      .filter((item) => item.mcp_id1 === sourceMcpId)
      .reduce((sum, item) => sum + item.amount, 0);

    return sourcePackage.balance - queuedAmount;
  }, [sourceMcpId, memberCarePackageOptions, mcpTransferQueue]);

  if (!selectedMember) {
    return (
      <Card className='border-orange-200 bg-orange-50 rounded-lg'>
        <CardContent className='pt-4'>
          <p className='text-orange-800 text-sm'>Please select a member first to manage MCP transfers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card className='rounded-lg'>
        <CardHeader>
          <CardTitle>Transfer MCP Balance</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
            <div className='space-y-2'>
              <Label>Source Package</Label>
              <Combobox
                options={sourceOptions}
                value={sourceMcpId}
                onChange={(value) => {
                  setSourceMcpId(value);
                  setAmount('');
                }}
                placeholder='Select source package...'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Destination Package</Label>
                <div className='flex items-center space-x-2'>
                  <Label htmlFor='new-destination' className='text-sm'>
                    Create New
                  </Label>
                  <Switch id='new-destination' checked={isNewDestination} onCheckedChange={setIsNewDestination} />
                </div>
              </div>
              {!isNewDestination ? (
                <Combobox
                  options={memberCarePackageOptions.filter((p) => p.value !== sourceMcpId)}
                  value={destinationMcpId}
                  onChange={setDestinationMcpId}
                  placeholder='Select destination package...'
                />
              ) : (
                <div className='flex items-center justify-center h-10 px-3 text-sm text-slate-500 bg-slate-100 border rounded-md'>
                  New package details will appear below
                </div>
              )}
            </div>
          </div>

          {sourceMcpId && (
            <div className='space-y-2 pt-2'>
              <Label htmlFor='transfer_amount'>Amount to Transfer *</Label>
              <Input
                id='transfer_amount'
                type='number'
                placeholder={`Max available: $${remainingBalance.toFixed(2)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={remainingBalance}
                className='rounded-md'
              />
            </div>
          )}

          {isNewDestination && (
            <div className='space-y-4 pt-4 border-t'>
              <Card className='rounded-lg'>
                <CardHeader>
                  <CardTitle>New Destination Package Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center space-x-2'>
                    <Switch id='bypass-package-transfer' checked={bypassPackage} onCheckedChange={handleBypassToggle} />
                    <Label htmlFor='bypass-package-transfer' className='text-sm font-medium text-gray-700'>
                      Create Custom Care Package (Bypass Template)
                    </Label>
                  </div>
                  <CarePackageSelect
                    label={`Care Package Template ${bypassPackage ? '(Optional)' : ''}`}
                    value={selectedPackageId}
                    onSelect={handlePackageSelect}
                    options={packageOptions}
                    isLoading={isLoading}
                    error={error}
                  />
                  {bypassPackage && (
                    <div className='space-y-1'>
                      <Label htmlFor='package_name'>Custom Care Package Name *</Label>
                      <Input
                        id='package_name'
                        placeholder='Enter custom care package name'
                        value={mainFormData.package_name || ''}
                        onChange={(e) => updateMainField('package_name', e.target.value)}
                        className='rounded-md'
                      />
                    </div>
                  )}
                  <div className='space-y-1'>
                    <Label htmlFor='package_remarks'>Package Remarks</Label>
                    <Textarea
                      id='package_remarks'
                      placeholder='Enter any additional remarks'
                      value={mainFormData.package_remarks || ''}
                      onChange={(e) => updateMainField('package_remarks', e.target.value)}
                      rows={2}
                      className='rounded-md'
                    />
                  </div>
                </CardContent>
              </Card>
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
              <Card className='rounded-lg'>
                <CardContent className='pt-6'>
                  <EmployeeSelect
                    name='employee_id'
                    label='Created By *'
                    value={mainFormData.employee_id}
                    onChange={(employeeId) => updateMainField('employee_id', employeeId)}
                    options={employeeOptions}
                    errors={{}}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <div className='flex justify-end pt-4 border-t'>
            <Button onClick={handleAddToCart} className='rounded-md'>
              <ShoppingCart className='w-4 h-4 mr-2' />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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

      {canModifyServices && (
        <Card className='border-gray-200 rounded-lg'>
          <CardContent className='p-4 space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
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
                  className='h-9 rounded-md'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-sm font-medium text-gray-700'>Price</Label>
                <Input
                  type='number'
                  step='0.01'
                  value={serviceForm.price}
                  onChange={(e) => updateServiceFormField('price', parseFloat(e.target.value) || 0)}
                  className='h-9 rounded-md'
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
                  className='h-9 rounded-md'
                />
              </div>
            </div>

            <div className='flex flex-col sm:flex-row justify-between items-center pt-2 gap-2'>
              <div className='text-sm text-gray-600'>Final Price: ${(serviceForm.finalPrice || 0).toFixed(2)}</div>
              <div className='flex space-x-2'>
                <Button
                  type='button'
                  onClick={addServiceToPackage}
                  disabled={!serviceForm.id || !serviceForm.name}
                  size='sm'
                  className='rounded-md'
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Add Service
                </Button>
                <Button type='button' variant='outline' onClick={resetServiceForm} size='sm' className='rounded-md'>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

const ServiceRow = ({ service, index, canModify, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(service);

  useEffect(() => {
    setEditData(service);
  }, [service]);

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
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-3 items-center'>
        <div className='space-y-1 md:col-span-1'>
          <Label className='text-sm font-medium text-gray-700'>Service</Label>
          <div className='text-sm font-semibold truncate max-w-full'>{service.name}</div>
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Quantity</Label>
          {isEditing && canModify ? (
            <Input
              type='number'
              min='1'
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
              className='h-8 w-full rounded-md'
            />
          ) : (
            <div className='text-sm'>{service.quantity}</div>
          )}
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Price</Label>
          {isEditing && canModify ? (
            <Input
              type='number'
              step='0.01'
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
              className='h-8 w-full rounded-md'
            />
          ) : (
            <div className='text-sm'>${service.price.toFixed(2)}</div>
          )}
        </div>

        <div className='space-y-1'>
          <Label className='text-sm font-medium text-gray-700'>Final Price</Label>
          <div className='text-sm font-medium'>${(service.finalPrice || 0).toFixed(2)}</div>
        </div>

        <div className='flex space-x-2 pt-0 md:pt-6 items-center justify-end md:justify-start'>
          {canModify && (
            <>
              {isEditing ? (
                <>
                  <Button size='sm' variant='outline' onClick={handleSave} className='rounded-md'>
                    Save
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleCancel} className='rounded-md'>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size='sm' variant='outline' onClick={() => setIsEditing(true)} className='rounded-md'>
                  Edit
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                onClick={() => onRemove(index)}
                className='text-red-600 hover:text-red-700 rounded-md'
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

export default CreateMemberCarePackageTransfer;

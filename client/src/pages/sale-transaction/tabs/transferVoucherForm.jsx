import React, { useEffect, useState } from 'react';
import { IoAddOutline } from 'react-icons/io5';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import useTransferVoucherStore from '@/stores/useTransferVoucherStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import useSelectedMemberStore from '@/stores/useSelectedMemberStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

const TransferVoucherForm = () => {
  const currentMember = useSelectedMemberStore((state) => state.currentMember);
  const { selectedMember } = useTransactionCartStore();

  const {
    voucherTemplates,
    selectedVoucherName,
    memberVouchers,
    bypassTemplate,
    price,
    foc,
    oldVouchers,
    fetchVoucherTemplates,
    fetchMemberVoucher,
    setSelectedVoucherName,
    toggleBypassTemplate,
    setPrice,
    setFoc,
    setOldVouchers,
    setSelectedMember,
    setTransferFormData,
    setTopUpBalance,
  } = useTransferVoucherStore();

  const { addCartItem } = useTransactionCartStore();
  const { employees, fetchDropdownEmployees } = useEmployeeStore();

  const [customVoucherName, setCustomVoucherName] = useState('');
  const [hasCustomPrice, setHasCustomPrice] = useState(false);
  const [hasCustomFoc, setHasCustomFoc] = useState(false);
  const [createdBy, setCreatedBy] = useState('');
  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0); // truncate seconds/ms for input compatibility
    return now.toISOString().slice(0, 16); // for datetime-local input
  });

  const [remarks, setRemarks] = useState('');
    const [validationErrors, setValidationErrors] = useState({});


  // New state for service details when bypass is enabled
  const [serviceDetails, setServiceDetails] = useState([]);

  const isFocGreaterThanPrice = parseFloat(foc || '0') > parseFloat(price || '0');

  useEffect(() => {
    fetchVoucherTemplates?.();
    fetchDropdownEmployees?.();
  }, []);

  useEffect(() => {
    if (currentMember?.name) {
      fetchMemberVoucher(currentMember.name);
      setSelectedMember({ name: currentMember.name });
    }
  }, [currentMember]);

  useEffect(() => {
    if (!bypassTemplate && selectedVoucherName) {
      const template = voucherTemplates.find((v) => v.voucher_template_name === selectedVoucherName);
      if (template) {
        if (!hasCustomPrice) setPrice(template.price || 0);
        if (!hasCustomFoc) setFoc(template.foc || 0);
      }
    }
  }, [selectedVoucherName, voucherTemplates, bypassTemplate, hasCustomPrice, hasCustomFoc]);

  useEffect(() => {
    if (!createdBy && employees?.length > 0) {
      setCreatedBy(employees[0].id);
    }
  }, [employees]);

  useEffect(() => {
    setHasCustomPrice(false);
    setHasCustomFoc(false);
    // Clear service details when toggling bypass
    if (!bypassTemplate) {
      setServiceDetails([]);
    }
  }, [bypassTemplate]);


  const validateForm = () => {
    const errors = {};

    // Validate voucher name
    const voucherNameToUse = bypassTemplate ? customVoucherName : selectedVoucherName;
    if (!voucherNameToUse || voucherNameToUse.trim() === '') {
      errors.voucherName = 'Voucher name is required';
    }

    // Validate price
    if (!price || price === '' || parseFloat(price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    // Validate FOC
    if (foc && parseFloat(foc) < 0) {
      errors.foc = 'FOC cannot be negative';
    }

    if (parseFloat(foc || '0') > parseFloat(price || '0')) {
      errors.foc = 'FOC cannot be greater than price';
    }

    // Validate old vouchers
    if (oldVouchers.length === 0 || oldVouchers.every(v => !v || v.trim() === '')) {
      errors.oldVouchers = 'At least one old voucher must be selected';
    }

    // Check for duplicate old vouchers
    const nonEmptyOldVouchers = oldVouchers.filter(v => v && v.trim() !== '');
    if (nonEmptyOldVouchers.length !== new Set(nonEmptyOldVouchers).size) {
      errors.oldVouchers = 'Duplicate old vouchers are not allowed';
    }

    // Validate service details when bypass is enabled
    if (bypassTemplate) {
      if (serviceDetails.length === 0) {
        errors.serviceDetails = 'At least one service detail must be added when bypass template is enabled';
      } else {
        // Validate each service detail
        const serviceErrors = {};
        serviceDetails.forEach((detail, index) => {
          const detailErrors = {};

          if (!detail.name || detail.name.trim() === '') {
            detailErrors.name = 'Service name is required';
          }

          if (!detail.duration || detail.duration <= 0) {
            detailErrors.duration = 'Duration must be greater than 0';
          }

          if (!detail.price || detail.price <= 0) {
            detailErrors.price = 'Price must be greater than 0';
          }

          if (detail.discount < 0 || detail.discount > 100) {
            detailErrors.discount = 'Discount must be between 0 and 100';
          }

          if (Object.keys(detailErrors).length > 0) {
            serviceErrors[index] = detailErrors;
          }
        });

        if (Object.keys(serviceErrors).length > 0) {
          errors.serviceErrors = serviceErrors;
        }
      }
    }

    // Validate created by
    if (!createdBy) {
      errors.createdBy = 'Created by is required';
    }

    // Validate created at
    if (!createdAt) {
      errors.createdAt = 'Created at is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  // Service details management functions
  const addServiceDetail = () => {
    const newDetail = {
      id: Date.now(),
      service_id: '',
      name: '',
      duration: '',
      price: 0,
      discount: 0,
      final_price: 0,
    };
    setServiceDetails([...serviceDetails, newDetail]);

    // Clear validation errors when adding new service
    if (validationErrors.serviceDetails) {
      const newErrors = { ...validationErrors };
      delete newErrors.serviceDetails;
      setValidationErrors(newErrors);
    }
  };

  const updateServiceDetail = (id, field, value) => {
    setServiceDetails(details =>
      details.map(detail => {
        if (detail.id === id) {
          const updated = { ...detail, [field]: value };

          // Recalculate final price when price or discount changes
          if (field === 'price' || field === 'discount') {
            const price = field === 'price' ? value : detail.price;
            const discount = field === 'discount' ? value : detail.discount;
            updated.final_price = price - (price * discount / 100);
          }

          return updated;
        }
        return detail;
      })
    );

    if (validationErrors.serviceErrors) {
      const serviceIndex = serviceDetails.findIndex(d => d.id === id);
      if (serviceIndex !== -1 && validationErrors.serviceErrors[serviceIndex]) {
        const newErrors = { ...validationErrors };
        const newServiceErrors = { ...newErrors.serviceErrors };
        delete newServiceErrors[serviceIndex][field];

        if (Object.keys(newServiceErrors[serviceIndex]).length === 0) {
          delete newServiceErrors[serviceIndex];
        }

        if (Object.keys(newServiceErrors).length === 0) {
          delete newErrors.serviceErrors;
        } else {
          newErrors.serviceErrors = newServiceErrors;
        }

        setValidationErrors(newErrors);
      }
    }
  };

  const removeServiceDetail = (id) => {
    setServiceDetails(details => details.filter(detail => detail.id !== id));
  };

  const handleServiceSelect = (detailId, serviceData) => {
    updateServiceDetail(detailId, 'service_id', serviceData.id);
    updateServiceDetail(detailId, 'name', serviceData.service_name);
    updateServiceDetail(detailId, 'price', serviceData.price);
    updateServiceDetail(detailId, 'duration', serviceData.duration);
    // Recalculate final price
    const detail = serviceDetails.find(d => d.id === detailId);
    if (detail) {
      const finalPrice = serviceData.price - (serviceData.price * (detail.discount || 0) / 100);
      updateServiceDetail(detailId, 'final_price', finalPrice);
    }
  };

  // Calculate total old voucher balance excluding FOC amounts
  const totalOldBalance = oldVouchers.reduce((acc, voucherName) => {
    const voucher = memberVouchers.find(
      (v) => v.member_voucher_name.trim().toLowerCase() === voucherName.trim().toLowerCase()
    );
    if (!voucher) return acc;
    const nonFocBalance = Number(voucher.current_balance) - (Number(voucher.free_of_charge) || 0);
    return acc + (nonFocBalance > 0 ? nonFocBalance : 0);
  }, 0);

  // Calculate top-up balance based on price and totalOldBalance
  const topUpBalance = Math.max(0, Number(price) - totalOldBalance);

  useEffect(() => {
    const memberName = currentMember?.name;
    const voucherNameToUse = bypassTemplate ? customVoucherName : selectedVoucherName;

    if (!memberName || !voucherNameToUse) {
      setTransferFormData(null);
      return;
    }

    const oldVoucherDetails = oldVouchers
      .map((name) =>
        memberVouchers.find((v) => v.member_voucher_name.trim().toLowerCase() === name.trim().toLowerCase())
      )
      .filter(Boolean)
      .map((v) => ({
        voucher_id: v.id,
        member_voucher_name: v.member_voucher_name,
        balance_to_transfer: Number(v.current_balance) - (Number(v.free_of_charge) || 0),
      }));

    const payload = {
      member_name: memberName,
      voucher_template_name: voucherNameToUse,
      price: Number(price),
      foc: Number(foc),
      old_voucher_names: oldVouchers,
      old_voucher_details: oldVoucherDetails,
      is_bypass: bypassTemplate,
      created_by: createdBy,
      created_at: createdAt,
      remarks: remarks.trim() === '' ? 'NA' : remarks,
      top_up_balance: topUpBalance,
      service_details: bypassTemplate ? serviceDetails : [], // Include service details
    };

    setTransferFormData(payload);
  }, [
    currentMember,
    selectedVoucherName,
    price,
    foc,
    oldVouchers,
    memberVouchers,
    bypassTemplate,
    customVoucherName,
    createdBy,
    createdAt,
    remarks,
    serviceDetails, // Add serviceDetails to dependencies
  ]);

  const handleDecimalInput = (e, setter, setCustomFlag, isFoc = false) => {
    const value = e.target.value;
    if (/^\d*(\.\d{0,2})?$/.test(value)) {
      const numericValue = parseFloat(value || '0');
      const currentPrice = parseFloat(price || '0');

      if (isFoc && numericValue > currentPrice) {
        alert('FOC cannot be greater than the price.');
        return;
      }

      setCustomFlag(true);
      setter(value);
    }
  };

  const isBalanceGreater = totalOldBalance > Number(price);

  const handleAddToCart = () => {

    const isValid = validateForm();
    if (!isValid) {
      alert('Please fix the form errors before adding to cart.');
      return;
    }


    const voucherNameToUse = bypassTemplate ? customVoucherName : selectedVoucherName;
    if (!voucherNameToUse || !price) return;

    const transferAmount = totalOldBalance;

    const cartPayload = {
      id: `transfer-${Date.now()}`,
      type: 'transferMV',
      data: {
        name: voucherNameToUse,
        amount: Number(price),
        description: `Transferred from: ${oldVouchers.join(', ')}`,
        transferAmount: transferAmount,
        serviceDetails: bypassTemplate ? serviceDetails : [], // Include service details in cart
      },
    };

    addCartItem(cartPayload);
  };

  const handleInputChange = (field, value) => {
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };
  return (
    <div className='p-0'>
      {!selectedMember && (
        <Card className='border-orange-200 bg-orange-50'>
          <CardContent className='py-2'>
            <p className='text-orange-800 text-sm'>
              Please select a member first before transferring member voucher balances.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedMember && (
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='py-2'>
            <p className='text-green-800 text-sm'>
              Transferring member voucher balance for: <strong>{selectedMember.name}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      <div className='p-3 bg-white shadow rounded-lg h-[700px] overflow-y-auto'>
        <h2 className='text-xl font-semibold mb-4'>Transfer Voucher</h2>

        {/* New Voucher Name */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>New Voucher Name</Label>
          {bypassTemplate ? (
            <Input
              type='text'
              className='h-9 bg-white'
              placeholder='Enter custom voucher name'
              value={customVoucherName}
              onChange={(e) => {
                setCustomVoucherName(e.target.value);
                handleInputChange('voucherName');
              }

              }
            />
          ) : (
            <select
              className='w-full border px-3 py-2 rounded h-9 bg-white'
              value={selectedVoucherName}
              onChange={(e) => {
                setSelectedVoucherName(e.target.value);
                handleInputChange('voucherName');
              }
              }
            >
              <option value=''>Select a voucher template</option>
              {voucherTemplates.map((v) => (
                <option key={v.id} value={v.voucher_template_name}>
                  {v.voucher_template_name}
                </option>
              ))}
            </select>
          )}

          {validationErrors.voucherName && (
            <p className='text-red-600 text-sm mt-1'>{validationErrors.voucherName}</p>
          )}
        </div>

        {/* Price and Bypass */}
        <div className='mb-6 flex flex-col md:flex-row md:items-end gap-4'>
          <div className='flex-1'>
            <Label className='text-sm font-medium text-gray-700 mb-1'>Price of New Voucher</Label>
            <Input
              type='text'
              className='h-9 bg-white'
              value={price}
              onChange={(e) => handleDecimalInput(e, setPrice, setHasCustomPrice)}
              placeholder={bypassTemplate ? 'Enter price' : 'Auto-filled unless changed'}
            />
            {validationErrors.price && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
            )}

          </div>
          <div className='flex flex-col items-center'>
            <Label className='text-sm font-medium text-gray-700 mb-1 whitespace-nowrap'>Bypass Template</Label>
            <label className='inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='sr-only peer'
                checked={bypassTemplate}
                onChange={toggleBypassTemplate}
              />


              <div className='w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 relative'>
                <div className='w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>
        </div>

        {/* FOC */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>FOC</Label>
          <Input
            type='text'
            className='h-9 bg-white'
            value={foc}
            onChange={(e) => handleDecimalInput(e, setFoc, setHasCustomFoc, true)}
            placeholder={bypassTemplate ? 'Enter FOC' : 'Auto-filled unless changed'}
          />
          {validationErrors.foc && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.foc}</p>
          )}

        </div>
        {parseFloat(foc || '0') > parseFloat(price || '0') && (
          <div className='mb-4 p-2 bg-red-100 text-red-700 rounded'>⚠️ FOC cannot be more than price.</div>
        )}

        {/* Service Details Section - Only show when bypass is enabled */}
        {bypassTemplate && (
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-3'>
              <Label className='text-sm font-medium text-gray-700'>Service Details</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addServiceDetail}
                className='h-8'
              >
                <Plus className='h-4 w-4 mr-1' />
                Add Details
              </Button>
            </div>

            {serviceDetails.length > 0 && (
              <div className='space-y-2'>
                {serviceDetails.map((detail, index) => (
                  <ServiceDetailRow
                    key={detail.id}
                    detail={detail}
                    index={index}
                    onUpdateDetail={updateServiceDetail}
                    onRemoveDetail={removeServiceDetail}
                    onServiceSelect={handleServiceSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remarks */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>Remarks</Label>
          <Input
            type='text'
            className='h-9 bg-white'
            placeholder='Enter remarks'
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Old Vouchers */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>Old Voucher(s) [INCLUDE FOC]</Label>
          {oldVouchers.map((voucherName, index) => (
            <div key={index} className='mb-2 flex items-center gap-2'>
              <select
                className='border px-3 py-2 rounded w-full h-9 bg-white'
                value={voucherName}
                onChange={(e) => {
                  const updated = [...oldVouchers];
                  updated[index] = e.target.value;
                  setOldVouchers(updated);
                  handleInputChange('oldVouchers');

                }}
              >
                <option value=''>Select old voucher</option>
                {memberVouchers
                  .filter(
                    (mv) => !oldVouchers.includes(mv.member_voucher_name) || mv.member_voucher_name === voucherName
                  )
                  .map((mv) => (
                    <option key={mv.id} value={mv.member_voucher_name}>
                      {mv.member_voucher_name} (Balance: {mv.current_balance})
                    </option>
                  ))}
              </select>
              {index !== 0 && (
                <button
                  type='button'
                  onClick={() => {
                    const updated = oldVouchers.filter((_, i) => i !== index);
                    setOldVouchers(updated);
                  }}
                  className='text-red-500 font-bold text-xl w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded'
                  title='Remove this voucher'
                >
                  &times;
                </button>
              )}
            </div>

          ))}
          {validationErrors.oldVouchers && (
            <p className='text-red-600 text-sm mt-1'>{validationErrors.oldVouchers}</p>
          )}
          <Button
            type='button'
            onClick={() => setOldVouchers([...oldVouchers, ''])}
            variant='outline'
            size='sm'
            className='mt-2 h-9'
          >
            <IoAddOutline className='text-lg mr-2' />
            Add Another Old Voucher
          </Button>
        </div>

        {/* Totals */}
        <div className='mb-4'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>Balance of Old Vouchers (Excluding FOC)</Label>
          <Input
            type='text'
            className='h-9 bg-gray-100'
            value={totalOldBalance}
            readOnly
          />
        </div>

        {isBalanceGreater && (
          <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>
            Warning: Total balance of old vouchers exceeds the price of the new voucher!
          </div>
        )}

        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>To Be Topped Up</Label>
          <Input
            type='text'
            className='h-9 bg-gray-100'
            value={topUpBalance}
            readOnly
          />
        </div>

        {/* Created By */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>Created By</Label>
          <select
            className='w-full border px-3 py-2 rounded h-9 bg-white'
            value={createdBy}
            onChange={(e) => {
              setCreatedBy(Number(e.target.value))
              handleInputChange('createdBy');
            }
            }
          >
            {validationErrors.createdBy && (
              <p className='text-red-600 text-sm mt-1'>{validationErrors.createdBy}</p>
            )}

            <option value=''>Select employee</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_name}
              </option>
            ))}
          </select>
        </div>

        {/* Created At */}
        <div className='mb-6'>
          <Label className='text-sm font-medium text-gray-700 mb-1'>Created At</Label>
          <input
            type='datetime-local'
            className='w-full border px-3 py-2 rounded h-9 bg-white'
            value={createdAt}
            onChange={(e) => {
              setCreatedAt(e.target.value);
              handleInputChange('createdAt');
            }
            }
          />

          {validationErrors.createdAt && (
            <p className='text-red-600 text-sm mt-1'>{validationErrors.createdAt}</p>
          )}

        </div>

        {/* Add to Cart Button */}
        <div className='mt-4 flex justify-end'>
          <Button
            onClick={handleAddToCart}
            disabled={isFocGreaterThanPrice}
            className={`px-6 py-2 h-9 ${isFocGreaterThanPrice ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

// Service Detail Row Component
const ServiceDetailRow = ({ detail, index, onUpdateDetail, onRemoveDetail, onServiceSelect }) => (
  <div className='p-3 border rounded-lg bg-gray-50 space-y-3'>
    {/* Service Selection Row */}
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>Service Name</Label>
        <Input
          placeholder='Enter service name'
          value={detail.name || ''}
          onChange={(e) => onUpdateDetail(detail.id, 'name', e.target.value)}
          className='h-9 bg-white'
        />
      </div>
      <div className='space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>Duration</Label>
        <Input
          type='number'
          placeholder='e.g., 60 min'
          value={detail.duration || ''}
          onChange={(e) => onUpdateDetail(detail.id, 'duration', e.target.value)}
          className='h-9 bg-white'
        />
      </div>
      <div className='space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>Price</Label>
        <Input
          type='number'
          step='0.01'
          placeholder='0.00'
          value={detail.price || 0}
          onChange={(e) => onUpdateDetail(detail.id, 'price', parseFloat(e.target.value) || 0)}
          className='h-9 bg-white'
        />
      </div>
    </div>

    {/* Details Row */}
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>Discount (%)</Label>
        <Input
          type='number'
          step='0.01'
          min='0'
          max='100'
          placeholder='0.00'
          value={detail.discount || 0}
          onChange={(e) => onUpdateDetail(detail.id, 'discount', parseFloat(e.target.value) || 0)}
          className='h-9 bg-white'
        />
      </div>
      <div className='space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>Final Price</Label>
        <Input
          type='number'
          step='0.01'
          value={detail.final_price || 0}
          readOnly
          className='h-9 bg-gray-100'
        />
      </div>
      <div className='flex items-end'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onRemoveDetail(detail.id)}
          className='h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  </div>
);

export default TransferVoucherForm;
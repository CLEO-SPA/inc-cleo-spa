import React, { useEffect, useState } from 'react';
import { IoAddOutline } from 'react-icons/io5';
import useTransferVoucherStore from '@/stores/useTransferVoucherStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import useSelectedMemberStore from '@/stores/useSelectedMemberStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

const TransferVoucherForm = () => {
  const currentMember = useSelectedMemberStore((state) => state.currentMember);

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
    getTopUpBalance,
    setSelectedMember,
    setTransferFormData,
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
    // clearCart(); // ❌ DO NOT clear cart anymore
  }, [bypassTemplate]);

  // Calculate total old voucher balance excluding FOC amounts
  const totalOldBalance = oldVouchers.reduce((acc, voucherName) => {
    const voucher = memberVouchers.find(
      (v) => v.member_voucher_name.trim().toLowerCase() === voucherName.trim().toLowerCase()
    );
    if (!voucher) return acc;
    // Assumes voucher.current_balance includes total balance
    // and voucher.foc_balance contains FOC portion, change if property names differ
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
        balance_to_transfer: Number(v.current_balance) - (Number(v.foc_balance) || 0),
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
      remarks: remarks.trim() === '' ? 'NA' : remarks, // <-- this ensures "NA" only if it's empty or whitespace
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
    const voucherNameToUse = bypassTemplate ? customVoucherName : selectedVoucherName;
    if (!voucherNameToUse || !price) return;

    const cartPayload = {
      id: `transfer-${Date.now()}`,
      type: 'transferMV',
      data: {
        name: voucherNameToUse,
        amount: Number(price),
        description: `Transferred from: ${oldVouchers.join(', ')}`,
      },
    };

    addCartItem(cartPayload);
  };

  return (
    <div className='p-0'>
      <div className='p-3 bg-white shadow rounded-lg h-[700px] overflow-y-auto'>
        <h2 className='text-xl font-semibold mb-4'>Transfer Voucher</h2>

        {/* New Voucher Name */}
        <div className='mb-6'>
          <label className='block font-medium mb-1'>New Voucher Name</label>
          {bypassTemplate ? (
            <input
              type='text'
              className='w-full border px-3 py-2 rounded'
              placeholder='Enter custom voucher name'
              value={customVoucherName}
              onChange={(e) => setCustomVoucherName(e.target.value)}
            />
          ) : (
            <select
              className='w-full border px-3 py-2 rounded'
              value={selectedVoucherName}
              onChange={(e) => setSelectedVoucherName(e.target.value)}
            >
              <option value=''>Select a voucher template</option>
              {voucherTemplates.map((v) => (
                <option key={v.id} value={v.voucher_template_name}>
                  {v.voucher_template_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Price and Bypass */}
        <div className='mb-6 flex flex-col md:flex-row md:items-end gap-4'>
          <div className='flex-1'>
            <label className='block font-medium mb-1'>Price of New Voucher</label>
            <input
              type='text'
              className='w-full border px-3 py-2 rounded'
              value={price}
              onChange={(e) => handleDecimalInput(e, setPrice, setHasCustomPrice)}
              placeholder={bypassTemplate ? 'Enter price' : 'Auto-filled unless changed'}
            />
          </div>
          <div className='flex flex-col items-center'>
            <label className='text-sm font-medium mb-1 whitespace-nowrap'>Bypass Template</label>
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
          <label className='block font-medium mb-1'>FOC</label>
          <input
            type='text'
            className='w-full border px-3 py-2 rounded'
            value={foc}
            onChange={(e) => handleDecimalInput(e, setFoc, setHasCustomFoc, true)}
            placeholder={bypassTemplate ? 'Enter FOC' : 'Auto-filled unless changed'}
          />
        </div>
        {parseFloat(foc || '0') > parseFloat(price || '0') && (
          <div className='mb-4 p-2 bg-red-100 text-red-700 rounded'>
            ⚠️ FOC cannot be more than price.
          </div>
        )}

        {/* Remarks */}
        <div className='mb-6'>
          <label className='block font-medium mb-1'>Remarks</label>
          <input
            type='text'
            className='w-full border px-3 py-2 rounded'
            placeholder='Enter remarks'
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Old Vouchers */}
        <div className='mb-6'>
          <label className='block font-medium mb-1'>Old Voucher(s)</label>
          {oldVouchers.map((voucherName, index) => (
            <div key={index} className='mb-2 flex items-center gap-2'>
              <select
                className='border px-3 py-2 rounded w-full'
                value={voucherName}
                onChange={(e) => {
                  const updated = [...oldVouchers];
                  updated[index] = e.target.value;
                  setOldVouchers(updated);
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
                  className='text-red-500 font-bold text-xl'
                  title='Remove this voucher'
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type='button'
            onClick={() => setOldVouchers([...oldVouchers, ''])}
            className='mt-2 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
          >
            <IoAddOutline className='text-lg' />
            Add Another Old Voucher
          </button>
        </div>

        {/* Totals */}
        <div className='mb-4'>
          <label className='block font-medium mb-1'>Balance of Old Vouchers (Excluding FOC)</label>
          <input type='text' className='w-full border px-3 py-2 rounded' value={totalOldBalance} readOnly />
        </div>

        {isBalanceGreater && (
          <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>
            Warning: Total balance of old vouchers exceeds the price of the new voucher!
          </div>
        )}

        <div className='mb-6'>
          <label className='block font-medium mb-1'>To Be Topped Up</label>
          <input type='text' className='w-full border px-3 py-2 rounded' value={topUpBalance} readOnly />
        </div>

        {/* Created By */}
        <div className='mb-6'>
          <label className='block font-medium mb-1'>Created By</label>
          <select
            className='w-full border px-3 py-2 rounded'
            value={createdBy}
            onChange={(e) => setCreatedBy(Number(e.target.value))}
          >
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
          <label className='block font-medium mb-1'>Created At</label>
          <input
            type='datetime-local'
            className='w-full border px-3 py-2 rounded'
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
          />
        </div>

        {/* Add to Cart Button */}
        <div className='mt-4 flex justify-end'>
          <button
            onClick={handleAddToCart}
            disabled={isFocGreaterThanPrice}
            className={`px-6 py-2 rounded transition ${isFocGreaterThanPrice
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferVoucherForm;
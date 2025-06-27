import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';

const CartItemsWithPayment = ({ 
  cartItems, 
  onPricingChange, 
  onEmployeeChange,
  onRemarksChange, 
  onPaymentChange,
  itemEmployees = {},
  itemPricing = {},
  itemRemarks = {}, 
  sectionPayments = {},
  selectedPaymentMethods = {},
  onSelectedPaymentMethodChange
}) => {
  // Get payment methods from store
  const dropdownPaymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
  const loading = usePaymentMethodStore((state) => state.loading);
  const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);

  // Effect to ensure payment methods are loaded
  useEffect(() => {
    if (dropdownPaymentMethods.length === 0 && !loading) {
      fetchDropdownPaymentMethods();
    }
  }, [dropdownPaymentMethods.length, loading, fetchDropdownPaymentMethods]);

  // Debug: Log payment methods when they change
  useEffect(() => {
    console.log('Payment methods from store:', dropdownPaymentMethods);
    if (dropdownPaymentMethods.length > 0) {
      console.log('Sample payment method structure:', dropdownPaymentMethods[0]);
    }
  }, [dropdownPaymentMethods]);

  // Group items by type and create sections
  const groupedItems = {
    'Services': cartItems.filter(item => item.type === 'service'),
    'Products': cartItems.filter(item => item.type === 'product'),
    'Packages': cartItems.filter(item => item.type === 'package'),
    'Vouchers': cartItems.filter(item => item.type === 'member-voucher'),
    'TransferMCP': cartItems.filter(item => item.type === 'transferMCP' || (item.type === 'transfer' && item.data?.queueItem?.mcp_id1)),
    'TransferMV': cartItems.filter(item => item.type === 'transferMV'),
  };

  // Create payment sections based on cart items
  const getPaymentSections = () => {
    const sections = [];
    
    // Services + Products combined section (mandatory)
    const servicesAndProducts = [...groupedItems.Services, ...groupedItems.Products];
    if (servicesAndProducts.length > 0) {
      const combinedAmount = servicesAndProducts.reduce((total, item) => {
        const pricing = getItemPricing(item.id);
        return total + pricing.totalLinePrice;
      }, 0);
      
      sections.push({
        id: 'services-products',
        title: 'Services & Products (Required)',
        amount: combinedAmount,
        required: true,
        items: servicesAndProducts
      });
    }

    // Individual sections for Packages
    groupedItems.Packages.forEach(item => {
      const pricing = getItemPricing(item.id);
      sections.push({
        id: `package-${item.id}`,
        title: `Package: ${item.data?.name || 'Unnamed Package'}`,
        amount: pricing.totalLinePrice,
        required: false,
        items: [item]
      });
    });

    // Individual sections for Vouchers
    groupedItems.Vouchers.forEach(item => {
      const pricing = getItemPricing(item.id);
      sections.push({
        id: `voucher-${item.id}`,
        title: `Voucher: ${item.data?.member_voucher_name || 'Unnamed Voucher'}`,
        amount: pricing.totalLinePrice,
        required: false,
        items: [item]
      });
    });

    // Individual sections for MCP Transfers
    groupedItems.TransferMCP.forEach(item => {
      const pricing = getItemPricing(item.id);
      sections.push({
        id: `transfer-mcp-${item.id}`,
        title: `MCP Transfer: ${item.data?.description || item.data?.name || 'MCP Balance Transfer'}`,
        amount: pricing.totalLinePrice,
        required: false,
        items: [item]
      });
    });

    // Individual sections for MV Transfers
    groupedItems.TransferMV.forEach(item => {
      const pricing = getItemPricing(item.id);
      sections.push({
        id: `transfer-mv-${item.id}`,
        title: `MV Transfer: ${item.data?.description || item.data?.name || 'Member Voucher Transfer'}`,
        amount: pricing.totalLinePrice,
        required: false,
        items: [item]
      });
    });

    return sections;
  };

  // Handle pricing updates
  const updateItemPricing = (itemId, field, value) => {
    const currentPricing = getItemPricing(itemId);
    const newPricing = calculatePricing(currentPricing, field, value);
    onPricingChange(itemId, newPricing);
  };

  // Calculate pricing based on field changes
  const calculatePricing = (currentPricing, field, value) => {
    const numValue = parseFloat(value) || 0;
    const newPricing = { ...currentPricing };

    if (field === 'quantity') {
      newPricing.quantity = Math.max(1, Math.floor(numValue));
    } else if (field === 'customPrice') {
      newPricing.customPrice = numValue;
      newPricing.discount = 0; 
      newPricing.finalUnitPrice = numValue > 0 ? numValue : newPricing.originalPrice;
    } else if (field === 'discount') {
      const discountValue = Math.max(0, Math.min(1, numValue)); 
      newPricing.discount = discountValue;
      newPricing.customPrice = 0; 
      newPricing.finalUnitPrice = newPricing.originalPrice * (1 - discountValue);
    }

    // Calculate total line price
    newPricing.totalLinePrice = newPricing.finalUnitPrice * newPricing.quantity;

    return newPricing;
  };

  // Get item pricing data
  const getItemPricing = (itemId) => {
    return itemPricing[itemId] || {
      originalPrice: 0,
      customPrice: 0,
      discount: 0,
      quantity: 1,
      finalUnitPrice: 0,
      totalLinePrice: 0
    };
  };

  // Handle assigning employee to a cart item
  const handleAssignEmployee = (itemId, employeeId) => {
    onEmployeeChange(itemId, employeeId);
  };

  // Handle updating remarks for a cart item
  const handleRemarksChange = (itemId, remarks) => {
    onRemarksChange(itemId, remarks);
  };

  // Add payment method to section
  const addPaymentMethod = (sectionId, methodId) => {
    if (!methodId) return;
    
    console.log('Adding payment method:', { methodId, dropdownPaymentMethods });
    
    // Find the payment method name from the store
    const method = dropdownPaymentMethods.find(m => {
      console.log('Comparing:', m.id, 'with', methodId, typeof m.id, typeof methodId);
      return m.id == methodId; 
    });
    
    console.log('Found method:', method);
    
    const methodName = method ? method.payment_method_name : `Payment Method ${methodId}`;
    
    console.log('Method name:', methodName);

    const newPayment = {
      id: Date.now(),
      methodId: methodId,
      methodName: methodName,
      amount: 0,
      remark: ''
    };

    onPaymentChange('add', sectionId, newPayment);
    
    // Reset the selection for this section
    onSelectedPaymentMethodChange(sectionId, '');
  };

  // Remove payment method from section
  const removePaymentMethod = (sectionId, paymentId) => {
    onPaymentChange('remove', sectionId, paymentId);
  };

  // Update payment amount
  const updatePaymentAmount = (sectionId, paymentId, amount) => {
    const numAmount = parseFloat(amount) || 0;
    const section = paymentSections.find(s => s.id === sectionId);
    const currentPayments = sectionPayments[sectionId] || [];
    
    // Calculate total of other payments in this section
    const otherPaymentsTotal = currentPayments
      .filter(p => p.id !== paymentId)
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate maximum allowed for this payment
    const maxAllowed = section ? section.amount - otherPaymentsTotal : numAmount;
    
    // Clamp the amount to not exceed the maximum allowed
    const clampedAmount = Math.min(numAmount, Math.max(0, maxAllowed));
    
    // Show warning if amount was adjusted
    if (numAmount > maxAllowed && maxAllowed >= 0) {
      console.warn(`Payment amount adjusted from ${numAmount} to ${clampedAmount} for section ${sectionId}`);
    }
    
    onPaymentChange('updateAmount', sectionId, { paymentId, amount: clampedAmount });
  };

  // Update payment remark
  const updatePaymentRemark = (sectionId, paymentId, remark) => {
    onPaymentChange('updateRemark', sectionId, { paymentId, remark });
  };

  // Get total payment for a section
  const getSectionPaymentTotal = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    });
  };

  const paymentSections = getPaymentSections();

  // Auto-add transfer payment method for transfer sections
  const autoAddTransferPayment = (sectionId, amount) => {
    // Check if this section already has a transfer payment
    const existingPayments = sectionPayments[sectionId] || [];
    const hasTransferPayment = existingPayments.some(payment => 
      payment.methodName === 'Transfer' || payment.methodId === 'transfer'
    );
    
    if (!hasTransferPayment) {
      const transferPayment = {
        id: Date.now(),
        methodId: 'transfer',
        methodName: 'Transfer',
        amount: amount,
        remark: 'Auto-generated transfer payment'
      };
      
      onPaymentChange('add', sectionId, transferPayment);
    }
  };

  // Effect to auto-add transfer payments when sections are created
  useEffect(() => {
    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      // Check if this is a transfer section
      if (section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-')) {
        autoAddTransferPayment(section.id, section.amount);
      }
    });
  }, [cartItems, itemPricing, sectionPayments]);

  return (
    <>
      {/* Cart Items Sections */}
      {paymentSections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {section.title}
                {section.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Required
                  </span>
                )}
              </CardTitle>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-lg font-bold">{formatCurrency(section.amount)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Line Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => {
                    const pricing = getItemPricing(item.id);
                    
                    return (
                      <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.data?.name || item.data?.member_voucher_name || 'Unnamed Item'}</div>
                          <div className="text-xs text-gray-500 capitalize">{item.type === 'member-voucher' ? 'Voucher' : item.type}</div>
                          {item.data?.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{item.data.description}</div>
                          )}
                          {item.type === 'member-voucher' && (
                            <div className="text-xs text-blue-500 mt-1">
                              {item.data?.starting_balance ? `Balance: ${formatCurrency(item.data.starting_balance)}` : ''}
                              {item.data?.free_of_charge > 0 ? ` (FOC: ${formatCurrency(item.data.free_of_charge)})` : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.type === 'member-voucher' ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              value={pricing.quantity}
                              onChange={(e) => updateItemPricing(item.id, 'quantity', e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-center text-sm"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(pricing.originalPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.type === 'member-voucher' ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pricing.customPrice || ''}
                              onChange={(e) => updateItemPricing(item.id, 'customPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-20 p-1 border border-gray-300 rounded text-right text-sm"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.type === 'member-voucher' ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={pricing.discount || ''}
                                onChange={(e) => updateItemPricing(item.id, 'discount', e.target.value)}
                                placeholder="0.00"
                                className="w-16 p-1 border border-gray-300 rounded text-right text-sm"
                              />
                              <span className="text-xs text-gray-500">
                                ({((pricing.discount || 0) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(pricing.finalUnitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(pricing.totalLinePrice)}
                        </td>
                        <td className="px-4 py-3">
                          <EmployeeSelect 
                            label=""
                            value={
                              item.type === 'member-voucher' && item.data?.created_by 
                                ? item.data.created_by.toString()
                                : itemEmployees[item.id] || ""
                            }
                            onChange={(id) => handleAssignEmployee(item.id, id)}
                            errors={{}}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Enter remarks..."
                            value={itemRemarks[item.id] || ''}
                            onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right font-medium">Section Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(section.amount)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Payment Methods</h3>
                <div className="flex items-center gap-4">
                  <div className="w-64">
                    <PaymentMethodSelect
                      label=""
                      value={selectedPaymentMethods[section.id] || ''}
                      onChange={(methodId) => {
                        onSelectedPaymentMethodChange(section.id, methodId);
                      }}
                      errors={{}}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const methodId = selectedPaymentMethods[section.id];
                      if (methodId) {
                        addPaymentMethod(section.id, methodId);
                      }
                    }}
                    disabled={!selectedPaymentMethods[section.id]}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Payment Methods List */}
              {sectionPayments[section.id] && sectionPayments[section.id].length > 0 && (
                <div className="space-y-3">
                  {sectionPayments[section.id].map((payment) => {
                    const otherPaymentsTotal = sectionPayments[section.id]
                      .filter(p => p.id !== payment.id)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const maxAllowed = section.amount - otherPaymentsTotal;
                    
                    return (
                      <div key={payment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex-shrink-0 w-32">
                          <span className="text-sm font-medium">{payment.methodName}</span>
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max={maxAllowed}
                            step="0.01"
                            placeholder="Enter amount"
                            value={payment.amount || ''}
                            onChange={(e) => updatePaymentAmount(section.id, payment.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                          {maxAllowed < section.amount && (
                            <div className="text-xs text-gray-500 mt-1">
                              Max: {formatCurrency(maxAllowed)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Remark (optional)"
                            value={payment.remark}
                            onChange={(e) => updatePaymentRemark(section.id, payment.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removePaymentMethod(section.id, payment.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Summary */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(getSectionPaymentTotal(section.id))}
                  </span>
                </div>
                {section.required && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">Remaining:</span>
                    <span className={`text-sm font-medium ${
                      section.amount - getSectionPaymentTotal(section.id) === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(section.amount - getSectionPaymentTotal(section.id))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default CartItemsWithPayment;
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import api from '@/services/api';

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

  // Track which transfer sections have been processed to prevent duplicates
  const processedTransferSections = useRef(new Set());
  // Track which sections have had GST added
  const processedGSTSections = useRef(new Set());

  // State for GST rate
  const [gstRate, setGstRate] = useState(9); // Default to 9% if API fails
  const [gstLoading, setGstLoading] = useState(true);

  // Effect to fetch GST rate from API
  useEffect(() => {
    const fetchGSTRate = async () => {
      try {
        setGstLoading(true);
        const response = await api.get('/payment-method/10');
        
        if (response.data && response.data.percentage_rate) {
          const rate = parseFloat(response.data.percentage_rate);
          setGstRate(rate);
          console.log(`GST rate fetched from API: ${rate}%`);
        } else {
          console.warn('GST rate not found in API response, using default 9%');
          setGstRate(9);
        }
      } catch (error) {
        console.error('Failed to fetch GST rate, using default 9%:', error);
        setGstRate(9);
      } finally {
        setGstLoading(false);
      }
    };

    fetchGSTRate();
  }, []);

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

  // Helper function to round to 2 decimal places
  const roundTo2Decimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // Helper function to calculate GST amount
  const calculateGSTAmount = (amount) => {
    return roundTo2Decimals(amount * (gstRate / 100));
  };

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
      const combinedAmount = roundTo2Decimals(servicesAndProducts.reduce((total, item) => {
        const pricing = getItemPricing(item.id);
        return total + pricing.totalLinePrice;
      }, 0));
      
      const gstAmount = calculateGSTAmount(combinedAmount);
      const totalWithGST = roundTo2Decimals(combinedAmount + gstAmount);
      
      sections.push({
        id: 'services-products',
        title: 'Services & Products (Required)',
        amount: combinedAmount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
        required: true,
        items: servicesAndProducts
      });
    }

    // Individual sections for Packages
    groupedItems.Packages.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const gstAmount = calculateGSTAmount(amount);
      const totalWithGST = roundTo2Decimals(amount + gstAmount);
      
      sections.push({
        id: `package-${item.id}`,
        title: `Package: ${item.data?.name || 'Unnamed Package'}`,
        amount: amount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
        required: false,
        items: [item]
      });
    });

    // Individual sections for Vouchers
    groupedItems.Vouchers.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const gstAmount = calculateGSTAmount(amount);
      const totalWithGST = roundTo2Decimals(amount + gstAmount);
      
      sections.push({
        id: `voucher-${item.id}`,
        title: `Voucher: ${item.data?.member_voucher_name || 'Unnamed Voucher'}`,
        amount: amount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
        required: false,
        items: [item]
      });
    });

    // Individual sections for MCP Transfers
    groupedItems.TransferMCP.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const gstAmount = calculateGSTAmount(amount);
      const totalWithGST = roundTo2Decimals(amount + gstAmount);
      
      sections.push({
        id: `transfer-mcp-${item.id}`,
        title: `MCP Transfer: ${item.data?.description || item.data?.name || 'MCP Balance Transfer'}`,
        amount: amount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
        required: false,
        items: [item]
      });
    });

    // Individual sections for MV Transfers
    groupedItems.TransferMV.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const gstAmount = calculateGSTAmount(amount);
      const totalWithGST = roundTo2Decimals(amount + gstAmount);
      
      sections.push({
        id: `transfer-mv-${item.id}`,
        title: `MV Transfer: ${item.data?.description || item.data?.name || 'Member Voucher Transfer'}`,
        amount: amount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
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
      newPricing.customPrice = roundTo2Decimals(numValue);
      // When custom price is used, set discount to 1 (full pay of custom amount)
      newPricing.discount = 1;
      newPricing.finalUnitPrice = roundTo2Decimals(numValue);
    } else if (field === 'discount') {
      // Discount logic: 0 = free, 1 = full pay, 0.7 = 70% of original, 0.5 = 50% of original
      const discountValue = Math.max(0, Math.min(1, numValue)); 
      newPricing.discount = roundTo2Decimals(discountValue);
      newPricing.customPrice = 0; 
      newPricing.finalUnitPrice = roundTo2Decimals(newPricing.originalPrice * discountValue);
    }

    // Calculate total line price
    newPricing.totalLinePrice = roundTo2Decimals(newPricing.finalUnitPrice * newPricing.quantity);

    return newPricing;
  };

  // Get item pricing data
  const getItemPricing = (itemId) => {
    const pricing = itemPricing[itemId] || {
      originalPrice: 0,
      customPrice: 0,
      discount: 1, // Default to full pay (1.0)
      quantity: 1,
      finalUnitPrice: 0,
      totalLinePrice: 0
    };

    // Ensure all values are rounded to 2 decimal places
    return {
      originalPrice: roundTo2Decimals(pricing.originalPrice),
      customPrice: roundTo2Decimals(pricing.customPrice),
      discount: roundTo2Decimals(pricing.discount),
      quantity: pricing.quantity,
      finalUnitPrice: roundTo2Decimals(pricing.finalUnitPrice),
      totalLinePrice: roundTo2Decimals(pricing.totalLinePrice)
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
      id: crypto.randomUUID(),
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
    const numAmount = roundTo2Decimals(parseFloat(amount) || 0);
    const section = paymentSections.find(s => s.id === sectionId);
    const currentPayments = sectionPayments[sectionId] || [];
    
    // Calculate total of other non-GST payments in this section
    const otherPaymentsTotal = roundTo2Decimals(currentPayments
      .filter(p => p.id !== paymentId && p.methodName !== `GST (${gstRate}%)`)
      .reduce((sum, p) => sum + p.amount, 0));
    
    // Calculate maximum allowed for this payment (should not exceed section amount, not including GST)
    const maxAllowed = section ? roundTo2Decimals(section.amount - otherPaymentsTotal) : numAmount;
    
    // Clamp the amount to not exceed the maximum allowed
    const clampedAmount = roundTo2Decimals(Math.min(numAmount, Math.max(0, maxAllowed)));
    
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

  // Get total payment for a section (excluding GST)
  const getSectionPaymentTotal = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    return roundTo2Decimals(payments
      .filter(payment => payment.methodName !== `GST (${gstRate}%)`)
      .reduce((total, payment) => total + payment.amount, 0));
  };

  // Get total payment including GST for a section
  const getSectionTotalWithGST = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    return roundTo2Decimals(payments.reduce((total, payment) => total + payment.amount, 0));
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return (roundTo2Decimals(amount) || 0).toLocaleString('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const paymentSections = getPaymentSections();

  // Auto-add GST payment for all sections
  const autoAddGSTPayment = (sectionId, gstAmount) => {
    // Check if we've already processed this section
    if (processedGSTSections.current.has(sectionId)) {
      return;
    }

    // Check if this section already has a GST payment
    const existingPayments = sectionPayments[sectionId] || [];
    const hasGSTPayment = existingPayments.some(payment => payment.methodName === `GST (${gstRate}%)`);
    
    // Only auto-add if there's no existing GST payment
    if (!hasGSTPayment && gstAmount > 0) {
      const gstPayment = {
        id: crypto.randomUUID(),
        methodId: 10, // GST payment method ID
        methodName: `GST (${gstRate}%)`,
        amount: roundTo2Decimals(gstAmount),
        remark: `Auto-calculated GST at ${gstRate}%`,
        isGST: true // Flag to identify GST payments
      };
      
      onPaymentChange('add', sectionId, gstPayment);
      
      // Mark this section as processed
      processedGSTSections.current.add(sectionId);
      
      console.log(`Auto-added GST payment for ${sectionId} with amount: ${gstAmount} at ${gstRate}%`);
    }
  };

  // Auto-add transfer payment method for transfer sections
  const autoAddTransferPayment = (sectionId, amount) => {
    // Check if we've already processed this section
    if (processedTransferSections.current.has(sectionId)) {
      return;
    }

    // Check if this section already has any non-GST payments
    const existingPayments = sectionPayments[sectionId] || [];
    const hasNonGSTPayments = existingPayments.some(payment => payment.methodName !== `GST (${gstRate}%)`);
    
    // Only auto-add if there are no existing non-GST payments
    if (!hasNonGSTPayments) {
      const transferPayment = {
        id: crypto.randomUUID(),
        methodId: 9,
        methodName: 'Transfer',
        amount: roundTo2Decimals(amount), // This should auto-fill the full amount
        remark: 'Auto-generated transfer payment'
      };
      
      onPaymentChange('add', sectionId, transferPayment);
      
      // Mark this section as processed
      processedTransferSections.current.add(sectionId);
      
      console.log(`Auto-added transfer payment for ${sectionId} with amount: ${amount}`);
    }
  };

  // Effect to auto-add GST payments for all sections (only after GST rate is loaded)
  useEffect(() => {
    if (gstLoading) return; // Wait for GST rate to be loaded

    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      autoAddGSTPayment(section.id, section.gstAmount);
    });
  }, [cartItems, itemPricing, gstRate, gstLoading]);

  // Effect to auto-add transfer payments when transfer sections are created
  useEffect(() => {
    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      // Check if this is a transfer section
      if (section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-')) {
        autoAddTransferPayment(section.id, section.amount);
      }
    });
  }, [cartItems, itemPricing]); 

  // Separate effect to ensure transfer payments have the correct amount
  useEffect(() => {
    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      if (section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-')) {
        const existingPayments = sectionPayments[section.id] || [];
        
        // Find transfer payments with 0 amount and update them
        existingPayments.forEach(payment => {
          if ((payment.methodName === 'Transfer' || payment.methodId === 9) && 
              payment.amount === 0 && !payment.isGST) {
                
            console.log(`Section ${section.id} details`);
            console.log(section);
            
            // Determine the amount based on transfer type
            let transferAmount;
            if (section.id.startsWith('transfer-mcp-')) {
              transferAmount = section.amount;
              console.log(`Using section.amount for MCP transfer: ${transferAmount}`);
            } else if (section.id.startsWith('transfer-mv-')) {
              transferAmount = section.items[0].data.transferAmount;
              console.log(`Using section.items[0].data.transferAmount for MV transfer: ${transferAmount}`);
            }
            
            const roundedTransferAmount = roundTo2Decimals(transferAmount);
            console.log(`Updating transfer payment amount for ${section.id} to ${roundedTransferAmount}`);
            onPaymentChange('updateAmount', section.id, { 
              paymentId: payment.id, 
              amount: roundedTransferAmount 
            });
          }
        });
      }
    });
  }, [sectionPayments, cartItems, itemPricing]);

  // Effect to update GST amounts when section amounts change
  useEffect(() => {
    if (gstLoading) return; // Wait for GST rate to be loaded

    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      const existingPayments = sectionPayments[section.id] || [];
      
      // Find GST payments and update their amounts
      existingPayments.forEach(payment => {
        if (payment.methodName === `GST (${gstRate}%)` && roundTo2Decimals(payment.amount) !== section.gstAmount) {
          console.log(`Updating GST payment amount for ${section.id} to ${section.gstAmount} at ${gstRate}%`);
          onPaymentChange('updateAmount', section.id, { 
            paymentId: payment.id, 
            amount: section.gstAmount 
          });
        }
      });
    });
  }, [sectionPayments, cartItems, itemPricing, gstRate, gstLoading]);

  // Reset processed sections when cart items change significantly
  useEffect(() => {
    const currentSectionIds = paymentSections.map(section => section.id);
    
    // Clear processed sections that no longer exist
    const processedTransferIds = Array.from(processedTransferSections.current);
    processedTransferIds.forEach(id => {
      if (!currentSectionIds.includes(id)) {
        processedTransferSections.current.delete(id);
      }
    });

    const processedGSTIds = Array.from(processedGSTSections.current);
    processedGSTIds.forEach(id => {
      if (!currentSectionIds.includes(id)) {
        processedGSTSections.current.delete(id);
      }
    });
  }, [cartItems]);

  // Show loading state if GST rate is still being fetched
  if (gstLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading GST rate...</div>
      </div>
    );
  }

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
                <div className="text-sm text-gray-500">Section Total</div>
                <div className="text-lg font-bold">{formatCurrency(section.amount)}</div>
                <div className="text-sm text-gray-500">GST ({gstRate}%): {formatCurrency(section.gstAmount)}</div>
                <div className="text-lg font-bold text-blue-600">Total with GST: {formatCurrency(section.totalWithGST)}</div>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Ratio</th>
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
                                placeholder="1.00"
                                className="w-16 p-1 border border-gray-300 rounded text-right text-sm"
                              />
                              <span className="text-xs text-gray-500">
                                ({((pricing.discount || 0) * 100).toFixed(0)}% of original)
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
                    // For GST payments, they should not be editable
                    const isGST = payment.methodName === `GST (${gstRate}%)`;
                    
                    // Calculate max allowed for non-GST payments
                    const otherNonGSTPaymentsTotal = roundTo2Decimals(sectionPayments[section.id]
                      .filter(p => p.id !== payment.id && p.methodName !== `GST (${gstRate}%)`)
                      .reduce((sum, p) => sum + p.amount, 0));
                    const maxAllowed = isGST ? roundTo2Decimals(payment.amount) : roundTo2Decimals(section.amount - otherNonGSTPaymentsTotal);
                    
                    return (
                      <div key={payment.id} className={`flex items-center gap-3 p-3 rounded-md ${isGST ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex-shrink-0 w-32">
                          <span className={`text-sm font-medium ${isGST ? 'text-blue-700' : ''}`}>
                            {payment.methodName}
                            {isGST && <span className="block text-xs text-blue-600">Auto-calculated</span>}
                          </span>
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max={maxAllowed}
                            step="0.01"
                            placeholder="Enter amount"
                            value={roundTo2Decimals(payment.amount) || ''}
                            onChange={(e) => updatePaymentAmount(section.id, payment.id, e.target.value)}
                            disabled={isGST}
                            className={`w-full p-2 border rounded-md text-sm ${
                              isGST 
                                ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed' 
                                : 'border-gray-300'
                            }`}
                          />
                          {!isGST && maxAllowed < section.amount && (
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
                            disabled={isGST}
                            className={`w-full p-2 border rounded-md text-sm ${
                              isGST 
                                ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed' 
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {!isGST && (
                          <button
                            onClick={() => removePaymentMethod(section.id, payment.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {isGST && (
                          <div className="p-2 w-8 h-8 flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">GST</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Summary */}
              <div className="mt-4 pt-3 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal (excluding GST):</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(getSectionPaymentTotal(section.id))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">GST ({gstRate}%):</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(section.gstAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-bold">Total Payment:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(getSectionTotalWithGST(section.id))}
                    </span>
                  </div>
                  {section.required && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">Remaining to pay:</span>
                      <span className={`text-sm font-medium ${
                        roundTo2Decimals(section.totalWithGST - getSectionTotalWithGST(section.id)) === 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(section.totalWithGST - getSectionTotalWithGST(section.id))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default CartItemsWithPayment;
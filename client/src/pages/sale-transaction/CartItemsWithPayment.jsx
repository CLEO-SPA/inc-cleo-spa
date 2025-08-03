import React, { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

const CartItemsWithPayment = ({
  cartItems,
  onPricingChange,
  onEmployeeChange,
  onPaymentChange,
  itemEmployees = {},
  itemPricing = {},
  sectionPayments = {},
  selectedPaymentMethods = {},
  onSelectedPaymentMethodChange,
}) => {
  // State for temporary employee selection before adding
  const [tempEmployeeSelections, setTempEmployeeSelections] = useState({});
  // Get payment methods from store
  const dropdownPaymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
  const loading = usePaymentMethodStore((state) => state.loading);
  const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);

  // Track which transfer sections have been processed to prevent duplicates
  const processedTransferSections = useRef(new Set());

  // Track which sections have had GST added
  const processedGSTSections = useRef(new Set());
  // Track which sections have had Free added
  const processedFreeSections = useRef(new Set());


  const employees = useEmployeeStore((state) => state.employees);
  const fetchDropdownEmployees = useEmployeeStore((state) => state.fetchDropdownEmployees);

  const commissionSettings = useEmployeeStore((state) => state.commissionSettings);
  const fetchCommissionSettings = useEmployeeStore((state) => state.fetchCommissionSettings);

  // Effect to ensure employees are loaded
  useEffect(() => {
    if (employees.length === 0 && !loading) {
      fetchDropdownEmployees();
    }
  }, [employees.length, loading, fetchDropdownEmployees]);

  // Effect to ensure commission settings are loaded
  useEffect(() => {
    if (!commissionSettings || (Object.keys(commissionSettings).length === 0 && !loading)) {
      fetchCommissionSettings();
    }
  }, [commissionSettings, loading, fetchCommissionSettings]);

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

  // Get item pricing data
  const getItemPricing = (itemId) => {
    const pricing = itemPricing[itemId] || {
      originalPrice: 0,
      customPrice: 0,
      discount: 1, // Default to 1 (100% of original price)
      quantity: 1,
      finalUnitPrice: 0,
      totalLinePrice: 0
    };

    return {
      originalPrice: roundTo2Decimals(pricing.originalPrice),
      customPrice: roundTo2Decimals(pricing.customPrice),
      discount: roundTo2Decimals(pricing.discount),
      quantity: pricing.quantity,
      finalUnitPrice: roundTo2Decimals(pricing.finalUnitPrice),
      totalLinePrice: roundTo2Decimals(pricing.totalLinePrice)
    };
  };

  // Helper function to calculate Free amount for specific items (NO circular dependency)
  const calculateItemsFreeAmount = (items) => {
    let totalFreeAmount = 0;

    items.forEach(item => {
      const pricing = getItemPricing(item.id);
      
      // Skip vouchers and transfers as they don't have discounts/custom pricing
      if (item.type === 'member-voucher' || 
          item.type === 'transferMCP' || 
          item.type === 'transferMV') {
        return;
      }

      let itemFreeAmount = 0;

      if (pricing.customPrice > 0) {
        // Custom price scenario: Free = (Original - Custom) * Quantity
        // When custom price is used, discount should be 1 (100% of custom price)
        const discountPerUnit = roundTo2Decimals(pricing.originalPrice - pricing.customPrice);
        itemFreeAmount = roundTo2Decimals(discountPerUnit * pricing.quantity);
      } else if (pricing.discount < 1 && pricing.discount >= 0) {
        // Discount scenario: Free = Original * (1 - discount) * Quantity  
        // When discount is used, custom price should be 0
        const discountPerUnit = roundTo2Decimals(pricing.originalPrice * (1 - pricing.discount));
        itemFreeAmount = roundTo2Decimals(discountPerUnit * pricing.quantity);
      }

      totalFreeAmount += itemFreeAmount;
      
      console.log(`Free calculation for item ${item.id}:`, {
        originalPrice: pricing.originalPrice,
        customPrice: pricing.customPrice,
        discount: pricing.discount,
        quantity: pricing.quantity,
        scenario: pricing.customPrice > 0 ? 'Custom Price' : 'Discount Ratio',
        itemFreeAmount,
        totalFreeAmount
      });
    });

    return roundTo2Decimals(totalFreeAmount);
  };


  const getRevenuePaymentMethods = () => {
    // Fallback list of known revenue payment method IDs if dropdownPaymentMethods is not loaded
    const knownRevenueMethodIds = [1, 2, 3, 4]; 
    
    if (dropdownPaymentMethods.length === 0) {
      console.log('Using fallback revenue method IDs:', knownRevenueMethodIds);
      return knownRevenueMethodIds;
    }
    
    const revenueIds = dropdownPaymentMethods.filter(method => {
      // Handle different possible formats for is_revenue
      const isRevenue = method.is_revenue === true || 
                       method.is_revenue === 't' || 
                       method.is_revenue === 'true' || 
                       method.is_revenue === 1 ||
                       method.is_revenue === '1';
      
      console.log('Payment method revenue check:', {
        id: method.id,
        name: method.payment_method_name,
        is_revenue: method.is_revenue,
        isRevenue
      });
      
      return isRevenue;
    }).map(method => parseInt(method.id));
    
    console.log('Revenue payment method IDs:', revenueIds);
    return revenueIds.length > 0 ? revenueIds : knownRevenueMethodIds;
  };

  // Calculate GST based on actual revenue payments made
  const calculateDynamicGST = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    const revenueMethodIds = getRevenuePaymentMethods();
    
    console.log('calculateDynamicGST for', sectionId, {
      payments,
      revenueMethodIds,
      dropdownPaymentMethods: dropdownPaymentMethods.slice(0, 3) // Show first 3 for debugging
    });
    
    // Sum up only revenue-generating payments (excluding GST, Free and non-revenue payments like Transfer)
    const revenuePaymentTotal = roundTo2Decimals(payments
      .filter(payment => {
        const isNotGST = payment.methodName !== `GST (${gstRate}%)`;
        const isNotFree = payment.methodName !== 'Free';
        const isRevenueMethod = revenueMethodIds.includes(parseInt(payment.methodId));
        
        console.log('Payment filter check:', {
          payment: payment.methodName,
          methodId: payment.methodId,
          isNotGST,
          isNotFree,
          isRevenueMethod,
          included: isNotGST && isNotFree && isRevenueMethod
        });
        
        return isNotGST && isNotFree && isRevenueMethod;
      })
      .reduce((total, payment) => total + payment.amount, 0));
    
    const gstAmount = calculateGSTAmount(revenuePaymentTotal);
    
    console.log('Dynamic GST calculation result:', {
      sectionId,
      revenuePaymentTotal,
      gstRate,
      gstAmount
    });
    
    return gstAmount;
  };


  // Group items by type and create sections
  const groupedItems = {
    Services: cartItems.filter((item) => item.type === 'service'),
    Products: cartItems.filter((item) => item.type === 'product'),
    Packages: cartItems.filter((item) => item.type === 'package'),
    Vouchers: cartItems.filter((item) => item.type === 'member-voucher'),
    TransferMCP: cartItems.filter(
      (item) => item.type === 'transferMCP' || (item.type === 'transfer' && item.data?.queueItem?.mcp_id1)
    ),
    TransferMV: cartItems.filter((item) => item.type === 'transferMV'),
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

      }, 0));
      
      // NO free amount calculation for services/products
      const freeAmount = 0;
      
      // GST will be calculated dynamically based on payments
      const dynamicGST = calculateDynamicGST('services-products');
      const totalWithGST = roundTo2Decimals(combinedAmount + dynamicGST);      
      sections.push({
        id: 'services-products',
        title: 'Services & Products (Required)',
        amount: combinedAmount,
        freeAmount: freeAmount,
        gstAmount: dynamicGST,
        totalWithGST: totalWithGST,
        required: true,
        items: servicesAndProducts,
        isDynamicGST: true,
        hasFreeAmount: false // NO free amounts for services/products
      });
    }

    // Individual sections for Packages - WITH FREE AMOUNTS
    groupedItems.Packages.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const freeAmount = calculateItemsFreeAmount([item], 'package'); // Pass section type
      const dynamicGST = calculateDynamicGST(`package-${item.id}`);
      const totalWithGST = roundTo2Decimals(amount + dynamicGST);
      
      sections.push({
        id: `package-${item.id}`,
        title: `Package: ${item.data?.name || 'Unnamed Package'}`,
        amount: amount,
        freeAmount: freeAmount,
        gstAmount: dynamicGST,
        totalWithGST: totalWithGST,
        required: false,
        items: [item],
        isDynamicGST: true,
        hasFreeAmount: freeAmount > 0 // Only show free amounts if > 0
      });
    });

    // Individual sections for Vouchers - NO FREE AMOUNTS
    groupedItems.Vouchers.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const freeAmount = 0; // NO free amounts for vouchers
      const dynamicGST = calculateDynamicGST(`voucher-${item.id}`);
      const totalWithGST = roundTo2Decimals(amount + dynamicGST);
      
      sections.push({
        id: `voucher-${item.id}`,
        title: `Voucher: ${item.data?.member_voucher_name || 'Unnamed Voucher'}`,
        amount: amount,
        freeAmount: freeAmount,
        gstAmount: dynamicGST,
        totalWithGST: totalWithGST,
        required: false,
        items: [item],
        isDynamicGST: true,
        hasFreeAmount: false // NO free amounts for vouchers
      });
    });

    // Individual sections for MCP Transfers - NO FREE AMOUNTS
    groupedItems.TransferMCP.forEach(item => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);
      const freeAmount = 0; // NO free amounts for transfers
      const gstAmount = 0; // No GST for full transfers
      const totalWithGST = amount;
      
      sections.push({
        id: `transfer-mcp-${item.id}`,
        title: `MCP Transfer: ${item.data?.description || item.data?.name || 'MCP Balance Transfer'}`,
        amount: amount,
        freeAmount: freeAmount,
        gstAmount: gstAmount,
        totalWithGST: totalWithGST,
        required: false,
        items: [item],
        isTransfer: true,
        hasFreeAmount: false // NO free amounts for transfers
      });
    });

    // Individual sections for MV Transfers - NO FREE AMOUNTS
    groupedItems.TransferMV.forEach(item => {
      const pricing = getItemPricing(item.id);
      const totalAmount = roundTo2Decimals(pricing.totalLinePrice);
      const transferAmount = roundTo2Decimals(item.data?.transferAmount || 0);
      const freeAmount = 0; // NO free amounts for transfers
      
      // GST calculated dynamically based on actual revenue payments made
      const dynamicGST = calculateDynamicGST(`transfer-mv-${item.id}`);
      const totalWithGST = roundTo2Decimals(totalAmount + dynamicGST);
      
      sections.push({
        id: `transfer-mv-${item.id}`,
        title: `MV Transfer: ${item.data?.description || item.data?.name || 'Member Voucher Transfer'}`,
        amount: totalAmount,
        transferAmount: transferAmount,
        freeAmount: freeAmount,
        gstAmount: dynamicGST,
        totalWithGST: totalWithGST,
        required: false,
        items: [item],
        isPartialTransfer: true,
        isDynamicGST: true,
        hasFreeAmount: false // NO free amounts for transfers
      });
    });

    return sections;
  };

  // Handle pricing updates
  const updateItemPricing = (itemId, field, value) => {
    const currentPricing = getItemPricing(itemId);
    const newPricing = calculatePricing(currentPricing, field, value);
    onPricingChange(itemId, newPricing);

    // Update employee assignments when total line price changes
    const currentAssignments = itemEmployees[itemId] || [];
    if (currentAssignments.length > 0) {
      const updatedAssignments = currentAssignments.map((assignment) => {
        const updatedAssignment = { ...assignment };
        const perfAmt = (newPricing.totalLinePrice * assignment.performanceRate) / 100;
        updatedAssignment.performanceAmount = perfAmt;
        const commRate = parseFloat(assignment.commissionRate) || 0;
        updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
        return updatedAssignment;
      });
      onEmployeeChange(itemId, updatedAssignments);
    }
  };

  // Calculate pricing based on field changes
  const calculatePricing = (currentPricing, field, value) => {
    const numValue = parseFloat(value) || 0;
    const newPricing = { ...currentPricing };

    if (field === 'quantity') {
      newPricing.quantity = Math.max(1, Math.floor(numValue));
    } else if (field === 'customPrice') {
      newPricing.customPrice = numValue;
      // When custom price is used, set discount to 1 (full pay of custom amount)
      newPricing.discount = 1;
      newPricing.finalUnitPrice = numValue;
    } else if (field === 'discount') {
      // Discount logic: 0 = free, 1 = full pay, 0.7 = 70% of original, 0.5 = 50% of original
      const discountValue = Math.max(0, Math.min(1, numValue));
      newPricing.discount = discountValue;
      newPricing.customPrice = 0;
      newPricing.finalUnitPrice = newPricing.originalPrice * discountValue;
    }

    // Calculate total line price
    newPricing.totalLinePrice = newPricing.finalUnitPrice * newPricing.quantity;

    return newPricing;
  };


  // Handle assigning employee to a cart item - from bugfix/master
//   const handleAssignEmployee = (itemId, employeeId) => { 
//     onEmployeeChange(itemId, employeeId);

  // Get item pricing data
  const getItemPricing = (itemId) => {
    return (
      itemPricing[itemId] || {
        originalPrice: 0,
        customPrice: 0,
        discount: 1, // Default to full pay (1.0)
        quantity: 1,
        finalUnitPrice: 0,
        totalLinePrice: 0,
      }
    );
  };

  // Handle adding employee assignment to an item
  const handleAddEmployeeAssignment = (itemId) => {
    const employeeId = tempEmployeeSelections[itemId];
    if (!employeeId) return;

    // Find the selected employee to get their name
    const selectedEmployee = employees.find((emp) => emp.id === String(employeeId));

    // Find the item to get its type
    const item = cartItems.find((cartItem) => cartItem.id === itemId);
    if (!item) return;

    const pricing = getItemPricing(itemId);
    const currentAssignments = itemEmployees[itemId] || [];

    // Calculate performance rate based on number of employees
    const totalEmployees = currentAssignments.length + 1; // +1 for the new employee
    const defaultPerfRate = parseFloat((100 / totalEmployees).toFixed(2));

    console.log('commissionSettings:', commissionSettings);
    console.log('item type:', item.type);

    // Get the commission rate based on item type
    let rawRate = '6.00'; // ultimate fallback

    if (commissionSettings) {
      const commissionKey = item.type === 'member-voucher'
        ? 'member-voucher'
        : item.type;

      rawRate = commissionSettings[commissionKey]
        // only if commissionKey is missing, use overall default
        || commissionSettings['default']
        // if that’s missing, use our literal
        || rawRate;
    }

    const defaultCommRate = parseFloat(rawRate);
    console.log('Selected commission rate:', defaultCommRate, 'for item type:', item.type);

    const perfAmt = (pricing.totalLinePrice * defaultPerfRate) / 100;
    const commAmt = (perfAmt * defaultCommRate) / 100;
    const newAssignment = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName: selectedEmployee?.employee_name || '',
      performanceRate: defaultPerfRate,
      performanceAmount: perfAmt,
      commissionRate: defaultCommRate,
      commissionAmount: commAmt,
      remarks: '',
      itemType: item.type,
    };

    // Update existing assignments to have equal performance rates
    const updatedExistingAssignments = currentAssignments.map((assignment) => {
      const updatedAssignment = { ...assignment, performanceRate: defaultPerfRate };
      const perfAmt = (pricing.totalLinePrice * defaultPerfRate) / 100;
      updatedAssignment.performanceAmount = perfAmt;
      const commRate = parseFloat(assignment.commissionRate) || 0;
      updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
      return updatedAssignment;
    });

    const allAssignments = [...updatedExistingAssignments, newAssignment];
    const assignmentSummary = allAssignments.map(emp => ({
      ...emp,
      displayName: `${emp.employeeName} (${emp.performanceRate}%)`
    }));
    onEmployeeChange(itemId, assignmentSummary);

    // Clear temp selection
    setTempEmployeeSelections((prev) => ({
      ...prev,
      [itemId]: '',
    }));
  };

  // Handle removing employee assignment
  const handleRemoveEmployeeAssignment = (itemId, assignmentId) => {
    const current = itemEmployees[itemId];
    let updatedAssignments = [];
    if (Array.isArray(current)) {
      updatedAssignments = current.filter((entry) => {
        // if entry is object, match by id; if primitive, match its string form
        if (typeof entry === 'object') return entry.id !== assignmentId;
        return entry.toString() !== assignmentId;
      });
    }

    // After removing, redistribute performance rates equally among remaining employees
    if (updatedAssignments.length > 0) {
      const pricing = getItemPricing(itemId);
      let equalRate = 100 / updatedAssignments.length;
      equalRate = parseFloat(equalRate.toFixed(2));

      updatedAssignments = updatedAssignments.map((assignment) => {
       const updatedAssignment = { 
      ...assignment, 
      performanceRate: equalRate,
      displayName: `${assignment.employeeName} (${equalRate}%)` // Add this line
    };
        const perfAmt = (pricing.totalLinePrice * equalRate) / 100;
        updatedAssignment.performanceAmount = perfAmt;
        const commRate = parseFloat(assignment.commissionRate) || 0;
        updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
        return updatedAssignment;
      });
    }

    onEmployeeChange(itemId, updatedAssignments);
  };

  // Handle updating employee assignment field
  const handleUpdateEmployeeAssignment = (itemId, assignmentId, field, value) => {
    const currentAssignments = itemEmployees[itemId] || [];

    // If there's only one employee and they're trying to change performance rate, force it to 100%
    if (field === 'performanceRate' && currentAssignments.length === 1) {
      value = 100;
    }

    const updatedAssignments = currentAssignments.map((assignment) => {
      if (assignment.id === assignmentId) {
        const updatedAssignment = { ...assignment, [field]: value };

        // Auto-calculate performance amount when rate changes
        if (field === 'performanceRate') {
          const pricing = getItemPricing(itemId);
          // Clamp rate between 0 and 100
          let rate = parseFloat(value) || 0;
          rate = Math.min(100, Math.max(0, rate));
          rate = parseFloat(rate.toFixed(2)); // Ensure two decimal places
          updatedAssignment.performanceRate = rate;
           updatedAssignment.displayName = `${assignment.employeeName} (${rate}%)`;
          const perfAmt = (pricing.totalLinePrice * rate) / 100;
          updatedAssignment.performanceAmount = perfAmt;

          // Also calculate commission amount if commissionRate exists
          const commRate = parseFloat(assignment.commissionRate) || 0;
          updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
        }

        // Auto-calculate commission amount when commission rate changes
        if (field === 'commissionRate') {
          const perfAmt = parseFloat(assignment.performanceAmount) || 0;
          const commRate = parseFloat(value) || 0;
          updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
        }

        return updatedAssignment;
      }
      return assignment;
    });

    // If performance rate was updated, adjust other employees' rates
    if (field === 'performanceRate' && currentAssignments.length === 2) {
      const updatedEmployee = updatedAssignments.find((a) => a.id === assignmentId);
      const otherEmployees = updatedAssignments.filter((a) => a.id !== assignmentId);

      if (updatedEmployee && otherEmployees.length > 0) {
        const remainingRate = 100 - updatedEmployee.performanceRate;
        let ratePerOtherEmployee = remainingRate / otherEmployees.length;
        ratePerOtherEmployee = parseFloat(ratePerOtherEmployee.toFixed(2));

        // Update other employees' rates
        const finalAssignments = updatedAssignments.map((assignment) => {
          if (assignment.id !== assignmentId) {
            const pricing = getItemPricing(itemId);
            const updatedAssignment = { ...assignment, performanceRate: ratePerOtherEmployee };
            const perfAmt = (pricing.totalLinePrice * ratePerOtherEmployee) / 100;
            updatedAssignment.performanceAmount = perfAmt;
            const commRate = parseFloat(assignment.commissionRate) || 0;
            updatedAssignment.commissionAmount = (perfAmt * commRate) / 100;
            return updatedAssignment;
          }
          return assignment;
        });

        onEmployeeChange(itemId, finalAssignments);
        return;
      }
    }

    onEmployeeChange(itemId, updatedAssignments);
  };

  const normalizeAssignments = (itemId) => {
    const raw = itemEmployees[itemId] || [];
    // Check if we need to normalize (if any entry is primitive)
    const needsNormalization = raw.some((entry) => typeof entry === 'string' || typeof entry === 'number');
    if (!needsNormalization) {
      return raw; // Already normalized
    }

    // Find the item to get its type
    const item = cartItems.find((cartItem) => cartItem.id === itemId);

    // Normalize and update the store
    const normalized = raw.map((entry) => {
      if (typeof entry === 'string' || typeof entry === 'number') {
        const empId = entry.toString();
        const emp = employees.find((e) => e.id === empId);
        const pricing = getItemPricing(itemId);
        const perfRate = 100 / raw.length; // Distribute equally among all employees
        const perfAmt = (pricing.totalLinePrice * perfRate) / 100;
        const commRateRaw =
          commissionSettings?.[item?.type === 'member-voucher' ? 'member-voucher' : item?.type] ||
          commissionSettings?.service ||
          6;
        const commRate = parseFloat(commRateRaw);
        const commAmt = (perfAmt * commRate) / 100;
        return {
          id: crypto.randomUUID(), // Generate unique assignment ID
          employeeId: empId,
          employeeName: emp?.employee_name || '',
          performanceRate: perfRate,
          performanceAmount: perfAmt,
          commissionRate: commRate,
          commissionAmount: commAmt,
          remarks: '',
          itemType: item?.type || 'unknown', // Add the itemType property
          displayName: `${emp?.employee_name || ''} (${perfRate.toFixed(2)}%)` 
        };
      }

      // If it's already an object but missing itemType, add it
      if (typeof entry === 'object' && !entry.itemType && item?.type) {
        return {
          ...entry,
          itemType: item.type,
        };
      }

      return entry;
    });

    // Update the store with normalized data
    onEmployeeChange(itemId, normalized);
    return normalized;
  };

  // Add payment method to section
  const addPaymentMethod = (sectionId, methodId) => {
    if (!methodId) return;

    console.log('Adding payment method:', { methodId, dropdownPaymentMethods });

    // Find the payment method name from the store
    const method = dropdownPaymentMethods.find((m) => {
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
      remark: '',
    };

    onPaymentChange('add', sectionId, newPayment);

    // Reset the selection for this section
    onSelectedPaymentMethodChange(sectionId, '');
    // Force GST calculation for dynamic GST sections when revenue payment is added
    const revenueMethodIds = getRevenuePaymentMethods();
    if (revenueMethodIds.includes(parseInt(methodId))) {
      console.log('Revenue payment method added, forcing GST calculation for', sectionId);
      
      // Small delay to ensure payment is added to state first
      setTimeout(() => {
        const paymentSections = getPaymentSections();
        const section = paymentSections.find(s => s.id === sectionId);
        if (section?.isDynamicGST) {
          const newGSTAmount = calculateDynamicGST(sectionId);
          console.log('Forced GST calculation result:', newGSTAmount);
          
          if (newGSTAmount > 0) {
            const existingPayments = sectionPayments[sectionId] || [];
            const existingGSTPayment = existingPayments.find(payment => payment.methodName === `GST (${gstRate}%)`);
            
            if (!existingGSTPayment) {
              const gstPayment = {
                id: crypto.randomUUID(),
                methodId: 10,
                methodName: `GST (${gstRate}%)`,
                amount: newGSTAmount,
                remark: ` GST rate ${gstRate}%`,
                isGST: true
              };
              
              onPaymentChange('add', sectionId, gstPayment);
              console.log('Force-added GST payment');
            }
          }
        }
      }, 100);
    }
  };

  // Remove payment method from section
  const removePaymentMethod = (sectionId, paymentId) => {
    onPaymentChange('remove', sectionId, paymentId);
  };

  // Update payment amount
  const updatePaymentAmount = (sectionId, paymentId, amount) => {
    const numAmount = roundTo2Decimals(parseFloat(amount) || 0);
    const paymentSections = getPaymentSections();
    const section = paymentSections.find(s => s.id === sectionId);
    const currentPayments = sectionPayments[sectionId] || [];
    
    const otherNonGSTNonFreePaymentsTotal = roundTo2Decimals(currentPayments
      .filter(p => p.id !== paymentId && p.methodName !== `GST (${gstRate}%)` && p.methodName !== 'Free')
      .reduce((sum, p) => sum + p.amount, 0));
    
    let clampedAmount;
    let maxAllowed;
    
    if (section?.isDynamicGST) {
      // For dynamic GST sections, limit to remaining section amount
      // This prevents paying more than the actual invoice amount (excluding GST and Free)
      maxAllowed = roundTo2Decimals(section.amount - otherNonGSTNonFreePaymentsTotal);
      clampedAmount = roundTo2Decimals(Math.min(numAmount, Math.max(0, maxAllowed)));
      
      if (numAmount > maxAllowed && maxAllowed >= 0) {
        console.warn(`Payment amount limited from ${numAmount} to ${clampedAmount} for dynamic GST section ${sectionId}`);
      }
    } else {
      // For fixed GST sections, maintain original logic
      maxAllowed = section ? roundTo2Decimals(section.amount - otherNonGSTNonFreePaymentsTotal) : numAmount;
      clampedAmount = roundTo2Decimals(Math.min(numAmount, Math.max(0, maxAllowed)));
      
      if (numAmount > maxAllowed && maxAllowed >= 0) {
        console.warn(`Payment amount adjusted from ${numAmount} to ${clampedAmount} for section ${sectionId}`);
      }
    }

    onPaymentChange('updateAmount', sectionId, { paymentId, amount: clampedAmount });
  };

  // Update payment remark
  const updatePaymentRemark = (sectionId, paymentId, remark) => {
    onPaymentChange('updateRemark', sectionId, { paymentId, remark });
  };


  // Get total payment for a section (excluding GST and Free)
  const getSectionPaymentTotal = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    return roundTo2Decimals(payments
      .filter(payment => payment.methodName !== `GST (${gstRate}%)` && payment.methodName !== 'Free')
      .reduce((total, payment) => total + payment.amount, 0));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
    });
  };

  const paymentSections = getPaymentSections();

  // Auto-add Free payment method for sections with discount/custom pricing (ONLY when needed)
  const autoAddFreePayment = (sectionId, freeAmount) => {

    if (freeAmount <= 0) return;
    
    if (processedFreeSections.current.has(sectionId)) {
      return;
    }

    const existingPayments = sectionPayments[sectionId] || [];
    const hasFreePayment = existingPayments.some(payment => payment.methodName === 'Free');
    
    // Only add if there's no existing Free payment and the amount is meaningful
    if (!hasFreePayment && freeAmount > 0) {
      const freePayment = {
        id: crypto.randomUUID(),
        methodId: 6, // Free payment method ID
        methodName: 'Free',
        amount: roundTo2Decimals(freeAmount),
        remark: 'Auto-generated for discount/custom pricing',
        isFree: true
      };
      
      onPaymentChange('add', sectionId, freePayment);
      processedFreeSections.current.add(sectionId);
      
      console.log(`Auto-added Free payment for ${sectionId} with amount: ${freeAmount}`);
    }
  };

  // Modified auto-add GST function to handle dynamic GST
  const autoAddGSTPayment = (sectionId, gstAmount, isTransfer = false, isPartialTransfer = false, isDynamicGST = false) => {
    // Skip GST for full transfer sections only
    if (isTransfer && !isPartialTransfer) {
      return;
    }

    // For dynamic GST sections, don't auto-add GST at the beginning
    if (isDynamicGST && gstAmount === 0) {
      return;
    }

    if (processedGSTSections.current.has(sectionId)) {
      return;
    }

    const existingPayments = sectionPayments[sectionId] || [];
    const hasGSTPayment = existingPayments.some(payment => payment.methodName === `GST (${gstRate}%)`);
    
    if (!hasGSTPayment && gstAmount > 0) {
      const gstPayment = {
        id: crypto.randomUUID(),
        methodId: 10,
        methodName: `GST (${gstRate}%)`,
        amount: roundTo2Decimals(gstAmount),
        remark: isDynamicGST ? `GST rate ${gstRate}%` : `Auto-GST rate ${gstRate}%`,
        isGST: true
      };
      
      onPaymentChange('add', sectionId, gstPayment);
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

    // Check if this section already has any payments
    const existingPayments = sectionPayments[sectionId] || [];
    const hasNonGSTNonFreePayments = existingPayments.some(payment => 
      payment.methodName !== `GST (${gstRate}%)` && payment.methodName !== 'Free'
    );
    
    if (!hasNonGSTNonFreePayments && transferAmount > 0) {
    // Only auto-add if there are no existing payments at all
//     if (existingPayments.length === 0) {

      const transferPayment = {
        id: crypto.randomUUID(),
        methodId: 9,
        methodName: 'Transfer',
        amount: amount, // This should auto-fill the full amount
        remark: 'Auto-generated transfer payment',
      };

      onPaymentChange('add', sectionId, transferPayment);

      // Mark this section as processed
      processedTransferSections.current.add(sectionId);

      console.log(`Auto-added transfer payment for ${sectionId} with amount: ${amount}`);
    }
  };

  // Effect to auto-add GST payments for all sections 
  useEffect(() => {
    if (gstLoading) return;

    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      autoAddGSTPayment(section.id, section.gstAmount, section.isTransfer, section.isPartialTransfer, section.isDynamicGST);
    });
  }, [cartItems, itemPricing, gstRate, gstLoading]);

  // New effect to handle dynamic GST calculation when payments change
  useEffect(() => {
    if (gstLoading) return;

    console.log('Dynamic GST effect triggered', {
      gstLoading,
      sectionPayments,
      dropdownPaymentMethods: dropdownPaymentMethods.length
    });

    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {
      if (section.isDynamicGST) {
        console.log('Processing dynamic GST for section:', section.id);
        
        const existingPayments = sectionPayments[section.id] || [];
        const existingGSTPayment = existingPayments.find(payment => payment.methodName === `GST (${gstRate}%)`);
        
        const newGSTAmount = section.gstAmount;
        
        console.log('GST calculation for', section.id, {
          existingGSTPayment: existingGSTPayment?.amount || 0,
          newGSTAmount,
          hasExistingGST: !!existingGSTPayment
        });
        
        if (existingGSTPayment) {
          // Update existing GST payment
          if (roundTo2Decimals(existingGSTPayment.amount) !== newGSTAmount) {
            console.log(`Updating dynamic GST for ${section.id} from ${existingGSTPayment.amount} to ${newGSTAmount}`);
            onPaymentChange('updateAmount', section.id, { 
              paymentId: existingGSTPayment.id, 
              amount: newGSTAmount 
            });
          }
        } else if (newGSTAmount > 0) {
          // Add new GST payment if revenue payments exist
          console.log(`Adding new dynamic GST for ${section.id} with amount: ${newGSTAmount}`);
          
          const gstPayment = {
            id: crypto.randomUUID(),
            methodId: 10,
            methodName: `GST (${gstRate}%)`,
            amount: newGSTAmount,
            remark: ` GST rate ${gstRate}%`,
            isGST: true
          };
          
          onPaymentChange('add', section.id, gstPayment);
        }
      }
    });
  }, [sectionPayments, gstRate, gstLoading, dropdownPaymentMethods]); // Added dropdownPaymentMethods dependency

  // Effect to update Free payments when pricing changes (ONLY FOR PACKAGES)
  useEffect(() => {
    if (gstLoading) return;

    const paymentSections = getPaymentSections();
    
    paymentSections.forEach(section => {

      if (!section.id.startsWith('package-')) {
        return; 
      }

      const existingPayments = sectionPayments[section.id] || [];
      const existingFreePayment = existingPayments.find(payment => payment.methodName === 'Free');
      
      const newFreeAmount = section.freeAmount;
      
      console.log('Free amount calculation for', section.id, {
        existingFreePayment: existingFreePayment?.amount || 0,
        newFreeAmount,
        hasExistingFree: !!existingFreePayment,
        isPackageSection: section.id.startsWith('package-')
      });
      
      if (newFreeAmount > 0) {
        // There should be free amount
        if (existingFreePayment) {
          // Update existing Free payment if amount changed
          if (roundTo2Decimals(existingFreePayment.amount) !== newFreeAmount) {
            console.log(`Updating Free amount for ${section.id} from ${existingFreePayment.amount} to ${newFreeAmount}`);
            onPaymentChange('updateAmount', section.id, { 
              paymentId: existingFreePayment.id, 
              amount: newFreeAmount 
            });
          }
        } else {
          // Add new Free payment (only for package sections)
          console.log(`Adding new Free payment for ${section.id} with amount: ${newFreeAmount}`);
          
          const freePayment = {
            id: crypto.randomUUID(),
            methodId: 6,
            methodName: 'Free',
            amount: newFreeAmount,
            remark: 'Auto-generated for package discount/custom pricing',
            isFree: true
          };
          
          onPaymentChange('add', section.id, freePayment);
        }
      } else {
        // No free amount needed, remove Free payment if exists
        if (existingFreePayment && existingFreePayment.isFree) {
          console.log(`Removing Free payment for ${section.id} as no longer needed`);
          onPaymentChange('remove', section.id, existingFreePayment.id);
        }
      }
    });
  }, [itemPricing, cartItems, gstLoading]); // Trigger when pricing changes
  // Effect to auto-add transfer payments when transfer sections are created
  // Removed sectionPayments from dependency array to prevent infinite loop
  useEffect(() => {
    const paymentSections = getPaymentSections();

    paymentSections.forEach((section) => {
      // Check if this is a transfer section
      if (section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-')) {
        autoAddTransferPayment(section.id, section.amount);
      }
    });
  }, [cartItems, itemPricing]);

  // Separate effect to ensure transfer payments have the correct amount
  useEffect(() => {
    const paymentSections = getPaymentSections();

    paymentSections.forEach((section) => {
      if (section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-')) {
        const existingPayments = sectionPayments[section.id] || [];        
        existingPayments.forEach(payment => {
          if ((payment.methodName === 'Transfer' || payment.methodId === 9) && 
              payment.amount === 0 && !payment.isGST && !payment.isFree) {
                
            let transferAmount;
            if (section.id.startsWith('transfer-mcp-')) {
              transferAmount = section.amount;
            } else if (section.id.startsWith('transfer-mv-')) {
              transferAmount = section.transferAmount || section.items[0].data.transferAmount;
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
  }, [sectionPayments, cartItems, itemPricing]); // This effect watches sectionPayments to fix amounts

  // Reset processed sections when cart items change significantly
  useEffect(() => {
    const currentTransferSectionIds = paymentSections
      .filter((section) => section.id.startsWith('transfer-mcp-') || section.id.startsWith('transfer-mv-'))
      .map((section) => section.id);

    // Clear processed sections that no longer exist
    const processedIds = Array.from(processedTransferSections.current);
    processedIds.forEach((id) => {
      if (!currentTransferSectionIds.includes(id)) {
        processedTransferSections.current.delete(id);
      }
    });
    const processedGSTIds = Array.from(processedGSTSections.current);
    processedGSTIds.forEach(id => {
      if (!currentSectionIds.includes(id)) {
        processedGSTSections.current.delete(id);
      }
    });

    const processedFreeIds = Array.from(processedFreeSections.current);
    processedFreeIds.forEach(id => {
      if (!currentSectionIds.includes(id)) {
        processedFreeSections.current.delete(id);
      }
    });
  }, [cartItems]);

  return (
    <>
      {/* Cart Items Sections */}
      {paymentSections.map((section) => (
        <Card key={section.id}>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg flex items-center gap-2'>
                {section.title}
                {section.required && (
                  <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full'>Required</span>
                )}
              </CardTitle>

              <div className="text-right">
                <div className="text-sm text-gray-500">Section Total</div>
                <div className="text-lg font-bold">{formatCurrency(section.amount)}</div>
                
                {/* Show Free amount if applicable */}
                {section.hasFreeAmount && section.freeAmount > 0 && (
                  <div className="text-sm text-green-600">Free: {formatCurrency(section.freeAmount)}</div>
                )}
                
                {/* Show breakdown for partial transfers */}
                {section.isPartialTransfer && (
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Transfer: {formatCurrency(section.transferAmount)}</div>
                    <div>Remaining: {formatCurrency(section.remainingAmount)}</div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">GST ({gstRate}%): {formatCurrency(section.gstAmount)}</div>
                <div className="text-lg font-bold text-blue-600">Total with GST: {formatCurrency(section.totalWithGST)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Items Table */}
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Ratio</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Line Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Free Amount</th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Employee Commission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => {
                    const pricing = getItemPricing(item.id);

                    
                    // Calculate free amount for this specific item - 
                    let itemFreeAmount = 0;
                    if (item.type === 'package' && 
                        item.type !== 'member-voucher' && 
                        item.type !== 'transferMCP' && 
                        item.type !== 'transferMV') {
                      

                      if (pricing.customPrice > 0 && pricing.customPrice < pricing.originalPrice) {
                        // Custom price scenario: Free = (Original - Custom) * Quantity
                        const discountPerUnit = roundTo2Decimals(pricing.originalPrice - pricing.customPrice);
                        itemFreeAmount = roundTo2Decimals(discountPerUnit * pricing.quantity);
                      } else if (pricing.discount < 1 && pricing.discount >= 0 && pricing.customPrice === 0) {
                        // Discount scenario: Free = Original * (1 - discount) * Quantity
                        const discountPerUnit = roundTo2Decimals(pricing.originalPrice * (1 - pricing.discount));
                        itemFreeAmount = roundTo2Decimals(discountPerUnit * pricing.quantity);
                      }
                    }
                   
                    // console.log('employeeAssignments for item:', item.id, itemEmployees);
                    // normalize assignments: convert simple IDs into full assignment objects
                    const employeeAssignments = normalizeAssignments(item.id);
                    return (
                      <>
                        <tr key={item.id} className='border-t border-gray-200 hover:bg-gray-50'>
                          <td className='px-4 py-3'>
                            <div className='font-medium text-gray-900'>
                              {item.data?.name || item.data?.member_voucher_name || 'Unnamed Item'}
                            </div>
                            <div className='text-xs text-gray-500 capitalize'>
                              {item.type === 'member-voucher' ? 'Voucher' : item.type}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(item.type === 'member-voucher' || 
                            item.type === 'transferMCP' || 
                            item.type === 'transferMV') ? (
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
                          {(item.type === 'member-voucher' || 
                            item.type === 'transferMCP' || 
                            item.type === 'transferMV') ? (
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
                          {(item.type === 'member-voucher' || 
                            item.type === 'transferMCP' || 
                            item.type === 'transferMV') ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={pricing.discount === 0 ? '0' : (pricing.discount || '')}
                                onChange={(e) => updateItemPricing(item.id, 'discount', e.target.value)}
                                placeholder="1.00"
                                className="w-16 p-1 border border-gray-300 rounded text-right text-sm"
                              />
                            )}
                          </td>
                          <td className='px-4 py-3 text-right'>
                            {item.type === 'member-voucher' ? (
                              <span className='text-gray-500'>-</span>
                            ) : (
                              <div className='flex items-center justify-end gap-1'>
                                <input
                                  type='number'
                                  min='0'
                                  max='1'
                                  step='0.01'
                                  value={pricing.discount || ''}
                                  onChange={(e) => updateItemPricing(item.id, 'discount', e.target.value)}
                                  placeholder='1.00'
                                  className='w-16 p-1 border border-gray-300 rounded text-right text-sm'
                                />
                                <span className='text-xs text-gray-500'>
                                  ({((pricing.discount || 0) * 100).toFixed(0)}% of original)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className='px-4 py-3 text-right font-medium text-gray-900'>
                            {formatCurrency(pricing.finalUnitPrice)}
                          </td>
                          <td className='px-4 py-3 text-right font-bold text-gray-900'>
                            {formatCurrency(pricing.totalLinePrice)}
                          </td>
                          <td className='px-4 py-3'>
                            {/* Add Employee Section */}
                            <div className='flex items-center gap-2'>
                              <div className='flex-1'>
                                <EmployeeSelect
                                  label=''
                                  value={tempEmployeeSelections[item.id] || ''}
                                  onChange={(id) =>
                                    setTempEmployeeSelections((prev) => ({
                                      ...prev,
                                      [item.id]: id,
                                    }))
                                  }
                                  errors={{}}
                                />
                              </div>
                              <Button
                                onClick={() => handleAddEmployeeAssignment(item.id)}
                                disabled={!tempEmployeeSelections[item.id]}
                                size='sm'
                                className='px-3'
                              >
                                <Plus className='h-4 w-4 mr-1' />
                                Add
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(pricing.finalUnitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(pricing.totalLinePrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {itemFreeAmount > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(itemFreeAmount)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          </td>
                        </tr>
                        {/* Employee Assignment Rows */}
                        {/* {console.log('Employee assignments for item:', employeeAssignments)} */}
                        {employeeAssignments.map((assignment, idx) => (
                          <tr key={assignment.id}>
                            <td colSpan={8} className='px-4 py-3'>
                              <div className='border rounded-md p-3 bg-white'>
                                <div className='flex items-center justify-between mb-3'>
                                  <span className='font-medium text-sm text-blue-700'>
                                    Employee #{idx + 1}: {assignment.employeeName}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveEmployeeAssignment(item.id, assignment.id)}
                                    className='p-1 text-red-600 hover:bg-red-100 rounded'
                                  >
                                    <X className='h-4 w-4' />
                                  </button>
                                </div>

                                <div className='grid grid-cols-4 gap-4 text-sm'>
                                  <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                                      Performance Rate (0-100%)
                                    </label>
                                    <input
                                      type='number'
                                      min='0'
                                      max='100'
                                      step='1'
                                      value={assignment.performanceRate}
                                      onChange={(e) =>
                                        handleUpdateEmployeeAssignment(
                                          item.id,
                                          assignment.id,
                                          'performanceRate',
                                          e.target.value
                                        )
                                      }
                                      className='w-full p-2 border border-gray-300 rounded text-sm'
                                    />
                                  </div>

                                  <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                                      Performance Amount
                                    </label>
                                    <div className='w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm'>
                                      {formatCurrency(assignment.performanceAmount)}
                                    </div>
                                  </div>

                                  <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                                      Commission Rate (%)
                                    </label>
                                    <input
                                      value={assignment.commissionRate.toFixed(2)}
                                      disabled
                                      readOnly
                                      className='w-full p-2 border border-gray-300 rounded text-sm bg-gray-100'
                                    />
                                  </div>

                                  <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                                      Commission Amount
                                    </label>
                                    <div
                                      className='w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm'
                                      title='Automatically calculated'
                                    >
                                      {formatCurrency(assignment.commissionAmount)}
                                    </div>
                                  </div>
                                </div>

                                <div className='mt-3'>
                                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    Employee Remarks
                                  </label>
                                  <input
                                    type='text'
                                    placeholder='Enter employee remarks (optional)'
                                    value={assignment.remarks}
                                    onChange={(e) =>
                                      handleUpdateEmployeeAssignment(item.id, assignment.id, 'remarks', e.target.value)
                                    }
                                    className='w-full p-2 border border-gray-300 rounded text-sm'
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
                <tfoot className='bg-gray-50'>
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right font-medium">Section Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(section.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      {section.freeAmount > 0 ? (
                        <span className="text-green-600 font-bold text-lg">
                          {formatCurrency(section.freeAmount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Section */}
            <div className='border-t pt-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-medium'>Payment Methods</h3>
                <div className='flex items-center gap-4'>
                  <div className='w-64'>
                    <PaymentMethodSelect
                      label=''
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
                    size='sm'
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    Add
                  </Button>
                </div>
              </div>

              {/* Payment Methods List */}
              {sectionPayments[section.id] && sectionPayments[section.id].length > 0 && (
                <div className='space-y-3'>
                  {sectionPayments[section.id].map((payment) => {
                    const isGST = payment.methodName === `GST (${gstRate}%)`;
                    const isFree = payment.methodName === 'Free';
                    const isAutoGeneratedFree = isFree && payment.isFree; // Only auto-generated Free payments are disabled
                    const isManualFree = isFree && !payment.isFree; // Manually added Free payments are editable
                    
                    // Calculate proper max allowed for all payment types
                    const otherNonGSTNonFreePaymentsTotal = roundTo2Decimals(sectionPayments[section.id]
                      .filter(p => p.id !== payment.id && p.methodName !== `GST (${gstRate}%)` && p.methodName !== 'Free')
                      .reduce((sum, p) => sum + p.amount, 0));
                    
                    let maxAllowed;
                    if (isGST || isAutoGeneratedFree) {
                      maxAllowed = roundTo2Decimals(payment.amount); 
                    } else {

                      maxAllowed = roundTo2Decimals(section.amount - otherNonGSTNonFreePaymentsTotal);
                    }
                    
                    return (
                      <div key={payment.id} className={`flex items-center gap-3 p-3 rounded-md ${
                        isGST ? 'bg-blue-50 border border-blue-200' : 
                        isAutoGeneratedFree ? 'bg-green-50 border border-green-200' : 
                        isManualFree ? 'bg-green-50 border border-green-100' : 
                        'bg-gray-50'
                      }`}>
                        <div className="flex-shrink-0 w-32">
                          <span className={`text-sm font-medium ${
                            isGST ? 'text-blue-700' : 
                            isAutoGeneratedFree ? 'text-green-700' : 
                            isManualFree ? 'text-green-600' : ''
                          }`}>
                            {payment.methodName}
                            {isGST && <span className="block text-xs text-blue-600">Auto-calculated</span>}
                            {isAutoGeneratedFree && <span className="block text-xs text-green-600">Auto-calculated</span>}
                            {isManualFree && <span className="block text-xs text-green-500">Manual entry</span>}
                          </span>
                        </div>
                        <div className='flex-1'>
                          <input
                            type='number'
                            min='0'
                            max={maxAllowed}
                            step='0.01'
                            placeholder='Enter amount'
                            value={payment.amount || ''}
                            onChange={(e) => updatePaymentAmount(section.id, payment.id, e.target.value)}
                            disabled={isGST || isAutoGeneratedFree} // Only disable GST and auto-generated Free
                            className={`w-full p-2 border rounded-md text-sm ${
                              isGST 
                                ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed' 
                                : isAutoGeneratedFree
                                ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                                : isManualFree
                                ? 'bg-white border-green-300 text-green-800' // Editable styling for manual Free
                                : 'border-gray-300'
                            }`}
                          />
                          {!isGST && !isAutoGeneratedFree && maxAllowed < section.amount && maxAllowed >= 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Max: {formatCurrency(maxAllowed)}
                            </div>
                          )}
                          {!isGST && !isAutoGeneratedFree && maxAllowed <= 0 && (
                            <div className="text-xs text-orange-500 mt-1">
                              Section fully paid
                            </div>
                          )}
                        </div>
                        <div className='flex-1'>
                          <input
                            type='text'
                            placeholder='Remark (optional)'
                            value={payment.remark}
                            onChange={(e) => updatePaymentRemark(section.id, payment.id, e.target.value)}
                            disabled={isGST || isAutoGeneratedFree} // Only disable GST and auto-generated Free
                            className={`w-full p-2 border rounded-md text-sm ${
                              isGST 
                                ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed' 
                                : isAutoGeneratedFree
                                ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                                : isManualFree
                                ? 'bg-white border-green-300 text-green-800' // Editable styling for manual Free
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {!isGST && !isAutoGeneratedFree && (
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
                        {isAutoGeneratedFree && (
                          <div className="p-2 w-8 h-8 flex items-center justify-center">
                            <span className="text-green-600 text-xs font-medium">FREE</span>
                          </div>
                        )}
                        {isManualFree && (
                          <div className="p-2 w-8 h-8 flex items-center justify-center">
                            <span className="text-green-500 text-xs font-medium">FREE</span>
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
                    <span className="font-medium">Subtotal (excluding GST & Free):</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(getSectionPaymentTotal(section.id))}
                    </span>
                  </div>
                  {section.freeAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Free Amount:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(section.freeAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">GST ({gstRate}%):</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(section.gstAmount)}
                    </span>
                  </div>
                  {/* Show GST breakdown for dynamic GST */}
                  {section.isDynamicGST && section.gstAmount > 0 && (
                    <div className="text-xs text-gray-600 ml-4">
                      GST calculated on revenue payments: {formatCurrency(getSectionPaymentTotal(section.id))}
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-bold">Total Payment:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(getSectionTotalWithGST(section.id))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">Remaining to pay:</span>
                    <span className={`text-sm font-medium ${
                      roundTo2Decimals(section.amount - getSectionPaymentTotal(section.id)) === 0 
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

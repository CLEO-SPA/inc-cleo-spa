import React, { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import useEmployeeStore from '@/stores/useEmployeeStore';
import api from '@/services/api';

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

  const employees = useEmployeeStore((state) => state.employees);
  const fetchDropdownEmployees = useEmployeeStore((state) => state.fetchDropdownEmployees);

  const commissionSettings = useEmployeeStore((state) => state.commissionSettings);
  const fetchCommissionSettings = useEmployeeStore((state) => state.fetchCommissionSettings);

  // State to prevent infinite loops
  const [hasFetchedEmployees, setHasFetchedEmployees] = useState(false);
  const [hasFetchedCommissions, setHasFetchedCommissions] = useState(false);
  const [hasFetchedPaymentMethods, setHasFetchedPaymentMethods] = useState(false);

  // Effect to ensure employees are loaded
  useEffect(() => {
    if (employees.length === 0 && !loading && !hasFetchedEmployees) {
      setHasFetchedEmployees(true);
      fetchDropdownEmployees();
    }
  }, [employees.length, loading, hasFetchedEmployees, fetchDropdownEmployees]);

  // Effect to ensure commission settings are loaded
  useEffect(() => {
    if (!commissionSettings || (Object.keys(commissionSettings).length === 0 && !loading && !hasFetchedCommissions)) {
      setHasFetchedCommissions(true);
      fetchCommissionSettings();
    }
  }, [commissionSettings, loading, hasFetchedCommissions, fetchCommissionSettings]);

  // Effect to ensure payment methods are loaded
  useEffect(() => {
    if (dropdownPaymentMethods.length === 0 && !loading && !hasFetchedPaymentMethods) {
      setHasFetchedPaymentMethods(true);
      fetchDropdownPaymentMethods();
    }
  }, [dropdownPaymentMethods.length, loading, hasFetchedPaymentMethods, fetchDropdownPaymentMethods]);

  // Helper function to round to 2 decimal places
  const roundTo2Decimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // ✅ FIXED: Helper function to calculate GST amount from GST-exclusive price
  const calculateGSTFromExclusive = (exclusiveAmount) => {
    // GST = exclusive amount * (rate / 100)
    return roundTo2Decimals(exclusiveAmount * (gstRate / 100));
  };

  // ✅ FIXED: Helper function to calculate GST-inclusive amount from GST-exclusive price
  const calculateInclusiveFromExclusive = (exclusiveAmount) => {
    // Inclusive = exclusive amount + GST
    const gstAmount = calculateGSTFromExclusive(exclusiveAmount);
    return roundTo2Decimals(exclusiveAmount + gstAmount);
  };

  // Group items by type and create sections
  const groupedItems = {
    Services: cartItems.filter((item) => item.type === 'service'),
    Products: cartItems.filter((item) => item.type === 'product'),
    Packages: cartItems.filter((item) => item.type === 'package'),
    Vouchers: cartItems.filter((item) => item.type === 'member-voucher'),
    TransferMCP: cartItems.filter((item) => item.type === 'transferMCP'),
    TransferMV: cartItems.filter((item) => item.type === 'transferMV'),
  };

  // ✅ FIXED: Create payment sections with correct GST logic
  const getPaymentSections = () => {
    const sections = [];

    // Services + Products combined section (mandatory)
    const servicesAndProducts = [...groupedItems.Services, ...groupedItems.Products];
    if (servicesAndProducts.length > 0) {
      // ✅ FIX: Treat totalLinePrice as EXCLUSIVE amount
      const totalExclusiveAmount = roundTo2Decimals(
        servicesAndProducts.reduce((total, item) => {
          const pricing = getItemPricing(item.id);
          return total + pricing.totalLinePrice; // This is exclusive amount (e.g., $128)
        }, 0)
      );

      // ✅ FIX: Calculate GST on the exclusive amount
      const gstAmount = calculateGSTFromExclusive(totalExclusiveAmount); // $128 × 9% = $11.52
      const inclusiveAmount = totalExclusiveAmount + gstAmount; // $128 + $11.52 = $139.52

      sections.push({
        id: 'services-products',
        title: 'Services & Products (Required)',
        inclusiveAmount: inclusiveAmount, // $139.52 (what customer pays)
        exclusiveAmount: totalExclusiveAmount, // $128.00 (item price without GST)
        gstAmount: gstAmount, // $11.52 (GST amount)
        required: true,
        items: servicesAndProducts,
        // Add GST breakdown for backend
        gstBreakdown: {
          inclusiveTotal: inclusiveAmount, // $139.52
          exclusiveTotal: totalExclusiveAmount, // $128.00
          gstTotal: gstAmount, // $11.52
          gstRate: gstRate, // 9
        },
      });
    }

    // Individual sections for Packages
    groupedItems.Packages.forEach((item) => {
      const pricing = getItemPricing(item.id);
      const exclusiveAmount = roundTo2Decimals(pricing.totalLinePrice); // Treat as exclusive
      const gstAmount = calculateGSTFromExclusive(exclusiveAmount);
      const inclusiveAmount = exclusiveAmount + gstAmount;

      sections.push({
        id: `package-${item.id}`,
        title: `Package: ${item.data?.name || 'Unnamed Package'}`,
        inclusiveAmount: inclusiveAmount, // Customer pays this
        exclusiveAmount: exclusiveAmount, // Base package price
        gstAmount: gstAmount, // GST added
        required: false,
        items: [item],
        // Add GST breakdown for backend
        gstBreakdown: {
          inclusiveTotal: inclusiveAmount,
          exclusiveTotal: exclusiveAmount,
          gstTotal: gstAmount,
          gstRate: gstRate,
        },
      });
    });

    // Individual sections for Vouchers
    groupedItems.Vouchers.forEach((item) => {
      const pricing = getItemPricing(item.id);
      const exclusiveAmount = roundTo2Decimals(pricing.totalLinePrice); // Treat as exclusive
      const gstAmount = calculateGSTFromExclusive(exclusiveAmount);
      const inclusiveAmount = exclusiveAmount + gstAmount;

      sections.push({
        id: `voucher-${item.id}`,
        title: `Voucher: ${item.data?.member_voucher_name || 'Unnamed Voucher'}`,
        inclusiveAmount: inclusiveAmount,
        exclusiveAmount: exclusiveAmount,
        gstAmount: gstAmount,
        required: false,
        items: [item],
        // Add GST breakdown for backend
        gstBreakdown: {
          inclusiveTotal: inclusiveAmount,
          exclusiveTotal: exclusiveAmount,
          gstTotal: gstAmount,
          gstRate: gstRate,
        },
      });
    });

    // Individual sections for MCP Transfers - NO GST (non-revenue)
    groupedItems.TransferMCP.forEach((item) => {
      const pricing = getItemPricing(item.id);
      const amount = roundTo2Decimals(pricing.totalLinePrice);

      sections.push({
        id: `transfer-mcp-${item.id}`,
        title: `MCP Transfer: ${item.data?.description || item.data?.name || 'MCP Balance Transfer'}`,
        inclusiveAmount: amount,
        exclusiveAmount: amount, // No GST for transfers
        gstAmount: 0,
        required: false,
        items: [item],
        isTransfer: true,
        gstBreakdown: {
          inclusiveTotal: amount,
          exclusiveTotal: amount,
          gstTotal: 0,
          gstRate: 0,
        },
      });
    });

    // Individual sections for MV Transfers - Include GST
    groupedItems.TransferMV.forEach((item) => {
      const pricing = getItemPricing(item.id);
      const totalExclusiveAmount = roundTo2Decimals(pricing.totalLinePrice);
      const transferAmount = roundTo2Decimals(item.data?.transferAmount || 0);

      const gstAmount = calculateGSTFromExclusive(totalExclusiveAmount);
      const inclusiveAmount = totalExclusiveAmount + gstAmount;

      sections.push({
        id: `transfer-mv-${item.id}`,
        title: `MV Transfer: ${item.data?.description || item.data?.name || 'Member Voucher Transfer'}`,
        inclusiveAmount: inclusiveAmount,
        exclusiveAmount: totalExclusiveAmount,
        gstAmount: gstAmount,
        transferAmount: transferAmount,
        required: false,
        items: [item],
        isPartialTransfer: true,
        // Add GST breakdown for backend
        gstBreakdown: {
          inclusiveTotal: inclusiveAmount,
          exclusiveTotal: totalExclusiveAmount,
          gstTotal: gstAmount,
          gstRate: gstRate,
        },
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
        // ✅ Commission calculated on exclusive amount (totalLinePrice)
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
      newPricing.customPrice = roundTo2Decimals(numValue);
      newPricing.discount = 1;
      newPricing.finalUnitPrice = roundTo2Decimals(numValue);
    } else if (field === 'discount') {
      const discountValue = Math.max(0, Math.min(1, numValue));
      newPricing.discount = roundTo2Decimals(discountValue);
      newPricing.customPrice = 0;
      newPricing.finalUnitPrice = roundTo2Decimals(newPricing.originalPrice * discountValue);
    }

    // ✅ totalLinePrice remains as exclusive amount
    newPricing.totalLinePrice = roundTo2Decimals(newPricing.finalUnitPrice * newPricing.quantity);
    return newPricing;
  };

  // Get item pricing data
  const getItemPricing = (itemId) => {
    const pricing = itemPricing[itemId] || {
      originalPrice: 0,
      customPrice: 0,
      discount: 1,
      quantity: 1,
      finalUnitPrice: 0,
      totalLinePrice: 0,
    };

    return {
      originalPrice: roundTo2Decimals(pricing.originalPrice),
      customPrice: roundTo2Decimals(pricing.customPrice),
      discount: roundTo2Decimals(pricing.discount),
      quantity: pricing.quantity,
      finalUnitPrice: roundTo2Decimals(pricing.finalUnitPrice),
      totalLinePrice: roundTo2Decimals(pricing.totalLinePrice),
    };
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
      const commissionKey = item.type === 'member-voucher' ? 'member-voucher' : item.type;

      rawRate =
        commissionSettings[commissionKey] ||
        // only if commissionKey is missing, use overall default
        commissionSettings['default'] ||
        // if that's missing, use our literal
        rawRate;
    }

    const defaultCommRate = parseFloat(rawRate);
    console.log('Selected commission rate:', defaultCommRate, 'for item type:', item.type);

    // ✅ Commission calculated on exclusive amount (totalLinePrice)
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
    const assignmentSummary = allAssignments.map((emp) => ({
      ...emp,
      displayName: `${emp.employeeName} (${emp.performanceRate}%)`,
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
          displayName: `${assignment.employeeName} (${equalRate}%)`, // Add this line
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
          displayName: `${emp?.employee_name || ''} (${perfRate.toFixed(2)}%)`,
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
    const method = dropdownPaymentMethods.find((m) => m.id == methodId);
    const methodName = method ? method.payment_method_name : `Payment Method ${methodId}`;

    const newPayment = {
      id: crypto.randomUUID(),
      methodId: parseInt(methodId),
      methodName: methodName,
      amount: 0,
      remark: '',
    };

    onPaymentChange('add', sectionId, newPayment);
    onSelectedPaymentMethodChange(sectionId, '');
  };

  // Remove payment method from section
  const removePaymentMethod = (sectionId, paymentId) => {
    onPaymentChange('remove', sectionId, paymentId);
  };

  // Update payment amount
const updatePaymentAmount = (sectionId, paymentId, amount) => {
  const numAmount = roundTo2Decimals(parseFloat(amount) || 0);
  const section = paymentSections.find((s) => s.id === sectionId);
  const currentPayments = sectionPayments[sectionId] || [];

  const otherPaymentsTotal = roundTo2Decimals(
    currentPayments.filter((p) => p.id !== paymentId).reduce((sum, p) => sum + p.amount, 0)
  );

  // ✅ CRITICAL FIX: Make sure we're using the INCLUSIVE amount (with GST)
  // This should be section.inclusiveAmount, NOT section.amount
  const maxAllowed = section ? roundTo2Decimals(section.inclusiveAmount - otherPaymentsTotal) : numAmount;
  const clampedAmount = roundTo2Decimals(Math.min(numAmount, Math.max(0, maxAllowed)));

  if (numAmount > maxAllowed && maxAllowed >= 0) {
    console.warn(`Payment amount limited from ${numAmount} to ${clampedAmount} for section ${sectionId}`);
  }

  // Add debugging to see what's being passed
  console.log('💳 Payment Amount Update Debug:', {
    sectionId,
    paymentId,
    inputAmount: numAmount,
    sectionInclusiveAmount: section?.inclusiveAmount,
    sectionExclusiveAmount: section?.exclusiveAmount,
    sectionGstAmount: section?.gstAmount,
    otherPaymentsTotal,
    maxAllowed,
    clampedAmount
  });

  onPaymentChange('updateAmount', sectionId, { paymentId, amount: clampedAmount });
};

  // Update payment remark
  const updatePaymentRemark = (sectionId, paymentId, remark) => {
    onPaymentChange('updateRemark', sectionId, { paymentId, remark });
  };

  // Get total payment for a section
  const getSectionPaymentTotal = (sectionId) => {
    const payments = sectionPayments[sectionId] || [];
    return roundTo2Decimals(payments.reduce((total, payment) => total + payment.amount, 0));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return (roundTo2Decimals(amount) || 0).toLocaleString('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const paymentSections = getPaymentSections();

  // Auto-add transfer payments when transfer sections are created
  const autoAddTransferPayment = (sectionId, transferAmount, isPartialTransfer = false) => {
    if (processedTransferSections.current.has(sectionId)) {
      return;
    }

    const existingPayments = sectionPayments[sectionId] || [];
    const hasPayments = existingPayments.length > 0;

    if (!hasPayments && transferAmount > 0) {
      const transferPayment = {
        id: crypto.randomUUID(),
        methodId: 9,
        methodName: 'Transfer',
        amount: roundTo2Decimals(transferAmount),
        remark: isPartialTransfer ? 'Auto-generated partial transfer payment' : 'Auto-generated transfer payment',
      };

      onPaymentChange('add', sectionId, transferPayment);
      processedTransferSections.current.add(sectionId);

      console.log(`Auto-added transfer payment for ${sectionId} with amount: ${transferAmount}`);
    }
  };

  // Effect to auto-add transfer payments when transfer sections are created
  useEffect(() => {
    const paymentSections = getPaymentSections();

    paymentSections.forEach((section) => {
      if (section.id.startsWith('transfer-mcp-')) {
        autoAddTransferPayment(section.id, section.inclusiveAmount, false);
      } else if (section.id.startsWith('transfer-mv-')) {
        const transferAmount = section.transferAmount || 0;
        autoAddTransferPayment(section.id, transferAmount, section.isPartialTransfer);
      }
    });
  }, [cartItems, itemPricing]);

  // Reset processed sections when cart items change significantly
  useEffect(() => {
    const currentSectionIds = paymentSections.map((section) => section.id);

    const processedTransferIds = Array.from(processedTransferSections.current);
    processedTransferIds.forEach((id) => {
      if (!currentSectionIds.includes(id)) {
        processedTransferSections.current.delete(id);
      }
    });
  }, [cartItems]);

  // Show loading state if GST rate is still being fetched
  if (gstLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='text-gray-600'>Loading GST rate...</div>
      </div>
    );
  }

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
              <div className='text-right'>
                {/* ✅ FIXED: Clear display of total customer pays */}
                <div className='text-sm text-gray-500'>Customer Total</div>
                <div className='text-lg font-bold text-green-600'>{formatCurrency(section.inclusiveAmount)}</div>

                {/* Show breakdown for partial transfers */}
                {section.isPartialTransfer && (
                  <div className='text-xs text-gray-600 mt-1'>
                    <div>Transfer: {formatCurrency(section.transferAmount)}</div>
                    <div>Remaining: {formatCurrency(section.inclusiveAmount - section.transferAmount)}</div>
                  </div>
                )}

                {/* ✅ FIXED: Show clear breakdown - item price + GST = customer total */}
                <div className='text-xs text-gray-500 mt-1'>
                  <div>Item price (excl. GST): {formatCurrency(section.exclusiveAmount)}</div>
                  <div>
                    GST ({gstRate}%): + {formatCurrency(section.gstAmount)}
                  </div>
                  <div className='border-t border-gray-300 pt-1 font-medium text-green-600'>
                    = Customer pays: {formatCurrency(section.inclusiveAmount)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Items Table */}
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Item
                    </th>
                    <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Qty
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Original Price (excl. GST)
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Custom Price (excl. GST)
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Payment Ratio
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Final Unit Price (excl. GST)
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Total Line Price (excl. GST)
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Employee Commission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => {
                    const pricing = getItemPricing(item.id);
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
                            {item.data?.description && (
                              <div className='text-xs text-gray-500 truncate max-w-xs'>{item.data.description}</div>
                            )}
                            {item.type === 'member-voucher' && (
                              <div className='text-xs text-blue-500 mt-1'>
                                {item.data?.starting_balance
                                  ? `Balance: ${formatCurrency(item.data.starting_balance)}`
                                  : ''}
                                {item.data?.free_of_charge > 0
                                  ? ` (FOC: ${formatCurrency(item.data.free_of_charge)})`
                                  : ''}
                              </div>
                            )}
                            {/* Show transfer breakdown for MV transfers */}
                            {item.type === 'transferMV' && item.data?.transferAmount && (
                              <div className='text-xs text-orange-600 mt-1'>
                                Transfer Amount: {formatCurrency(item.data.transferAmount)}
                              </div>
                            )}
                            {/* ✅ FIXED: Show GST calculation for this item */}
                            {item.type !== 'transferMCP' && pricing.totalLinePrice > 0 && (
                              <div className='text-xs text-green-600 mt-1 font-medium'>
                                {formatCurrency(pricing.totalLinePrice)} + GST ({gstRate}%):{' '}
                                {formatCurrency(calculateGSTFromExclusive(pricing.totalLinePrice))}
                                <br />
                                <span className='font-bold'>
                                  Customer pays:{' '}
                                  {formatCurrency(calculateInclusiveFromExclusive(pricing.totalLinePrice))}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            {item.type === 'member-voucher' ? (
                              <span className='text-gray-500'>-</span>
                            ) : (
                              <input
                                type='number'
                                min='1'
                                value={pricing.quantity}
                                onChange={(e) => updateItemPricing(item.id, 'quantity', e.target.value)}
                                className='w-16 p-1 border border-gray-300 rounded text-center text-sm'
                              />
                            )}
                          </td>
                          <td className='px-4 py-3 text-right text-gray-900'>
                            {formatCurrency(pricing.originalPrice)}
                          </td>
                          <td className='px-4 py-3 text-right'>
                            {item.type === 'member-voucher' ? (
                              <span className='text-gray-500'>-</span>
                            ) : (
                              <input
                                type='number'
                                min='0'
                                step='0.01'
                                value={pricing.customPrice || ''}
                                onChange={(e) => updateItemPricing(item.id, 'customPrice', e.target.value)}
                                placeholder='0.00'
                                className='w-20 p-1 border border-gray-300 rounded text-right text-sm'
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
                            {/* ✅ Show customer total for this line */}
                            {item.type !== 'transferMCP' && pricing.totalLinePrice > 0 && (
                              <div className='text-xs text-green-600 font-normal'>
                                Cust. total: {formatCurrency(calculateInclusiveFromExclusive(pricing.totalLinePrice))}
                              </div>
                            )}
                          </td>
                          <td className='px-4 py-3'>
                            {/* Add Employee Section */}
                            <div className='flex items-center gap-2'>
                              <div className='flex-1'>
                                <EmployeeSelect
                                  name='employee_id'
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
                          </td>
                        </tr>
                        {/* Employee Assignment Rows */}
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
                                      Performance Amount (excl. GST)
                                    </label>
                                    <div className='w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm'>
                                      {formatCurrency(assignment.performanceAmount)}
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                      Based on: {formatCurrency(pricing.totalLinePrice)} (excl. GST)
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
                    <td colSpan={6} className='px-4 py-3 text-right font-medium'>
                      Section Total (excl. GST):
                    </td>
                    <td className='px-4 py-3 text-right font-bold text-lg'>
                      {formatCurrency(section.exclusiveAmount)}
                    </td>
                    <td className='px-4 py-3'></td>
                  </tr>
                  <tr className='bg-green-50'>
                    <td colSpan={6} className='px-4 py-3 text-right font-medium text-green-700'>
                      Customer Pays (incl. GST):
                    </td>
                    <td className='px-4 py-3 text-right font-bold text-lg text-green-700'>
                      {formatCurrency(section.inclusiveAmount)}
                    </td>
                    <td className='px-4 py-3'></td>
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
                    const currentPayments = sectionPayments[section.id] || [];
                    const otherPaymentsTotal = roundTo2Decimals(
                      currentPayments.filter((p) => p.id !== payment.id).reduce((sum, p) => sum + p.amount, 0)
                    );

                    const maxAllowed = roundTo2Decimals(section.inclusiveAmount - otherPaymentsTotal);

                    return (
                      <div key={payment.id} className='flex items-center gap-3 p-3 rounded-md bg-gray-50'>
                        <div className='flex-shrink-0 w-32'>
                          <span className='text-sm font-medium'>{payment.methodName}</span>
                        </div>
                        <div className='flex-1'>
                          <input
                            type='number'
                            min='0'
                            max={maxAllowed}
                            step='0.01'
                            placeholder='Enter amount'
                            value={roundTo2Decimals(payment.amount) || ''}
                            onChange={(e) => updatePaymentAmount(section.id, payment.id, e.target.value)}
                            className='w-full p-2 border border-gray-300 rounded-md text-sm'
                          />
                          {maxAllowed < section.inclusiveAmount && maxAllowed >= 0 && (
                            <div className='text-xs text-gray-500 mt-1'>Max: {formatCurrency(maxAllowed)}</div>
                          )}
                          {maxAllowed <= 0 && <div className='text-xs text-orange-500 mt-1'>Section fully paid</div>}
                        </div>
                        <div className='flex-1'>
                          <input
                            type='text'
                            placeholder='Remark (optional)'
                            value={payment.remark}
                            onChange={(e) => updatePaymentRemark(section.id, payment.id, e.target.value)}
                            className='w-full p-2 border border-gray-300 rounded-md text-sm'
                          />
                        </div>
                        <button
                          onClick={() => removePaymentMethod(section.id, payment.id)}
                          className='p-2 text-red-600 hover:bg-red-100 rounded-md'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Summary */}
              <div className='mt-4 pt-3 border-t'>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Total Payment Made:</span>
                    <span className='font-bold text-lg text-green-600'>
                      {formatCurrency(getSectionPaymentTotal(section.id))}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-500'>Customer should pay (incl. GST):</span>
                    <span className='text-sm font-medium'>{formatCurrency(section.inclusiveAmount)}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-500'>Remaining to pay:</span>
                    <span
                      className={`text-sm font-medium ${
                        roundTo2Decimals(section.inclusiveAmount - getSectionPaymentTotal(section.id)) === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(section.inclusiveAmount - getSectionPaymentTotal(section.id))}
                    </span>
                  </div>

                  {/* ✅ FIXED: GST Information Panel */}
                  <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                    <div className='text-sm font-medium text-blue-800 mb-2'>Transaction Breakdown</div>
                    <div className='grid grid-cols-3 gap-4 text-sm'>
                      <div>
                        <span className='text-blue-600'>Item price (excl. GST):</span>
                        <div className='font-medium'>{formatCurrency(section.exclusiveAmount)}</div>
                      </div>
                      <div>
                        <span className='text-blue-600'>GST ({gstRate}%):</span>
                        <div className='font-medium'>+ {formatCurrency(section.gstAmount)}</div>
                      </div>
                      <div>
                        <span className='text-blue-600'>Customer pays:</span>
                        <div className='font-bold text-green-600'>{formatCurrency(section.inclusiveAmount)}</div>
                      </div>
                    </div>
                  </div>
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

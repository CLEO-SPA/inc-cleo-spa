import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../../interceptors/axios';
import EmployeeModal from './EmployeeModal';
import React from 'react';

const InvoiceSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLines, selectedMember } = location.state || {
    selectedLines: [],
  }; // Retrieve passed data

  // State for manual invoice number and invoice remark
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceRemark, setInvoiceRemark] = useState('');

  // State for employee data
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [paymentHandlers, setPaymentHandlers] = useState([]);
  const [paymentHandlerId, setPaymentHandlerId] = useState('');
  const [paymentHandlerCode, setPaymentHandlerCode] = useState('');
  const [paymentHandlerName, setPaymentHandlerName] = useState('');
  const [pendingInvoiceRemark, setPendingInvoiceRemark] = useState('');

  const [isInvoiceHandlerModalOpen, setIsInvoiceHandlerModalOpen] = useState(false);
  const [isPaymentHandlerModalOpen, setIsPaymentHandlerModalOpen] = useState(false);

  // Add this new state at the top of the component with other states
  const [selectedPackageServices, setSelectedPackageServices] = useState({});

  // Add this validation function near the top of the component with other utility functions
  const isPaymentValid = () => {
    const currentPayment = totalPayable - remainingAmount;
    return (
      // Check if payment equals mandatory amount exactly
      currentPayment === mandatoryAmount &&
      // Check if both handlers are assigned
      employeeId &&
      paymentHandlerId
    );
  };

  // Effect to dynamically find the employee when the code fully matches
  useEffect(() => {
    if (!employeeCode) {
      // Clear name if code is empty
      setEmployeeName('');
      return;
    }

    const employee = employees.find((emp) => emp.employee_code.toLowerCase() === employeeCode.toLowerCase());
    if (employee) {
      setEmployeeName(employee.employee_name);
      setEmployeeId(employee.employee_id);
    }
  }, [employeeCode, employees]); // Add employees to dependency array

  // Function to handle clicking on the displayed employee name
  const handleEmployeeNameClick = () => {
    const employee = employees.find((emp) => emp.employee_code.toLowerCase() === employeeCode.toLowerCase());
    if (employee) {
      setEmployeeId(employee.employee_id);
      setEmployeeCode(employee.employee_code); // Set employee code
      setEmployeeName(employee.employee_name); // Set employee name
    }
  };

  // Dynamically find the payment handler by code
  useEffect(() => {
    if (!paymentHandlerCode) {
      // Clear name if code is empty
      setPaymentHandlerName('');
      return;
    }

    const handler = paymentHandlers.find(
      (handler) => handler.employee_code.toLowerCase() === paymentHandlerCode.toLowerCase()
    );
    if (handler) {
      setPaymentHandlerName(handler.employee_name);
      setPaymentHandlerId(handler.employee_id);
    }
  }, [paymentHandlerCode, paymentHandlers]); // Add paymentHandlers to dependency array

  // Function to handle clicking on the displayed handler name
  const handlePaymentHandlerNameClick = () => {
    const handler = paymentHandlers.find(
      (handler) => handler.employee_code.toLowerCase() === paymentHandlerCode.toLowerCase()
    );
    if (handler) {
      setPaymentHandlerId(handler.employee_id);
      setPaymentHandlerCode(handler.employee_code); // Set handler code
      setPaymentHandlerName(handler.employee_name); // Set handler name
    }
  };

  const handleInvoiceHandlerSelect = (employee) => {
    setEmployeeId(employee.employee_id);
    setEmployeeCode(employee.employee_code);
    setEmployeeName(employee.employee_name);
    setIsInvoiceHandlerModalOpen(false);
  };

  const handlePaymentHandlerSelect = (employee) => {
    setPaymentHandlerId(employee.employee_id);
    setPaymentHandlerCode(employee.employee_code);
    setPaymentHandlerName(employee.employee_name);
    setIsPaymentHandlerModalOpen(false);
  };

  // State for payment breakdown
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);

  // State for warning
  const [warnings, setWarnings] = useState({});

  // Total payable amount
  const totalPayable = selectedLines.reduce((total, line) => total + Number(line.lineTotal), 0);

  // Update the handleAddPackageService function
  const handleAddPackageService = (packageId, detail) => {
    const serviceKey = `${detail.member_care_package_details_id}_${detail.member_care_package_id}`;

    setSelectedPackageServices((prev) => {
      // Check if this package already has services
      const existingServices = prev[packageId] || [];

      // Check if this service is already added
      const serviceExists = existingServices.some((s) => s.serviceKey === serviceKey);

      // If service already exists, don't add it again
      if (serviceExists) {
        return prev;
      }

      // Add new service
      return {
        ...prev,
        [packageId]: [
          ...existingServices,
          {
            serviceKey,
            member_care_package_id: detail.member_care_package_id,
            member_care_package_details_id: detail.member_care_package_details_id,
            service_name: detail.service_name,
            member_care_package_details_unit_price: Number(detail.member_care_package_details_unit_price),
            service_default_price: Number(detail.service_default_price),
            member_care_package_details_quantity: detail.member_care_package_details_quantity,
          },
        ],
      };
    });
  };

  // Add this new function after handleAddPackageService
  const handleRemovePackageService = (packageId, serviceKey) => {
    setSelectedPackageServices((prev) => ({
      ...prev,
      [packageId]: prev[packageId].filter((service) => service.serviceKey !== serviceKey),
    }));
  };

  // Update the mandatoryAmount calculation to include selected package services
  const mandatoryAmount = selectedLines.reduce((total, line) => {
    if (line.id.startsWith('S') || line.id.startsWith('P')) {
      return total + Number(line.lineTotal);
    }
    // Use package price for selected services
    if (line.id.startsWith('C') && selectedPackageServices[line.id]) {
      const packageServiceTotal = selectedPackageServices[line.id].reduce(
        (sum, service) => sum + Number(service.member_care_package_details_unit_price),
        0
      );
      return total + packageServiceTotal;
    }
    return total;
  }, 0);

  // State for remaining amount to pay
  const [remainingAmount, setRemainingAmount] = useState(totalPayable);

  // Disable other fields if total payable amount is reached
  const isPaymentComplete = remainingAmount === 0;

  const [paymentMethods, setPaymentMethods] = useState([]);
  useEffect(() => {
    // Fetch and filter payment methods
    const fetchPaymentMethods = async () => {
      try {
        const res = await api.get(`ci/getAllPaymentMethods`);
        const data = res.data;

        // Filter and map the methods as required
        const filteredMethods = data.data
          .filter((method) => ['1', '3', '4', '5', '7'].includes(method.payment_method_id))
          .map((method) => ({
            id: parseInt(method.payment_method_id, 10),
            name: method.payment_method_name,
          }));

        setPaymentMethods(filteredMethods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Update the handlePaymentChange function to enforce exact payment
  const handlePaymentChange = (methodId, value) => {
    let amount = parseFloat(value) || 0;

    setPaymentBreakdown((prev) => {
      // Get current total excluding this method
      const otherPayments = prev.filter((item) => item.id !== methodId).reduce((sum, item) => sum + item.amount, 0);

      // Calculate maximum allowed amount for this payment
      const maxAllowed = mandatoryAmount - otherPayments;

      // If amount exceeds maximum allowed, adjust it
      if (amount > maxAllowed) {
        amount = maxAllowed;
        // Show warning that amount was adjusted
        setWarnings((prevWarnings) => ({
          ...prevWarnings,
          [methodId]: `Amount adjusted to maximum allowed: $${maxAllowed.toFixed(2)}`,
        }));
      } else {
        // Clear warning if amount is valid
        setWarnings((prevWarnings) => ({
          ...prevWarnings,
          [methodId]: '',
        }));
      }

      // Update payment breakdown
      const updatedBreakdown = prev
        .filter((item) => item.id !== methodId || amount > 0)
        .map((item) => (item.id === methodId ? { ...item, amount, remark: item.remark || '' } : item));

      // Add new payment if it doesn't exist and amount > 0
      if (!updatedBreakdown.find((item) => item.id === methodId) && amount > 0) {
        updatedBreakdown.push({
          id: methodId,
          name: paymentMethods.find((m) => m.id === methodId).name,
          amount,
          remark: '',
        });
      }

      const totalPaid = updatedBreakdown.reduce((total, item) => total + item.amount, 0);
      const newRemainingAmount = totalPayable - totalPaid;
      setRemainingAmount(newRemainingAmount);

      return updatedBreakdown;
    });
  };

  useEffect(() => {
    const totalPaid = paymentBreakdown.reduce((total, item) => total + item.amount, 0);
    const newRemainingAmount = totalPayable - totalPaid;
    setRemainingAmount(newRemainingAmount);
  }, [paymentBreakdown]);

  const isFieldDisabled = (methodId) => {
    const totalPaid = paymentBreakdown.reduce((total, item) => total + item.amount, 0);
    return remainingAmount <= 0 && !paymentBreakdown.some((item) => item.id === methodId);
  };

  // Group lines into two categories: Products and Services
  const groupedLines = {
    Services: selectedLines.filter((line) => line.id.startsWith('S')), // Items with id prefix "S"
    Products: selectedLines.filter((line) => line.id.startsWith('P')), // Items with id prefix "P"
    Packages: selectedLines.filter((line) => line.id.startsWith('C')), // Items with id prefix "C"
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const MessageModal = ({ open, message, onClose }) => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
          <p className="text-lg font-medium mb-4">{message}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  };

  // Update the handleConfirmPayment function to include package details
  const handleConfirmPayment = async () => {
    // Add validation check
    if (totalPayable - remainingAmount < mandatoryAmount) {
      setModalMessage(`Minimum payment of $${mandatoryAmount.toFixed(2)} required for Services and Products`);
      setModalOpen(true);
      return;
    }

    // Format selected package services for the payload
    const formattedPackageServices = Object.entries(selectedPackageServices).reduce((acc, [packageId, services]) => {
      return [
        ...acc,
        ...services.map((service) => ({
          member_care_package_id: service.member_care_package_id,
          member_care_package_details_id: service.member_care_package_details_id,
          service_name: service.service_name,
          member_care_package_details_unit_price: service.member_care_package_details_unit_price,
          service_default_price: service.service_default_price,
        })),
      ];
    }, []);

    let updatedPaymentBreakdown = [...paymentBreakdown];

    if (remainingAmount > 0) {
      updatedPaymentBreakdown.push({
        id: 7,
        name: '挂起 Create a pending invoice',
        amount: remainingAmount,
        remark: pendingInvoiceRemark,
      });
    }

    // Prepare the payload
    const payload = {
      selectedMember: {
        id: selectedMember?.id || 1, // Use 1 for walk-in customers
        name: selectedMember?.name || 'Walk-in Customer',
      },
      invoiceNumber,
      invoiceRemark,
      invoiceHandler: {
        id: employeeId,
        code: employeeCode,
        name: employeeName,
      },
      paymentHandler: {
        id: paymentHandlerId,
        code: paymentHandlerCode,
        name: paymentHandlerName,
      },
      lines: {
        Services: groupedLines.Services,
        Products: groupedLines.Products,
        Packages: groupedLines.Packages,
      },
      payment: {
        breakdown: updatedPaymentBreakdown,
        totalPayable,
        remainingAmount,
        selectedPackageServices: formattedPackageServices, // Send formatted package services
      },
    };

    console.log('Payload:', payload);

    try {
      const res = await api.post('/ci/createInvoice', {
        payload,
      });

      if (res.status === 200 || res.status === 201) {
        setModalMessage('Invoice created successfully!');
      } else {
        console.error('Error creating invoice:', res.data.message);
        setModalMessage('Error creating invoice. Please try again!');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setModalMessage('An error occurred while creating the invoice.');
    } finally {
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Redirect and force page reload
    window.location.href = '/ci';
  };

  // Add the force reload handler
  const handleBack = () => {
    window.location.href = '/ci';
  };

  // Add this effect after your existing state declarations
  useEffect(() => {
    // Auto-select zero-price services
    Object.keys(groupedLines).forEach((group) => {
      if (group === 'Packages') {
        groupedLines[group].forEach((line) => {
          if (line.packageDetails) {
            line.packageDetails.forEach((detail) => {
              if (Number(detail.member_care_package_details_unit_price) === 0) {
                handleAddPackageService(line.id, {
                  ...detail,
                  member_care_package_id: line.member_care_package_id,
                });
              }
            });
          }
        });
      }
    });
  }, [groupedLines]); // Run when groupedLines changes

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Payment Summary</h1>
      </div>

      {/* Manual Invoice Number */}
      <div className="mb-4">
        <label htmlFor="invoiceNumber" className="font-bold block mb-2">
          Manual Invoice Number:
        </label>
        <input
          id="invoiceNumber"
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Enter manual invoice number"
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <textarea
        placeholder="Enter remark"
        value={invoiceRemark}
        onChange={(e) => setInvoiceRemark(e.target.value)} // Capture user input
        className="w-full p-2 border border-gray-300 rounded resize-none"
      />

      {/* Search Employee by Code */}
      <div className="mb-6">
        <label className="font-bold block mb-2">Invoice Handler:</label>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={employeeCode}
            placeholder="Click to select employee"
            className="flex-1 p-2 border border-gray-300 rounded"
            readOnly
            onClick={() => setIsInvoiceHandlerModalOpen(true)}
          />
          <button
            type="button"
            onClick={() => setIsInvoiceHandlerModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select Employee
          </button>
        </div>
        {employeeName && (
          <div className="mt-2 text-blue-600">
            <strong>Selected:</strong> {employeeName}
          </div>
        )}
      </div>

      {/* Grouped Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-center">Quantity</th>
              <th className="px-4 py-3 text-right">Original Price</th>
              <th className="px-4 py-3 text-right">Custom Price</th>
              <th className="px-4 py-3 text-center">Discount</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Assigned Employee</th>
              <th className="px-4 py-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {/* Render grouped rows */}
            {Object.keys(groupedLines).map((group) => (
              <React.Fragment key={group}>
                {/* Group header */}
                <tr className="bg-blue-50">
                  <td colSpan="9" className="px-4 py-3 font-bold">
                    {group}
                  </td>
                </tr>
                {/* Group items */}
                {groupedLines[group].map((line, index) => (
                  <React.Fragment key={index}>
                    {/* Main item row */}
                    <tr className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="px-4 py-3">{line.name}</td>
                      <td className="px-4 py-3">{line.type || line.category}</td>
                      <td className="px-4 py-3 text-center">{line.quantity}</td>
                      <td className="px-4 py-3 text-right">${Number(line.originalPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${Number(line.customPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">{Number(line.discount || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right">${Number(line.lineTotal).toFixed(2)}</td>
                      <td className="px-4 py-3">{line.assignedEmployee || '-'}</td>
                      <td className="px-4 py-3">{line.itemRemark || '-'}</td>
                    </tr>

                    {/* Package service details in separate full-width rows */}
                    {line.packageDetails &&
                      line.packageDetails.map((detail, idx) => {
                        const serviceKey = `${detail.member_care_package_details_id}_${detail.member_care_package_id}`;
                        return (
                          <tr key={`${index}-${idx}`} className="bg-gray-50">
                            <td colSpan="9" className="px-4 py-2 border-b border-gray-200">
                              <div className="flex items-center justify-between pl-8">
                                <div className="flex items-center gap-4 flex-1">
                                  <button
                                    onClick={() => {
                                      const isSelected = selectedPackageServices[line.id]?.some(
                                        (s) => s.serviceKey === serviceKey
                                      );
                                      if (isSelected) {
                                        handleRemovePackageService(line.id, serviceKey);
                                      } else {
                                        handleAddPackageService(line.id, {
                                          ...detail,
                                          member_care_package_id: line.member_care_package_id,
                                          serviceKey,
                                        });
                                      }
                                    }}
                                    className={`px-3 py-1 text-sm rounded-full ${
                                      selectedPackageServices[line.id]?.some((s) => s.serviceKey === serviceKey)
                                        ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                  >
                                    {selectedPackageServices[line.id]?.some((s) => s.serviceKey === serviceKey)
                                      ? '✕ Remove'
                                      : '+ Add Service'}
                                  </button>
                                  <div className="flex-1">
                                    <div className="font-medium">{detail.service_name}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      Package Service {idx + 1} of {line.packageDetails.length}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-8 mr-4">
                                  <div className="text-right">
                                    <div className="text-sm text-gray-500">Package Price</div>
                                    <div className="font-medium">
                                      ${Number(detail.member_care_package_details_unit_price).toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-500">Service Price</div>
                                    <div className="font-medium text-blue-600">
                                      ${Number(detail.service_default_price).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {/* Summary row for selected services */}
                    {line.packageDetails && selectedPackageServices[line.id]?.length > 0 && (
                      <tr className="bg-green-50">
                        <td colSpan="9" className="px-4 py-2 border-b border-gray-200">
                          <div className="flex justify-between items-center pl-8">
                            <div className="font-medium text-green-700">
                              Selected Services ({selectedPackageServices[line.id].length})
                            </div>
                            <div className="font-medium text-green-700">
                              Total Added Package Value: $
                              {selectedPackageServices[line.id]
                                .reduce(
                                  (sum, service) => sum + Number(service.member_care_package_details_unit_price),
                                  0
                                )
                                .toFixed(2)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right font-bold text-lg mt-4">Total Payable Amount: ${totalPayable.toFixed(2)}</div>

      {/* Payment Handler Code */}
      <div className="mb-6">
        <label className="font-bold block mb-2">Payment Handler:</label>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={paymentHandlerCode}
            placeholder="Click to select employee"
            className="flex-1 p-2 border border-gray-300 rounded"
            readOnly
            onClick={() => setIsPaymentHandlerModalOpen(true)}
          />
          <button
            type="button"
            onClick={() => setIsPaymentHandlerModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select Employee
          </button>
        </div>
        {paymentHandlerName && (
          <div className="mt-2 text-blue-600">
            <strong>Selected:</strong> {paymentHandlerName}
          </div>
        )}
      </div>

      {/* Add this display above the payment options section */}
      <div className="mt-4 mb-2 flex justify-between items-center">
        <div className="text-left">
          <p className="font-bold text-lg text-red-600">
            Minimum Required Payment (Services + Products): ${mandatoryAmount.toFixed(2)}
          </p>
          <p className="font-bold text-lg">Current Payment: ${(totalPayable - remainingAmount).toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">Total Payable Amount: ${totalPayable.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment Options */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-4">Enter Payment Amount</h2>
        <div className="mb-4 space-y-4">
          {paymentMethods.map((method, index) => {
            const isLastMethod = index === paymentMethods.length - 1;
            return (
              <div key={method.id} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-4">
                  <label htmlFor={`payment-${method.id}`} className="w-32 font-bold">
                    {method.name}:
                  </label>
                  <input
                    id={`payment-${method.id}`}
                    type="number"
                    min="0"
                    placeholder={isLastMethod ? `Remaining Amount` : `Enter amount for ${method.name}`}
                    disabled={isLastMethod} // Make the last method non-editable
                    value={
                      isLastMethod
                        ? remainingAmount.toFixed(2) // Always show the remaining amount
                        : paymentBreakdown.find((item) => item.id === method.id)?.amount || ''
                    }
                    className={`flex-1 p-2 border ${
                      warnings[method.id] && !isLastMethod ? 'border-red-500' : 'border-gray-300'
                    } rounded ${isLastMethod ? 'bg-gray-100 text-gray-700' : ''}`} // Style for the last method
                    onChange={!isLastMethod ? (e) => handlePaymentChange(method.id, e.target.value) : undefined}
                  />
                </div>
                {/* Show warning below input field for all methods except the last */}
                {warnings[method.id] && !isLastMethod && <p className="text-red-500 text-sm">{warnings[method.id]}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-4">Payment Breakdown</h2>
        <ul className="list-disc pl-5 space-y-4">
          {paymentBreakdown.map((item) => (
            <li key={item.id} className="text-gray-700">
              <div className="flex items-center space-x-4">
                {/* Payment Method Name & Amount */}
                <div className="w-1/2 font-bold">
                  {item.name}: ${item.amount.toFixed(2)}
                </div>

                {/* Remark Textarea */}
                <textarea
                  placeholder="Enter remark"
                  value={item.remark || ''}
                  onChange={(e) =>
                    setPaymentBreakdown((prev) =>
                      prev.map((entry) => (entry.id === item.id ? { ...entry, remark: e.target.value } : entry))
                    )
                  }
                  className="w-1/2 p-2 border border-gray-300 rounded resize-none"
                />
              </div>
            </li>
          ))}

          {/* Pending Invoice Display */}
          {remainingAmount > 0 && paymentMethods.length > 0 && (
            <li className="text-gray-700 flex items-center space-x-4">
              <div className="w-1/2 font-bold">
                {paymentMethods[paymentMethods.length - 1].name}: ${remainingAmount.toFixed(2)}
              </div>
              <textarea
                placeholder="Enter remark"
                value={pendingInvoiceRemark}
                onChange={(e) => setPendingInvoiceRemark(e.target.value)} // Capture user input
                className="w-1/2 p-2 border border-gray-300 rounded resize-none"
              />
            </li>
          )}
        </ul>
      </div>

      {/* Replace the existing button with this one */}
      <button
        className={`mt-6 px-4 py-2 font-bold rounded ${
          isPaymentValid()
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
        }`}
        onClick={handleConfirmPayment}
        disabled={!isPaymentValid()}
        title={
          !employeeId || !paymentHandlerId
            ? 'Please select both Invoice Handler and Payment Handler'
            : totalPayable - remainingAmount !== mandatoryAmount
            ? `Payment must equal exactly $${mandatoryAmount.toFixed(2)}`
            : ''
        }
      >
        Confirm and Complete Payment
      </button>

      {/* Modal Component */}
      <MessageModal open={modalOpen} message={modalMessage} onClose={handleCloseModal} />

      <EmployeeModal
        isOpen={isInvoiceHandlerModalOpen}
        onClose={() => setIsInvoiceHandlerModalOpen(false)}
        onSelectEmployee={handleInvoiceHandlerSelect}
        selectedEmployee={{ employee_id: employeeId }}
      />

      <EmployeeModal
        isOpen={isPaymentHandlerModalOpen}
        onClose={() => setIsPaymentHandlerModalOpen(false)}
        onSelectEmployee={handlePaymentHandlerSelect}
        selectedEmployee={{ employee_id: paymentHandlerId }}
      />
    </div>
  );
};

export default InvoiceSummary;

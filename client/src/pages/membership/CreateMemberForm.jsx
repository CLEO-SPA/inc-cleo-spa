import React, { useState, useEffect } from 'react';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import PaymentMethodSelect from './PaymentMethodSelect';
import EmployeeSelect from './EmployeeSelect';
import MembershipSelect from './MembershipTypeSelect';
import { api } from '@/interceptors/axios';

const CreateMemberForm = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    member_contact: '',
    member_dob: '',
    member_sex: 'F',
    member_remarks: '',
    invoice_remarks: '',
    member_creation_datetime: '',
    invoice_creation_datetime: '',
    membership_type_id: '',
    stored_value_balance: '',
    total_invoice_amount: '',
    manual_invoice_no: '',
    payment_methods: [{ payment_method_id: 1, amount: 0 }],
    employee_ids: [{ employee_id: '', sharing_ratio: 100 }],
    employee_in_charge_of_invoice_employee_id: '',
    created_at: new Date().toISOString(),
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.member_name?.trim()) {
      newErrors.member_name = 'Name is required';
    }

    if (!formData.member_email?.trim()) {
      newErrors.member_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.member_email)) {
      newErrors.member_email = 'Please enter a valid email';
    }

    if (!formData.member_contact?.trim()) {
      newErrors.member_contact = 'Contact number is required';
    } else if (!/^\d{8}$/.test(formData.member_contact)) {
      newErrors.member_contact = 'Contact number must be exactly 8 digits';
    }

    // Payment methods validation
    const totalPaymentAmount = formData.payment_methods.reduce((sum, method) => sum + (Number(method.amount) || 0), 0);

    if (totalPaymentAmount !== Number(formData.total_invoice_amount)) {
      newErrors.payment_methods = 'Total payment amount must equal invoice amount';
    }

    // Employee sharing ratio validation
    const totalSharingRatio = formData.employee_ids.reduce((sum, emp) => sum + (Number(emp.sharing_ratio) || 0), 0);

    if (totalSharingRatio != 100) {
      newErrors.employee_sharing = 'Total sharing ratio must be 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate on form data changes
  useEffect(() => {
    const isValid = validateForm();
    setIsFormValid(isValid);
  }, [formData]);

  // Modified handleSubmit function

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setCurrentPage(2);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const response = await api.post('/m', formData);

      // Log and notify success
      console.log('Success:', response.data);
      alert('Member created successfully!');

      // Reset form fields
      setFormData({
        member_name: '',
        member_email: '',
        member_contact: '',
        member_dob: '',
        member_sex: 'F',
        member_remarks: '',
        invoice_remarks: '',
        member_creation_datetime: '',
        invoice_creation_datetime: '',
        membership_type_id: '',
        stored_value_balance: '',
        total_invoice_amount: '',
        manual_invoice_no: '',
        payment_methods: [{ payment_method_id: 1, amount: 0 }],
        employee_ids: [{ employee_id: '', sharing_ratio: 100 }],
        employee_in_charge_of_invoice_employee_id: '',
        created_at: new Date().toISOString(),
      });

      setCurrentPage(1); // Reset to first page if necessary
    } catch (error) {
      console.error('Error submitting form:', error);

      // Handle different error cases
      if (error.response) {
        alert(`Failed to submit: ${error.response.data.message || 'Please try again.'}`);
      } else {
        alert('Failed to submit. Please check your network connection.');
      }
    }
  };

  const ErrorMessage = ({ error }) => (error ? <p className="text-red-500 text-sm mt-1">{error}</p> : null);

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      payment_methods: [...formData.payment_methods, { payment_method_id: '', amount: 0 }],
    });
  };

  const updatePaymentMethod = (index, field, value) => {
    const updatedPaymentMethods = [...formData.payment_methods];
    updatedPaymentMethods[index] = {
      ...updatedPaymentMethods[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      payment_methods: updatedPaymentMethods,
    });
  };

  const addEmployee = () => {
    setFormData({
      ...formData,
      employee_ids: [...formData.employee_ids, { employee_id: '', sharing_ratio: 0 }],
    });
  };

  const updateEmployee = (index, field, value) => {
    const updatedEmployees = [...formData.employee_ids];
    updatedEmployees[index] = {
      ...updatedEmployees[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      employee_ids: updatedEmployees,
    });
  };

  const getTotalAmount = () => {
    return formData.payment_methods.reduce((sum, method) => sum + (method.amount || 0), 0);
  };

  const PreviewTable = () => (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full text-gray-900 border border-gray-300 bg-white shadow-md">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left border-b border-gray-300">Field</th>
            <th className="p-3 text-left border-b border-gray-300">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          <tr>
            <td className="p-3">Member Name</td>
            <td className="p-3">{formData.member_name}</td>
          </tr>
          <tr>
            <td className="p-3">Email</td>
            <td className="p-3">{formData.member_email}</td>
          </tr>
          <tr>
            <td className="p-3">Contact</td>
            <td className="p-3">{formData.member_contact}</td>
          </tr>
          <tr>
            <td className="p-3">Date of Birth</td>
            <td className="p-3">{formData.member_dob}</td>
          </tr>
          <tr>
            <td className="p-3">Sex</td>
            <td className="p-3">{formData.member_sex === 'M' ? 'Male' : 'Female'}</td>
          </tr>
          <tr>
            <td className="p-3">Total Amount</td>
            <td className="p-3">${getTotalAmount().toFixed(2)}</td>
          </tr>
          <tr>
            <td className="p-3">Created At</td>
            <td className="p-3">{new Date(formData.created_at).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Member Registration - Page {currentPage}</h1>
          <p className="text-gray-600 mb-6">
            {currentPage === 1 ? 'Enter member details and payment information' : 'Review and assign employees'}
          </p>

          {currentPage === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Member Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Member Information</h2>

                <Field label="Date and time of when this data was created inside the Maori system">
                  <input
                    type="datetime-local"
                    value={formData.member_creation_datetime}
                    onChange={(e) => setFormData({ ...formData, member_creation_datetime: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 "
                  />
                </Field>

                <Field label="The invoice data date and time">
                  <input
                    type="datetime-local"
                    value={formData.invoice_creation_datetime}
                    onChange={(e) => setFormData({ ...formData, invoice_creation_datetime: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 "
                  />
                </Field>

                <Field label="Name">
                  <input
                    type="text"
                    value={formData.member_name}
                    onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 "
                    placeholder="Enter member name"
                  />
                  <ErrorMessage error={errors.member_name} />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={formData.member_email}
                    onChange={(e) => setFormData({ ...formData, member_email: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                    placeholder="Enter email address"
                  />
                  <ErrorMessage error={errors.member_email} />
                </Field>

                <Field label="Contact">
                  <input
                    type="text"
                    value={formData.member_contact}
                    onChange={(e) => setFormData({ ...formData, member_contact: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter contact number"
                  />
                  <ErrorMessage error={errors.member_contact} />
                </Field>

                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={formData.member_dob}
                    onChange={(e) => setFormData({ ...formData, member_dob: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Sex">
                  <select
                    value={formData.member_sex}
                    onChange={(e) => setFormData({ ...formData, member_sex: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </Field>

                <Field label="Member Remarks">
                  <textarea
                    value={formData.member_remarks}
                    onChange={(e) => setFormData({ ...formData, member_remarks: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter member remarks"
                    rows={3}
                  />
                </Field>
              </div>

              {/* Invoice Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>

                <MembershipSelect
                  label="Membership Type"
                  value={formData.membership_type_id}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      membership_type_id: value,
                    }))
                  }
                />

                <Field label="Manual Invoice Number">
                  <input
                    type="text"
                    value={formData.manual_invoice_no}
                    onChange={(e) => setFormData({ ...formData, manual_invoice_no: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter invoice number"
                  />
                </Field>

                <Field label="Invoice Amount">
                  <input
                    type="number"
                    value={formData.total_invoice_amount}
                    onChange={(e) => setFormData({ ...formData, total_invoice_amount: parseFloat(e.target.value) })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    step="0.01"
                  />
                </Field>

                <Field label="Stored Value Balance">
                  <input
                    type="number"
                    value={formData.stored_value_balance}
                    onChange={(e) => setFormData({ ...formData, stored_value_balance: parseFloat(e.target.value) })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    step="0.01"
                  />
                </Field>

                <EmployeeSelect
                  label="Employee in Charge of Invoice"
                  value={formData.employee_in_charge_of_invoice_employee_id}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      employee_in_charge_of_invoice_employee_id: value,
                    }))
                  }
                />

                <Field label="Invoice Remarks">
                  <textarea
                    value={formData.invoice_remarks}
                    onChange={(e) => setFormData({ ...formData, invoice_remarks: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter invoice remarks"
                    rows={3}
                  />
                </Field>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <Button
                    type="button"
                    onClick={addPaymentMethod}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Add Payment Method
                  </Button>
                </div>

                {formData.payment_methods.map((method, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md grid grid-cols-2 gap-4 bg-gray-50">
                    <PaymentMethodSelect method={method} index={index} updatePaymentMethod={updatePaymentMethod} />

                    <Field label="Amount">
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value))}
                        className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        step="0.01"
                      />
                      <ErrorMessage error={errors.payment_methods} />
                    </Field>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className={`w-full py-3 rounded-md ${
                  isFormValid
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isFormValid}
              >
                Next
              </Button>
            </form>
          )}

          {currentPage === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
                  <Button
                    type="button"
                    onClick={addEmployee}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Add Employee
                  </Button>
                </div>

                {formData.employee_ids.map((employee, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md grid grid-cols-2 gap-4 bg-gray-50">
                    <EmployeeSelect
                      label="Employee"
                      value={formData.employee_ids[index].employee_id}
                      onChange={(value) => updateEmployee(index, 'employee_id', value)}
                    />

                    <Field label="Sharing Ratio (%)">
                      <input
                        type="number"
                        value={employee.sharing_ratio}
                        onChange={(e) => updateEmployee(index, 'sharing_ratio', parseInt(e.target.value))}
                        className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </Field>
                    <ErrorMessage error={errors.employee_sharing} />
                  </div>
                ))}

                <PreviewTable />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentPage(1)}
                  className={`w-1/2 py-3 rounded-md ${
                    isFormValid
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    console.log('Final submit:', formData);
                    handleFinalSubmit();
                  }}
                  className={`w-1/2 py-3 rounded-md ${
                    isFormValid
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMemberForm;

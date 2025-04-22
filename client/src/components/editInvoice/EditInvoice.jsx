import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/interceptors/axios';
import { validateInvoiceFields, sanitizeInvoiceData } from '@/utils/invoiceValidation';

const EditInvoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        manualInvoiceNo: '',
        memberName: '',
        totalAmount: 0,
        paymentAmount: 0,
        outstandingAmount: 0,
        status: '',
        invoiceDate: '',
        invoiceRemark: '',
        items: []
    });

    // Add this to your state declarations
    const [fieldErrors, setFieldErrors] = useState({});

    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [memberSearchInput, setMemberSearchInput] = useState('');

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/ci/list/${id}`);
            const invoiceData = response.data.data;
            setInvoice(invoiceData);

            // Initialize form data including items
            setFormData({
                manualInvoiceNo: invoiceData.manual_invoice_no || '',
                memberName: invoiceData.member?.name || '',
                totalAmount: invoiceData.total_invoice_amount || 0,
                paymentAmount: invoiceData.total_paid_amount || 0,
                outstandingAmount: invoiceData.outstanding_total_payment_amount || 0,
                status: invoiceData.invoice_status || '',
                invoiceDate: new Date(invoiceData.invoice_created_at).toISOString().slice(0, 16),
                invoiceRemark: invoiceData.invoice_remark || '',
                items: invoiceData.items || []
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch invoice details');
            console.error('Error fetching invoice:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/ci/getAllMembers');
            const membersData = response.data.data.map((member) => ({
                id: member.member_id.toString(),
                name: member.member_name,
                email: member.member_email,
            }));
            setMembers(membersData);
            setFilteredMembers(membersData);
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            let updates = {
                [name]: ['totalAmount', 'paymentAmount'].includes(name) ? Number(value) : value
            };

            // Handle payment amount validation and outstanding calculation
            if (name === 'paymentAmount') {
                const paymentAmount = Number(value);
                const totalAmount = prev.totalAmount;

                if (paymentAmount > totalAmount) {
                    setFieldErrors(prev => ({
                        ...prev,
                        paymentAmount: 'Payment amount cannot exceed total amount'
                    }));
                    return prev;
                }

                const newOutstandingAmount = totalAmount - paymentAmount;

                // Automatically set status based on outstanding amount and packages
                if (newOutstandingAmount === 0) {
                    updates.status = 'Invoice_Paid';
                } else if (hasPackages()) {
                    updates.status = 'Invoice_Partially_Paid';
                } else {
                    updates.status = 'Invoice_Unpaid';
                }

                updates = {
                    ...updates,
                    outstandingAmount: newOutstandingAmount
                };
            }

            // Handle status changes
            if (name === 'status') {
                if (value === 'Invoice_Partially_Paid' && !hasPackages()) {
                    setFieldErrors(prev => ({
                        ...prev,
                        status: 'Partial payment is only allowed for invoices with packages'
                    }));
                    return prev;
                }

                if (prev.outstandingAmount === 0 && value !== 'Invoice_Paid') {
                    setFieldErrors(prev => ({
                        ...prev,
                        status: 'Status must be Paid when outstanding amount is 0'
                    }));
                    return prev;
                }
            }

            // Clear error for the field being edited
            setFieldErrors(prev => ({
                ...prev,
                [name]: undefined
            }));

            return {
                ...prev,
                ...updates
            };
        });
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const updatedItems = [...prev.items];
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: value
            };

            // Recalculate totals
            const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            return {
                ...prev,
                items: updatedItems,
                totalAmount: newTotal,
                outstandingAmount: newTotal - prev.paymentAmount
            };
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => {
            const updatedItems = prev.items.filter((_, i) => i !== index);
            const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            return {
                ...prev,
                items: updatedItems,
                totalAmount: newTotal,
                outstandingAmount: newTotal - prev.paymentAmount
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const errors = validateInvoiceFields(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please correct the errors in the form');
            return;
        }

        try {
            setUpdating(true);
            setError(null);
            setSuccess(false);

            const sanitizedData = sanitizeInvoiceData(formData);

            // Find the selected member from the members array
            const selectedMember = members.find(m => m.name === sanitizedData.memberName);

            if (!selectedMember) {
                setError('Selected member not found');
                return;
            }

            const response = await api.put(`/ci/update/${id}`, {
                manual_invoice_no: sanitizedData.manualInvoiceNo,
                member_id: selectedMember.id,
                member_name: sanitizedData.memberName,
                total_invoice_amount: sanitizedData.totalAmount,
                total_payment_amount: sanitizedData.paymentAmount,
                outstanding_total_payment_amount: sanitizedData.outstandingAmount,
                invoice_status: sanitizedData.status,
                invoice_created_at: sanitizedData.invoiceDate,
                invoice_remark: sanitizedData.invoiceRemark,
                items: sanitizedData.items
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/invoices');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update invoice');
            console.error('Error updating invoice:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleMemberSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setMemberSearchInput(value);

        const filtered = members.filter(
            (member) => member.name.toLowerCase().includes(value) || member.email.toLowerCase().includes(value)
        );
        setFilteredMembers(filtered);
    };

    const hasPackages = () => {
        return formData.items.some(item =>
            item.item_type === 'Member_Care_Package' || item.member_care_package_id
        );
    };

    const handleMemberSelect = async (selectedMember) => {
        setFormData(prev => ({
            ...prev,
            memberName: selectedMember.name,
            memberId: selectedMember.id
        }));
        setMemberSearchInput('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-gray-600">Loading invoice details...</div>
                </div>
            </div>
        );
    }

    if (error && !invoice) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
                    <div className="text-gray-600">{error}</div>
                    <button
                        onClick={() => navigate('/invoices')}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                        Back to Invoices
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/invoices')}
                            className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Invoices
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Invoice #{invoice?.manual_invoice_no}
                        </h1>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                            Invoice updated successfully! Redirecting...
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Manual Invoice Number
                                </label>
                                <input
                                    type="text"
                                    name="manualInvoiceNo"
                                    value={formData.manualInvoiceNo}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.manualInvoiceNo ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                />
                                {fieldErrors.manualInvoiceNo && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.manualInvoiceNo}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Member Name
                                </label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={memberSearchInput}
                                        onChange={handleMemberSearch}
                                        placeholder="Search members..."
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                    />
                                    <select
                                        name="memberName"
                                        value={formData.memberName}
                                        onChange={handleInputChange}
                                        className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                            ${fieldErrors.memberName ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                    >
                                        <option value="">Select Member</option>
                                        {filteredMembers.map((member) => (
                                            <option key={member.id} value={member.name}>
                                                {member.name} ({member.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {fieldErrors.memberName && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.memberName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Total Amount
                                </label>
                                <input
                                    type="number"
                                    name="totalAmount"
                                    value={formData.totalAmount}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.totalAmount ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                />
                                {fieldErrors.totalAmount && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.totalAmount}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Amount
                                </label>
                                <input
                                    type="number"
                                    name="paymentAmount"
                                    value={formData.paymentAmount}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.paymentAmount ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                />
                                {fieldErrors.paymentAmount && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.paymentAmount}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Outstanding Amount
                                </label>
                                <input
                                    type="number"
                                    name="outstandingAmount"
                                    value={formData.outstandingAmount}
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-white text-black shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.status ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                >
                                    <option value="Invoice_Unpaid" disabled={formData.outstandingAmount === 0}>Unpaid</option>
                                    <option value="Invoice_Paid">Paid</option>
                                    <option value="Invoice_Partially_Paid" disabled={!hasPackages() || formData.outstandingAmount === 0}>Partial</option>
                                    <option value="Invoice_Refund">Refund</option>
                                </select>
                                {fieldErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Invoice Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="invoiceDate"
                                    value={formData.invoiceDate}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.invoiceDate ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                />
                                {fieldErrors.invoiceDate && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.invoiceDate}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Invoice Remark
                                </label>
                                <textarea
                                    name="invoiceRemark"
                                    value={formData.invoiceRemark}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                                        ${fieldErrors.invoiceRemark ? 'border-red-300' : 'border-gray-300'} bg-white text-black`}
                                />
                                {fieldErrors.invoiceRemark && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.invoiceRemark}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="col-span-2 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
                            <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-white">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {formData.items.map((item, index) => {
                                            const isPackageService = item.member_care_package_id && item.service_name;
                                            const isPackage = item.item_type === 'Member_Care_Package';

                                            return (
                                                <tr key={index} className={isPackageService ? 'bg-blue-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {item.service_name || item.product_name || (
                                                            <div>
                                                                <span>Care Package</span>
                                                                <span className="block text-xs text-gray-500">
                                                                    ID: {item.member_care_package_id}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {isPackageService && (
                                                            <span className="block text-xs text-blue-600">
                                                                Part of Package ID: {item.member_care_package_id}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {isPackage ? 'Care Package' : item.item_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                                                            min="1"
                                                            disabled={isPackageService} // Disable editing for package services
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={item.custom_unit_price}
                                                            onChange={(e) => handleItemChange(index, 'custom_unit_price', e.target.value)}
                                                            className="w-24 text-right border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                                                            min="0"
                                                            step="0.01"
                                                            disabled={isPackageService} // Disable editing for package services
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={item.discount_percentage}
                                                            onChange={(e) => handleItemChange(index, 'discount_percentage', e.target.value)}
                                                            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            disabled={isPackageService}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-black">
                                                        ${Number(item.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {!isPackageService && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/invoices')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                disabled={updating}
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditInvoice;